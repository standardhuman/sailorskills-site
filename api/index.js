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

// Create new customer
app.post('/api/create-customer', async (req, res) => {
  try {
    const { name, email, phone, description, metadata } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Name and email are required' 
      });
    }
    
    // Create customer in Stripe
    const customer = await stripe.customers.create({
      name,
      email,
      phone,
      description,
      metadata
    });
    
    console.log('Created new customer:', customer.id);
    
    res.json({ 
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        metadata: customer.metadata
      }
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create customer' 
    });
  }
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

// Create setup intent for adding payment method
app.post('/api/create-setup-intent', async (req, res) => {
  try {
    const { customerId } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    // Create a SetupIntent for this customer
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // Allow charging when customer not present
    });
    
    res.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: error.message || 'Failed to create setup intent' });
  }
});

// Attach payment method to customer
app.post('/api/attach-payment-method', async (req, res) => {
  try {
    const { customerId, paymentMethodId } = req.body;
    
    if (!customerId || !paymentMethodId) {
      return res.status(400).json({ error: 'Customer ID and Payment Method ID are required' });
    }
    
    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    
    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    
    res.json({ success: true, message: 'Payment method added successfully' });
  } catch (error) {
    console.error('Error attaching payment method:', error);
    res.status(500).json({ error: error.message || 'Failed to attach payment method' });
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

    // Update customer metadata with service details if provided
    if (metadata) {
      try {
        // Get existing customer metadata
        const customer = await stripe.customers.retrieve(customerId);
        const existingMetadata = customer.metadata || {};
        
        // Prepare metadata to update on customer record
        const customerMetadataUpdate = {};
        
        // Add boat details
        if (metadata.boat_name) customerMetadataUpdate.boat_name = metadata.boat_name;
        if (metadata.boat_length) customerMetadataUpdate.boat_length = metadata.boat_length;
        if (metadata.boat_type) customerMetadataUpdate.boat_type = metadata.boat_type;
        if (metadata.hull_type) customerMetadataUpdate.hull_type = metadata.hull_type;
        
        // Add service history - store last service details
        if (metadata.service_name) {
          customerMetadataUpdate.last_service = metadata.service_name;
          customerMetadataUpdate.last_service_date = metadata.service_date || new Date().toISOString().split('T')[0];
        }
        
        // Add boat condition details (for cleaning services)
        if (metadata.paint_condition) customerMetadataUpdate.paint_condition = metadata.paint_condition;
        if (metadata.growth_level) customerMetadataUpdate.growth_level = metadata.growth_level;
        
        // Add engine configuration
        if (metadata.engine_type) customerMetadataUpdate.engine_type = metadata.engine_type;
        
        // Update customer metadata (this will preserve other metadata)
        if (Object.keys(customerMetadataUpdate).length > 0) {
          await stripe.customers.update(customerId, {
            metadata: {
              ...existingMetadata,
              ...customerMetadataUpdate
            }
          });
        }
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

// Charge customer for anode replacements
app.post('/api/charge-anode', async (req, res) => {
  try {
    const { customerId, amount, description, metadata } = req.body;

    if (!customerId || !amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Customer ID and amount are required' 
      });
    }

    // Get payment methods for customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    if (!paymentMethods.data || paymentMethods.data.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No payment method found for customer' 
      });
    }

    // Create and confirm payment intent for anode replacement
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethods.data[0].id,
      description: description || 'Anode Replacement',
      metadata: {
        type: 'anode_replacement',
        ...metadata
      },
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
    console.error('Error charging for anodes:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to charge for anodes' 
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