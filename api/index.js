import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { 
  handleCreateBookingPayment, 
  handleBookingSuccess,
  sendBookingReminders 
} from './booking-system.js';

const app = express();

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

// For Vercel serverless deployment
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}