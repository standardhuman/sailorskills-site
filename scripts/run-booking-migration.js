#!/usr/bin/env node

/**
 * Run Booking System Database Migration
 * Executes the 03_booking_system.sql migration against Supabase
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/03_booking_system.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 Running Booking System Migration...\n');
console.log('Project:', SUPABASE_URL);
console.log('Migration file:', migrationPath);
console.log('\n');

// Execute SQL via Supabase REST API
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
const apiUrl = `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`;

const data = JSON.stringify({ query: sql });

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Prefer': 'return=representation'
  }
};

// Try using pg-meta API instead
const pgMetaUrl = `https://${projectRef}.supabase.co/pg-meta/query`;

const pgOptions = {
  method: 'POST',
  hostname: `${projectRef}.supabase.co`,
  path: '/pg-meta/query',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`
  }
};

const reqData = JSON.stringify({ query: sql });

const req = https.request(pgOptions, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('\n✅ Migration completed successfully!\n');

      try {
        const result = JSON.parse(body);
        console.log('Response:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('Response:', body);
      }

      console.log('\n📋 Tables that should now exist:');
      console.log('  - service_types (with 7 service options)');
      console.log('  - business_hours (Mon-Sat 8AM-6PM)');
      console.log('  - booking_settings (8 default settings)');
      console.log('  - bookings (main appointments table)');
      console.log('  - booking_history (audit trail)');
      console.log('  - blackout_dates (holidays/vacations)');
      console.log('\n✨ Next steps:');
      console.log('  1. Set up Google Calendar OAuth');
      console.log('  2. Configure email provider');
      console.log('  3. Test booking flow');
    } else {
      console.error('\n❌ Migration failed!');
      console.error('Status:', res.statusCode);
      console.error('Response:', body);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request failed:', error.message);
  process.exit(1);
});

req.write(reqData);
req.end();
