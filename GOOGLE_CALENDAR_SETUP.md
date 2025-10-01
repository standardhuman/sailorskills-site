# Google Calendar API Setup Guide

Follow these steps to set up Google Calendar API for the booking system.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "Sailor Skills Booking"
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: Sailor Skills Booking
   - User support email: your email
   - Developer contact: your email
   - Scopes: Add `https://www.googleapis.com/auth/calendar` and `https://www.googleapis.com/auth/calendar.events`
   - Add your email as a test user
   - Save and continue
4. Back to "Create OAuth client ID":
   - Application type: Web application
   - Name: Sailor Skills Server
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for local testing)
     - `https://your-vercel-url.vercel.app/api/auth/google/callback` (for production)
   - Click "Create"
5. Download the JSON credentials file

## Step 4: Get Your Calendar ID

1. Go to [Google Calendar](https://calendar.google.com)
2. Click the gear icon → Settings
3. Click on the calendar you want to use (left sidebar)
4. Scroll down to "Integrate calendar"
5. Copy the "Calendar ID" (looks like: your-email@gmail.com or a long ID)

## Step 5: Add Credentials to Environment Variables

From the downloaded JSON file and your Calendar ID, add these to your `.env` file:

```bash
# Google Calendar API Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_CALENDAR_ID=your-calendar-id@gmail.com

# Google Refresh Token (will be generated in next step)
GOOGLE_REFRESH_TOKEN=
```

## Step 6: Generate Refresh Token

After adding the credentials above, run this command to generate a refresh token:

```bash
node scripts/generate-google-token.js
```

This will:
1. Open a browser window
2. Ask you to sign in with Google
3. Request calendar permissions
4. Generate a refresh token
5. Save it to your `.env` file

## Step 7: Verify Setup

Test the calendar integration:

```bash
node scripts/test-calendar-api.js
```

This should:
- Connect to Google Calendar API
- Fetch your calendar events
- Display them in the console

## Troubleshooting

### Error: "Access blocked: This app's request is invalid"
- Make sure you've added your email as a test user in the OAuth consent screen
- Verify the redirect URI matches exactly what you configured

### Error: "Invalid grant"
- Your refresh token may have expired or been revoked
- Regenerate the token using `node scripts/generate-google-token.js`

### Error: "Calendar not found"
- Verify the GOOGLE_CALENDAR_ID is correct
- Make sure the calendar is accessible by the Google account you authenticated with

## Security Notes

- Never commit `.env` file to git (already in .gitignore)
- Keep your client secret secure
- Refresh tokens don't expire unless revoked, but should be rotated periodically
- For production, use Vercel environment variables (not .env file)

## Production Deployment

When deploying to Vercel:

1. Add all environment variables to Vercel project settings
2. Update GOOGLE_REDIRECT_URI to use your Vercel URL
3. Add the Vercel redirect URI to Google Cloud Console
4. Redeploy the application

---

*Last Updated: 2025-09-30*
