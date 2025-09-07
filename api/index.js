import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { 
  handleCreateBookingPayment, 
  handleBookingSuccess,
  sendBookingReminders 
} from './booking-system.js';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

// Booking endpoints
app.post('/api/create-booking-payment', handleCreateBookingPayment);
app.get('/api/booking-success', handleBookingSuccess);

// Admin endpoint to trigger reminders (could be scheduled with cron)
app.post('/api/send-reminders', async (req, res) => {
  try {
    await sendBookingReminders();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fetch Stripe customers with improved search
app.get('/api/stripe-customers', async (req, res) => {
  try {
    const { search, limit = 10 } = req.query;
    
    let customers;
    if (search) {
      // First try Stripe's search API
      customers = await stripe.customers.search({
        query: `email~"${search}" OR name~"${search}"`,
        limit: 100
      });
      customers = customers.data;
      
      // If no exact matches, fetch all and do partial matching
      if (customers.length === 0) {
        const allCustomers = await stripe.customers.list({
          limit: 100
        });
        
        // Skip the first pass filtering - we'll check everything including billing details in Step 3
        customers = allCustomers.data;
      }
    } else {
      // Get recent customers
      customers = await stripe.customers.list({
        limit: parseInt(limit)
      });
      customers = customers.data;
    }

    // Get payment methods and check billing details
    const customersWithPaymentMethods = [];
    
    for (const customer of customers) {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card',
        limit: 1
      });
      
      // If searching, also check billing details name and metadata
      let includeCustomer = true;
      
      // Prefer billing details name if it has more words (likely includes last name)
      const billingName = paymentMethods.data[0]?.billing_details?.name || '';
      const customerName = customer.name || '';
      const boatName = customer.metadata?.boat_name || '';
      
      // Use billing name if it has more words (e.g., "Brian Cline" vs "Brian")
      let displayName = customerName;
      if (billingName && billingName.split(' ').length > (customerName.split(' ').length || 0)) {
        displayName = billingName;
      } else if (!customerName && billingName) {
        displayName = billingName;
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        const searchTerms = searchLower.split(' ').filter(term => term.length > 0);
        const customerNameLower = customerName.toLowerCase();
        const customerEmail = (customer.email || '').toLowerCase();
        const billingNameLower = billingName.toLowerCase();
        const boatNameLower = boatName.toLowerCase();
        
        // Check if search matches customer data, billing name, or boat name
        const customerMatch = searchTerms.every(term => 
          customerNameLower.includes(term) || customerEmail.includes(term)
        );
        
        const billingMatch = searchTerms.every(term => 
          billingNameLower.includes(term)
        );
        
        const boatMatch = searchTerms.every(term => 
          boatNameLower.includes(term)
        );
        
        includeCustomer = customerMatch || billingMatch || boatMatch ||
                         customerNameLower.includes(searchLower) || 
                         customerEmail.includes(searchLower) ||
                         billingNameLower.includes(searchLower) ||
                         boatNameLower.includes(searchLower);
      }
      
      if (includeCustomer) {
        customersWithPaymentMethods.push({
          id: customer.id,
          name: displayName || 'Unknown',
          email: customer.email,
          boat_name: boatName || null,
          payment_method: paymentMethods.data[0] || null,
          created: customer.created
        });
      }
      
      // Stop if we have enough results
      if (customersWithPaymentMethods.length >= parseInt(limit)) {
        break;
      }
    }

    res.json({ customers: customersWithPaymentMethods });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Charge existing customer
app.post('/api/charge-customer', async (req, res) => {
  try {
    const { customerId, amount, description, metadata } = req.body;

    if (!customerId || !amount) {
      return res.status(400).json({ error: 'Customer ID and amount are required' });
    }

    // Get customer's default payment method
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
      limit: 1
    });

    if (!paymentMethods.data.length) {
      return res.status(400).json({ error: 'Customer has no payment method on file' });
    }

    // Update customer metadata with boat name if provided
    if (metadata && metadata.boat_name) {
      try {
        // Get existing customer metadata
        const customer = await stripe.customers.retrieve(customerId);
        const existingMetadata = customer.metadata || {};
        
        // Update with boat name (this will preserve other metadata)
        await stripe.customers.update(customerId, {
          metadata: {
            ...existingMetadata,
            boat_name: metadata.boat_name
          }
        });
      } catch (updateError) {
        console.error('Failed to update customer metadata:', updateError);
        // Continue with payment even if metadata update fails
      }
    }

    // Create and confirm payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethods.data[0].id,
      description: description || 'Diving service',
      metadata: metadata || {},
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      }
    });

    if (paymentIntent.status === 'succeeded') {
      res.json({ 
        success: true, 
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status
        }
      });
    } else {
      res.json({ 
        success: false, 
        error: `Payment status: ${paymentIntent.status}` 
      });
    }
  } catch (error) {
    console.error('Error charging customer:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to charge customer' 
    });
  }
});

// For Vercel serverless deployment
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}