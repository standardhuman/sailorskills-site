/**
 * Schedule System Setup Checklist
 * Verifies all components are properly configured
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

console.log('🎯 Schedule System Setup Checklist\n');
console.log('================================================\n');

let allGood = true;

// 1. Check Supabase Configuration
console.log('1️⃣  Supabase Configuration');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (supabaseUrl && supabaseKey) {
  console.log('   ✅ Supabase credentials configured');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test connection and check for booking tables
    const { data: tables, error } = await supabase
      .from('service_types')
      .select('count');

    if (error) {
      console.log('   ⚠️  Warning: Could not query service_types table');
      console.log('      This table might not exist yet. Run migration: supabase/migrations/03_booking_system.sql');
      allGood = false;
    } else {
      console.log('   ✅ Database connected and booking tables accessible');
    }
  } catch (error) {
    console.log('   ❌ Error connecting to Supabase:', error.message);
    allGood = false;
  }
} else {
  console.log('   ❌ Supabase credentials missing');
  allGood = false;
}
console.log('');

// 2. Check Google Calendar Configuration
console.log('2️⃣  Google Calendar API');
const hasGoogleClientId = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'placeholder';
const hasGoogleClientSecret = process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET !== 'placeholder';
const hasGoogleRefreshToken = process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_REFRESH_TOKEN !== 'placeholder';
const hasGoogleCalendarId = process.env.GOOGLE_CALENDAR_ID;

if (hasGoogleClientId) {
  console.log('   ✅ GOOGLE_CLIENT_ID set');
} else {
  console.log('   ❌ GOOGLE_CLIENT_ID not configured');
  allGood = false;
}

if (hasGoogleClientSecret) {
  console.log('   ✅ GOOGLE_CLIENT_SECRET set');
} else {
  console.log('   ❌ GOOGLE_CLIENT_SECRET not configured');
  allGood = false;
}

if (hasGoogleRefreshToken) {
  console.log('   ✅ GOOGLE_REFRESH_TOKEN set');
} else {
  console.log('   ❌ GOOGLE_REFRESH_TOKEN not configured');
  console.log('      Run: node scripts/generate-google-token.js');
  allGood = false;
}

if (hasGoogleCalendarId) {
  console.log('   ✅ GOOGLE_CALENDAR_ID set');
} else {
  console.log('   ⚠️  GOOGLE_CALENDAR_ID using default (primary)');
}

if (!hasGoogleClientId || !hasGoogleClientSecret || !hasGoogleRefreshToken) {
  console.log('   📖 See: GOOGLE_CALENDAR_SETUP.md');
}
console.log('');

// 3. Check Email Configuration
console.log('3️⃣  Email Configuration');
const hasGmail = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;
const hasSendGrid = process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'placeholder';
const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD;
const hasEmailFrom = process.env.EMAIL_FROM;

if (hasGmail) {
  console.log('   ✅ Gmail configured');
} else if (hasSendGrid) {
  console.log('   ✅ SendGrid configured');
} else if (hasSmtp) {
  console.log('   ✅ Custom SMTP configured');
} else {
  console.log('   ❌ No email provider configured');
  allGood = false;
}

if (hasEmailFrom) {
  console.log('   ✅ EMAIL_FROM set:', process.env.EMAIL_FROM);
} else {
  console.log('   ❌ EMAIL_FROM not set');
  allGood = false;
}

if (!hasGmail && !hasSendGrid && !hasSmtp) {
  console.log('   📖 See: EMAIL_SETUP.md');
}

if (hasEmailFrom && (hasGmail || hasSendGrid || hasSmtp)) {
  console.log('   💡 Test with: node scripts/test-email.js');
}
console.log('');

// 4. Check Server Configuration
console.log('4️⃣  Server Configuration');
const hasPort = process.env.PORT;
const hasAppUrl = process.env.VITE_APP_URL;

if (hasPort || hasAppUrl) {
  console.log('   ✅ Server configuration found');
  if (hasAppUrl) {
    console.log('      App URL:', process.env.VITE_APP_URL);
  }
} else {
  console.log('   ⚠️  No PORT or VITE_APP_URL set (using defaults)');
}
console.log('');

// 5. Check Files Exist
console.log('5️⃣  Required Files');
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const requiredFiles = [
  'schedule/schedule.html',
  'schedule/schedule.js',
  'schedule/schedule.css',
  'api/calendar.js',
  'src/calendar-utils.js',
  'src/email-utils.js',
  'supabase/migrations/03_booking_system.sql',
  'server.js',
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = join(rootDir, file);
  if (existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} not found`);
    allFilesExist = false;
    allGood = false;
  }
}
console.log('');

// Summary
console.log('================================================\n');
if (allGood && allFilesExist) {
  console.log('✅ All checks passed! Your booking system is ready.\n');
  console.log('Next steps:');
  console.log('1. Start the server: npm run start');
  console.log('2. Visit: http://localhost:3000/schedule');
  console.log('3. Run tests: npx playwright test tests/test-schedule-booking.spec.js\n');
} else {
  console.log('❌ Setup incomplete. Please address the issues above.\n');
  console.log('Setup guides:');
  console.log('- Google Calendar: GOOGLE_CALENDAR_SETUP.md');
  console.log('- Email: EMAIL_SETUP.md');
  console.log('- Database: supabase/migrations/03_booking_system.sql\n');
  process.exit(1);
}
