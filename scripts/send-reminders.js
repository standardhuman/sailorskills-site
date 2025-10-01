#!/usr/bin/env node

/**
 * Send Booking Reminders
 * Run this script via cron job to send reminder emails
 *
 * Cron examples:
 * - Every hour: 0 * * * * node scripts/send-reminders.js
 * - Every 30 minutes: */30 * * * * node scripts/send-reminders.js
 */

import { sendBookingReminder } from '../src/email-utils.js';
import dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Get bookings that need reminders
 * TODO: Replace with actual Supabase query in Phase 4
 */
async function getBookingsNeedingReminders() {
  // This is a placeholder - will be replaced with Supabase query
  // Query should find:
  // 1. Bookings with booking_start in 24 hours (+/- 30 min window) where reminder_sent_24h = false
  // 2. Bookings with booking_start in 1 hour (+/- 10 min window) where reminder_sent_1h = false

  console.log('📅 Checking for bookings needing reminders...');

  // Example query structure for Phase 4:
  /*
  const { data: bookings24h, error: error24h } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .eq('reminder_sent_24h', false)
    .gte('booking_start', new Date(Date.now() + 23.5 * 60 * 60 * 1000).toISOString())
    .lte('booking_start', new Date(Date.now() + 24.5 * 60 * 60 * 1000).toISOString());

  const { data: bookings1h, error: error1h } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .eq('reminder_sent_1h', false)
    .gte('booking_start', new Date(Date.now() + 50 * 60 * 1000).toISOString())
    .lte('booking_start', new Date(Date.now() + 70 * 60 * 1000).toISOString());
  */

  return {
    bookings24h: [],
    bookings1h: []
  };
}

/**
 * Mark reminder as sent in database
 */
async function markReminderSent(bookingId, reminderType) {
  // TODO: Update Supabase in Phase 4
  /*
  const field = reminderType === 24 ? 'reminder_sent_24h' : 'reminder_sent_1h';
  await supabase
    .from('bookings')
    .update({ [field]: true })
    .eq('id', bookingId);
  */
  console.log(`✓ Marked ${reminderType}h reminder as sent for booking ${bookingId}`);
}

/**
 * Main reminder sending function
 */
async function sendReminders() {
  try {
    console.log('🚀 Starting reminder email job...\n');

    const { bookings24h, bookings1h } = await getBookingsNeedingReminders();

    // Send 24-hour reminders
    if (bookings24h.length > 0) {
      console.log(`📧 Sending ${bookings24h.length} 24-hour reminder(s)...`);

      for (const booking of bookings24h) {
        try {
          await sendBookingReminder(booking, 24);
          await markReminderSent(booking.id, 24);
          console.log(`  ✓ Sent 24h reminder to ${booking.customer_email}`);
        } catch (error) {
          console.error(`  ✗ Failed to send 24h reminder for booking ${booking.id}:`, error.message);
        }
      }
    } else {
      console.log('No 24-hour reminders to send');
    }

    // Send 1-hour reminders
    if (bookings1h.length > 0) {
      console.log(`\n📧 Sending ${bookings1h.length} 1-hour reminder(s)...`);

      for (const booking of bookings1h) {
        try {
          await sendBookingReminder(booking, 1);
          await markReminderSent(booking.id, 1);
          console.log(`  ✓ Sent 1h reminder to ${booking.customer_email}`);
        } catch (error) {
          console.error(`  ✗ Failed to send 1h reminder for booking ${booking.id}:`, error.message);
        }
      }
    } else {
      console.log('No 1-hour reminders to send');
    }

    console.log('\n✅ Reminder job completed successfully\n');

  } catch (error) {
    console.error('\n❌ Reminder job failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  sendReminders();
}

export { sendReminders };
