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

// Fetch Stripe customers
app.get('/api/stripe-customers', async (req, res) => {
  try {
    const { search, limit = 10 } = req.query;
    
    let customers;
    if (search) {
      // Search customers by email or name
      customers = await stripe.customers.search({
        query: `email~"${search}" OR name~"${search}"`,
        limit: parseInt(limit)
      });
      customers = customers.data;
    } else {
      // Get recent customers
      customers = await stripe.customers.list({
        limit: parseInt(limit)
      });
      customers = customers.data;
    }

    // Get payment methods for each customer
    const customersWithPaymentMethods = await Promise.all(
      customers.map(async (customer) => {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customer.id,
          type: 'card',
          limit: 1
        });
        
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          payment_method: paymentMethods.data[0] || null,
          created: customer.created
        };
      })
    );

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