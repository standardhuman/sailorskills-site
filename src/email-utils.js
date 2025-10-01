/**
 * Email Utility Functions
 * Handles email sending for booking confirmations and reminders
 */

import nodemailer from 'nodemailer';

/**
 * Create email transporter based on environment configuration
 */
function createTransporter() {
  // Support multiple email providers via environment variables

  // Option 1: Gmail (requires app password)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  // Option 2: SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  // Option 3: Custom SMTP
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  // Development: Log only (no actual emails sent)
  console.warn('⚠️  No email service configured. Emails will be logged only.');
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });
}

/**
 * Send an email
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const transporter = createTransporter();
    const from = process.env.EMAIL_FROM || process.env.GMAIL_USER || 'noreply@sailorskills.com';

    const mailOptions = {
      from: `Sailor Skills <${from}>`,
      to,
      subject,
      html,
      text: text || htmlToText(html)
    };

    const info = await transporter.sendMail(mailOptions);

    // Log for development/debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email sent:', {
        to,
        subject,
        messageId: info.messageId
      });
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation(bookingData) {
  const { customerEmail, customerName, serviceName, startTime, endTime } = bookingData;

  const dateStr = new Date(startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const timeStr = new Date(startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const subject = `Booking Confirmed: ${serviceName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #345475; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #345475; }
        .booking-details h2 { margin-top: 0; color: #345475; font-size: 18px; }
        .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; width: 120px; color: #666; }
        .detail-value { color: #181818; }
        .button { display: inline-block; background: #345475; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .footer a { color: #345475; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✓ Booking Confirmed</h1>
      </div>

      <div class="content">
        <p>Hi ${customerName},</p>

        <p>Thank you for booking with Sailor Skills! Your appointment has been confirmed.</p>

        <div class="booking-details">
          <h2>Booking Details</h2>
          <div class="detail-row">
            <div class="detail-label">Service:</div>
            <div class="detail-value">${serviceName}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date:</div>
            <div class="detail-value">${dateStr}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Time:</div>
            <div class="detail-value">${timeStr}</div>
          </div>
        </div>

        <p><strong>What happens next?</strong></p>
        <ul>
          <li>You'll receive a reminder email 24 hours before your appointment</li>
          <li>We'll send another reminder 1 hour before your appointment</li>
          <li>If you need to reschedule or cancel, please contact us at least 24 hours in advance</li>
        </ul>

        <p>If you have any questions, feel free to reply to this email or call us.</p>

        <p>We look forward to seeing you!</p>

        <p style="margin-top: 30px;">
          <strong>The Sailor Skills Team</strong><br>
          San Francisco Bay
        </p>
      </div>

      <div class="footer">
        <p>
          <a href="https://sailorskills.com">www.sailorskills.com</a><br>
          Professional Maritime Services
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject,
    html
  });
}

/**
 * Send reminder email (24 hours or 1 hour before)
 */
export async function sendBookingReminder(bookingData, hoursBeforeAppointment) {
  const { customerEmail, customerName, serviceName, startTime, endTime, location } = bookingData;

  const dateStr = new Date(startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const timeStr = new Date(startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const reminderType = hoursBeforeAppointment === 24 ? 'tomorrow' : 'in 1 hour';
  const subject = `Reminder: ${serviceName} ${reminderType}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #345475; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #345475; }
        .booking-details h2 { margin-top: 0; color: #345475; font-size: 18px; }
        .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; width: 120px; color: #666; }
        .detail-value { color: #181818; }
        .alert-box { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⏰ Appointment Reminder</h1>
      </div>

      <div class="content">
        <p>Hi ${customerName},</p>

        <p>This is a friendly reminder about your upcoming appointment <strong>${reminderType}</strong>.</p>

        <div class="booking-details">
          <h2>Appointment Details</h2>
          <div class="detail-row">
            <div class="detail-label">Service:</div>
            <div class="detail-value">${serviceName}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date:</div>
            <div class="detail-value">${dateStr}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Time:</div>
            <div class="detail-value">${timeStr}</div>
          </div>
        </div>

        ${hoursBeforeAppointment === 1 ? `
          <div class="alert-box">
            <strong>Your appointment is in 1 hour!</strong><br>
            Please arrive on time or contact us if you need to reschedule.
          </div>
        ` : ''}

        <p><strong>Need to make changes?</strong></p>
        <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>

        <p>We look forward to seeing you!</p>

        <p style="margin-top: 30px;">
          <strong>The Sailor Skills Team</strong><br>
          San Francisco Bay
        </p>
      </div>

      <div class="footer">
        <p>
          <a href="https://sailorskills.com">www.sailorskills.com</a><br>
          Professional Maritime Services
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject,
    html
  });
}

/**
 * Send cancellation email
 */
export async function sendCancellationEmail(bookingData) {
  const { customerEmail, customerName, serviceName, startTime } = bookingData;

  const dateStr = new Date(startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `Booking Cancelled: ${serviceName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Booking Cancelled</h1>
      </div>

      <div class="content">
        <p>Hi ${customerName},</p>

        <p>Your booking for <strong>${serviceName}</strong> on <strong>${dateStr}</strong> has been cancelled.</p>

        <p>If this was a mistake or you'd like to reschedule, please visit our website or contact us directly.</p>

        <p>Thank you,<br>
        <strong>The Sailor Skills Team</strong></p>
      </div>

      <div class="footer">
        <a href="https://sailorskills.com">www.sailorskills.com</a>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject,
    html
  });
}

/**
 * Simple HTML to text conversion
 */
function htmlToText(html) {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gs, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
