import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize services
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize SendGrid only if API key is provided
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'placeholder') {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio only if credentials are provided
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && 
                      process.env.TWILIO_AUTH_TOKEN && 
                      process.env.TWILIO_ACCOUNT_SID !== 'placeholder' &&
                      process.env.TWILIO_AUTH_TOKEN !== 'placeholder')
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Google Calendar setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials if we have a refresh token
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
}

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Create Google Calendar Event
export async function createCalendarEvent(booking, serviceType) {
  try {
    const event = {
      summary: `${serviceType.name} - ${booking.customer_name}`,
      description: `
        Booking Details:
        Customer: ${booking.customer_name}
        Email: ${booking.customer_email}
        Phone: ${booking.customer_phone || 'Not provided'}
        Participants: ${booking.participants}
        Notes: ${booking.notes || 'None'}
        Total Price: $${booking.total_price}
      `,
      start: {
        dateTime: `${booking.booking_date}T${booking.start_time}`,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: `${booking.booking_date}T${booking.end_time}`,
        timeZone: 'America/New_York',
      },
      attendees: [
        { email: booking.customer_email },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      resource: event,
      sendNotifications: true,
    });

    // Update booking with Google Event ID
    await supabase
      .from('bookings')
      .update({ google_event_id: response.data.id })
      .eq('id', booking.id);

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Send Email Confirmation
export async function sendEmailConfirmation(booking, serviceType) {
  const confirmationHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmation</h1>
        </div>
        <div class="content">
          <p>Dear ${booking.customer_name},</p>
          <p>Your booking has been confirmed! We're looking forward to seeing you.</p>
          
          <div class="details">
            <h2>Booking Details</h2>
            <div class="detail-row">
              <strong>Service:</strong>
              <span>${serviceType.name}</span>
            </div>
            <div class="detail-row">
              <strong>Date:</strong>
              <span>${new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="detail-row">
              <strong>Time:</strong>
              <span>${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</span>
            </div>
            <div class="detail-row">
              <strong>Duration:</strong>
              <span>${serviceType.duration_hours} hour${serviceType.duration_hours > 1 ? 's' : ''}</span>
            </div>
            <div class="detail-row">
              <strong>Participants:</strong>
              <span>${booking.participants}</span>
            </div>
            <div class="detail-row">
              <strong>Total Price:</strong>
              <span>${booking.total_price === 0 ? 'Free' : `$${booking.total_price}`}</span>
            </div>
          </div>
          
          ${booking.notes ? `
          <div class="details">
            <h3>Additional Notes</h3>
            <p>${booking.notes}</p>
          </div>
          ` : ''}
          
          <p><strong>Important:</strong> You will receive a reminder 24 hours before your session.</p>
          
          <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
          
          <div class="footer">
            <p>Thank you for choosing our services!</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const msg = {
    to: booking.customer_email,
    from: process.env.SENDER_EMAIL || 'noreply@sailorskills.com',
    subject: `Booking Confirmation - ${serviceType.name}`,
    html: confirmationHtml,
  };

  try {
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'placeholder') {
      await sgMail.send(msg);
    } else {
      console.log('SendGrid not configured - Email would be sent to:', booking.customer_email);
      console.log('Subject:', msg.subject);
    }
    
    // Update booking confirmation sent timestamp
    await supabase
      .from('bookings')
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq('id', booking.id);
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Send SMS Confirmation
export async function sendSMSConfirmation(booking, serviceType) {
  if (!twilioClient || !booking.customer_phone) {
    return false;
  }

  const messageBody = `
Booking Confirmed!
${serviceType.name}
Date: ${new Date(booking.booking_date).toLocaleDateString()}
Time: ${formatTime(booking.start_time)}
Participants: ${booking.participants}
Total: ${booking.total_price === 0 ? 'Free' : `$${booking.total_price}`}

We'll send a reminder 24 hours before your session.
  `;

  try {
    await twilioClient.messages.create({
      body: messageBody.trim(),
      from: process.env.TWILIO_PHONE_NUMBER,
      to: booking.customer_phone
    });
    
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

// Send Reminder (Email & SMS)
export async function sendReminder(booking, serviceType) {
  const reminderHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f39c12; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .detail-row { padding: 8px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reminder: Your Session is Tomorrow!</h1>
        </div>
        <div class="content">
          <p>Hi ${booking.customer_name},</p>
          <p>This is a friendly reminder about your upcoming session tomorrow.</p>
          
          <div class="details">
            <div class="detail-row"><strong>Service:</strong> ${serviceType.name}</div>
            <div class="detail-row"><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div class="detail-row"><strong>Time:</strong> ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</div>
            <div class="detail-row"><strong>Duration:</strong> ${serviceType.duration_hours} hour${serviceType.duration_hours > 1 ? 's' : ''}</div>
          </div>
          
          <p>We're looking forward to seeing you!</p>
          
          <div class="footer">
            <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send email reminder
  const emailMsg = {
    to: booking.customer_email,
    from: process.env.SENDER_EMAIL || 'noreply@sailorskills.com',
    subject: `Reminder: ${serviceType.name} - Tomorrow`,
    html: reminderHtml,
  };

  try {
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'placeholder') {
      await sgMail.send(emailMsg);
    } else {
      console.log('SendGrid not configured - Reminder email would be sent to:', booking.customer_email);
    }
    
    // Send SMS reminder if phone number exists
    if (twilioClient && booking.customer_phone) {
      const smsBody = `
Reminder: Your ${serviceType.name} is tomorrow!
Date: ${new Date(booking.booking_date).toLocaleDateString()}
Time: ${formatTime(booking.start_time)}
We're looking forward to seeing you!
      `;
      
      await twilioClient.messages.create({
        body: smsBody.trim(),
        from: process.env.TWILIO_PHONE_NUMBER,
        to: booking.customer_phone
      });
    }
    
    // Update reminder sent timestamp
    await supabase
      .from('bookings')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', booking.id);
    
    return true;
  } catch (error) {
    console.error('Error sending reminder:', error);
    return false;
  }
}

// Helper function to format time
function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// API Handler for creating booking payment session
export async function handleCreateBookingPayment(req, res) {
  const { booking_id, amount, customer_email, service_name } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: service_name,
              description: `Booking payment for ${service_name}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VITE_APP_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking_id}`,
      cancel_url: `${process.env.VITE_APP_URL}/booking`,
      customer_email,
      metadata: {
        booking_id,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating payment session:', error);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
}

// API Handler for processing successful payment
export async function handleBookingSuccess(req, res) {
  const { session_id, booking_id } = req.query;

  try {
    // Verify the payment session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      // Update booking status
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          stripe_payment_intent_id: session.payment_intent
        })
        .eq('id', booking_id)
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Get service type details
      const { data: serviceType } = await supabase
        .from('service_types')
        .select('*')
        .eq('id', booking.service_type_id)
        .single();

      // Create calendar event
      await createCalendarEvent(booking, serviceType);
      
      // Send confirmations
      await sendEmailConfirmation(booking, serviceType);
      await sendSMSConfirmation(booking, serviceType);
      
      res.json({ success: true, booking });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Error processing booking success:', error);
    res.status(500).json({ error: 'Failed to process booking' });
  }
}

// Scheduled job to send reminders (run daily)
export async function sendBookingReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  try {
    // Get tomorrow's bookings that haven't received reminders
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, service_types(*)')
      .eq('booking_date', tomorrowDate)
      .in('status', ['confirmed'])
      .is('reminder_sent_at', null);

    if (error) throw error;

    for (const booking of bookings) {
      await sendReminder(booking, booking.service_types);
    }

    console.log(`Sent reminders for ${bookings.length} bookings`);
  } catch (error) {
    console.error('Error sending booking reminders:', error);
  }
}