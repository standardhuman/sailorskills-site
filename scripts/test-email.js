/**
 * Email Configuration Test Script
 * Tests email sending functionality for booking confirmations
 */

import 'dotenv/config';
import { sendBookingConfirmation } from '../src/email-utils.js';

console.log('🔧 Email Configuration Test\n');

// Check environment variables
console.log('Checking environment variables...');
const hasGmail = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;
const hasSendGrid = process.env.SENDGRID_API_KEY;
const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD;
const hasEmailFrom = process.env.EMAIL_FROM;

console.log(`✓ Gmail configured: ${hasGmail ? 'YES' : 'NO'}`);
console.log(`✓ SendGrid configured: ${hasSendGrid ? 'YES' : 'NO'}`);
console.log(`✓ Custom SMTP configured: ${hasSmtp ? 'YES' : 'NO'}`);
console.log(`✓ EMAIL_FROM set: ${hasEmailFrom ? 'YES' : 'NO'}\n`);

if (!hasGmail && !hasSendGrid && !hasSmtp) {
  console.error('❌ Error: No email provider configured!');
  console.log('\nPlease configure one of the following in your .env file:');
  console.log('\n1. Gmail (easiest for testing):');
  console.log('   GMAIL_USER=your-email@gmail.com');
  console.log('   GMAIL_APP_PASSWORD=your-16-char-app-password');
  console.log('   EMAIL_FROM=your-email@gmail.com');
  console.log('\n2. SendGrid (recommended for production):');
  console.log('   SENDGRID_API_KEY=SG.your-api-key');
  console.log('   EMAIL_FROM=noreply@yourdomain.com');
  console.log('\n3. Custom SMTP:');
  console.log('   SMTP_HOST=smtp.example.com');
  console.log('   SMTP_PORT=587');
  console.log('   SMTP_USER=your-username');
  console.log('   SMTP_PASSWORD=your-password');
  console.log('   EMAIL_FROM=noreply@yourdomain.com\n');
  process.exit(1);
}

if (!hasEmailFrom) {
  console.error('❌ Error: EMAIL_FROM not set!');
  console.log('Please add EMAIL_FROM to your .env file\n');
  process.exit(1);
}

// Test email data
const testBookingData = {
  customerEmail: process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'test@example.com',
  customerName: 'Test Customer',
  serviceName: 'Free Consultation',
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString() // +30 mins
};

console.log('📧 Sending test booking confirmation email...');
console.log(`   To: ${testBookingData.customerEmail}`);
console.log(`   From: ${process.env.EMAIL_FROM}`);
console.log(`   Service: ${testBookingData.serviceName}`);
console.log(`   Start Time: ${new Date(testBookingData.startTime).toLocaleString()}\n`);

try {
  await sendBookingConfirmation(testBookingData);
  console.log('✅ Test email sent successfully!');
  console.log('\nPlease check your inbox to verify the email was received.');
  console.log('If you don\'t see it, check your spam folder.\n');
  process.exit(0);
} catch (error) {
  console.error('❌ Error sending test email:', error.message);
  console.error('\nFull error:', error);
  console.log('\nTroubleshooting tips:');
  console.log('1. Verify your email credentials are correct');
  console.log('2. For Gmail, make sure you\'re using an App Password, not your regular password');
  console.log('3. For SendGrid, verify your API key has "Mail Send" permissions');
  console.log('4. Check that EMAIL_FROM is a verified sender (for SendGrid)');
  console.log('5. Make sure your email provider allows SMTP connections\n');
  process.exit(1);
}
