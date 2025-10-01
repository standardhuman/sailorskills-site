# TODO: Google Calendar Setup

## IMPORTANT: Complete Before Production Launch

Before the booking system can work in production, you must:

1. **Set up Google Cloud Project**
   - Follow instructions in `GOOGLE_CALENDAR_SETUP.md`
   - Create OAuth 2.0 credentials
   - Enable Google Calendar API

2. **Generate Refresh Token**
   ```bash
   node scripts/generate-google-token.js
   ```

3. **Test Calendar Connection**
   ```bash
   node scripts/test-calendar-api.js
   ```

4. **Add to Vercel Environment Variables**
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - GOOGLE_REDIRECT_URI (use Vercel URL)
   - GOOGLE_REFRESH_TOKEN
   - GOOGLE_CALENDAR_ID

**Status**: ⏳ Pending - Calendar integration code is complete, credentials setup needed

---

*Created: 2025-09-30*
