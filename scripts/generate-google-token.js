#!/usr/bin/env node

/**
 * Script to generate Google OAuth refresh token
 * Run this once to get a refresh token for server-side calendar access
 */

import { google } from 'googleapis';
import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

async function getRefreshToken() {
  return new Promise((resolve, reject) => {
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Force to get refresh token
    });

    console.log('\n🔐 Opening browser for Google authorization...');
    console.log('If browser doesn\'t open, visit this URL:\n');
    console.log(authorizeUrl + '\n');

    // Create temporary HTTP server to receive the callback
    const server = http.createServer(async (req, res) => {
      try {
        const queryParams = url.parse(req.url, true).query;

        if (queryParams.code) {
          // Exchange authorization code for tokens
          const { tokens } = await oauth2Client.getToken(queryParams.code);

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
                <h1 style="color: #28a745;">✅ Success!</h1>
                <p>Google Calendar authorization complete. You can close this window.</p>
                <p style="color: #666; font-size: 14px;">Your refresh token has been saved to the .env file.</p>
              </body>
            </html>
          `);

          server.close();
          resolve(tokens.refresh_token);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
                <h1 style="color: #dc3545;">❌ Error</h1>
                <p>Authorization failed. Please try again.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error('No authorization code received'));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error during authorization');
        server.close();
        reject(error);
      }
    });

    server.listen(3000, () => {
      open(authorizeUrl).catch(err => {
        console.error('Failed to open browser automatically:', err.message);
      });
    });
  });
}

async function main() {
  try {
    console.log('🚀 Google Calendar OAuth Token Generator\n');

    // Check if required env vars are set
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env file');
      console.error('   Follow GOOGLE_CALENDAR_SETUP.md for instructions');
      process.exit(1);
    }

    const refreshToken = await getRefreshToken();

    // Update .env file with refresh token
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
      // Replace existing token
      envContent = envContent.replace(
        /GOOGLE_REFRESH_TOKEN=.*/,
        `GOOGLE_REFRESH_TOKEN=${refreshToken}`
      );
    } else {
      // Add new token
      envContent += `\nGOOGLE_REFRESH_TOKEN=${refreshToken}\n`;
    }

    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Success! Refresh token saved to .env file');
    console.log('   You can now use the Google Calendar API');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: node scripts/test-calendar-api.js');
    console.log('   2. Start your server and test the booking system\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
