#!/usr/bin/env node

/**
 * Script to test Google Calendar API connection
 * Run this to verify your credentials are working
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testCalendarAPI() {
  try {
    console.log('🧪 Testing Google Calendar API Connection\n');

    // Check required environment variables
    const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_CALENDAR_ID'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.error('❌ Missing environment variables:', missing.join(', '));
      console.error('   Run: node scripts/generate-google-token.js\n');
      process.exit(1);
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    // Create Calendar API client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Test 1: Get calendar info
    console.log('📅 Fetching calendar info...');
    const calendarInfo = await calendar.calendars.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID
    });
    console.log(`✅ Connected to calendar: "${calendarInfo.data.summary}"`);
    console.log(`   Timezone: ${calendarInfo.data.timeZone}\n`);

    // Test 2: Fetch upcoming events
    console.log('📋 Fetching upcoming events...');
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: oneWeekLater.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
    if (events.length === 0) {
      console.log('   No upcoming events found in the next 7 days');
    } else {
      console.log(`   Found ${events.length} upcoming event(s):\n`);
      events.forEach((event, index) => {
        const start = event.start.dateTime || event.start.date;
        const end = event.end.dateTime || event.end.date;
        console.log(`   ${index + 1}. ${event.summary || '(No title)'}`);
        console.log(`      Start: ${start}`);
        console.log(`      End: ${end}\n`);
      });
    }

    // Test 3: Check freebusy
    console.log('🔍 Checking availability for next 3 days...');
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const freebusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: threeDaysLater.toISOString(),
        items: [{ id: process.env.GOOGLE_CALENDAR_ID }]
      }
    });

    const busyTimes = freebusyResponse.data.calendars[process.env.GOOGLE_CALENDAR_ID].busy;
    if (busyTimes.length === 0) {
      console.log('   No busy times found - fully available!');
    } else {
      console.log(`   Found ${busyTimes.length} busy time slot(s):\n`);
      busyTimes.forEach((slot, index) => {
        console.log(`   ${index + 1}. ${slot.start} → ${slot.end}`);
      });
    }

    console.log('\n✅ All tests passed! Google Calendar API is working correctly.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 401) {
      console.error('   Authorization failed. Try regenerating your token:');
      console.error('   node scripts/generate-google-token.js\n');
    } else if (error.code === 404) {
      console.error('   Calendar not found. Check your GOOGLE_CALENDAR_ID in .env\n');
    } else {
      console.error('   Details:', error);
    }
    process.exit(1);
  }
}

testCalendarAPI();
