# Wix Migration - Quick Start Guide

**🎯 Goal:** Complete the final setup steps to launch sailorskills.com

**⏱️ Time Required:** 4-5 hours

---

## 📍 Current Status

✅ **DEPLOYED:**
- Monorepo (home + info pages)
- sailorskills-schedule (booking system)
- sailorskills-estimator (cost calculator)

⏳ **REMAINING:**
- Database setup (15 min)
- Google Calendar setup (30 min)
- Email setup (15 min)
- Testing (2 hours)
- DNS migration (1 hour)

---

## 🚀 Step-by-Step Launch Sequence

### Step 1: Database Setup (15 minutes)

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/fzygakldvvzxmahkdylq/editor/sql

2. **Run Migration:**
   ```bash
   # Copy this file:
   cat /Users/brian/app-development/sailorskills/supabase/migrations/03_booking_system.sql

   # Paste into SQL Editor and execute
   ```

3. **Verify Tables Created:**
   - Check Tables panel for: `service_types`, `business_hours`, `bookings`, `booking_history`, `blackout_dates`, `booking_settings`

---

### Step 2: Google Calendar Setup (30 minutes)

1. **Create Google Cloud Project:**
   - Visit: https://console.cloud.google.com/
   - Create new project: "Sailor Skills Booking"

2. **Enable Calendar API:**
   - Go to: APIs & Services → Library
   - Search "Google Calendar API" → Enable

3. **Create OAuth Credentials:**
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
   - Download credentials JSON

4. **Generate Refresh Token:**
   ```bash
   cd /Users/brian/app-development/sailorskills

   # Add to .env (from downloaded credentials):
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_CALENDAR_ID=your_calendar_id

   # Run token generator:
   node scripts/generate-google-token.js

   # Follow prompts to authenticate
   ```

5. **Add to Vercel:**
   - Open: https://vercel.com/brians-projects-bc2d3592/sailorskills-schedule/settings/environment-variables
   - Add:
     - GOOGLE_CLIENT_ID
     - GOOGLE_CLIENT_SECRET
     - GOOGLE_REFRESH_TOKEN (from script output)
     - GOOGLE_CALENDAR_ID

6. **Redeploy schedule:**
   ```bash
   cd /Users/brian/app-development/sailorskills-repos/sailorskills-schedule
   vercel --prod
   ```

---

### Step 3: Email Setup (15 minutes)

**Option A: Gmail (Easiest)**

1. Enable 2FA on Gmail
2. Create App Password:
   - Visit: https://myaccount.google.com/apppasswords
   - Generate password for "Mail"
3. Add to Vercel (sailorskills-schedule):
   - GMAIL_USER=your_email@gmail.com
   - GMAIL_APP_PASSWORD=16_character_password
   - EMAIL_FROM=your_email@gmail.com

**Option B: SendGrid (Production)**

1. Sign up: https://sendgrid.com
2. Create API key (Mail Send permissions)
3. Add to Vercel:
   - SENDGRID_API_KEY=SG.your_api_key
   - EMAIL_FROM=noreply@sailorskills.com

4. **Redeploy schedule:**
   ```bash
   cd /Users/brian/app-development/sailorskills-repos/sailorskills-schedule
   vercel --prod
   ```

---

### Step 4: Testing (2 hours)

**Test Booking Flow:**

```bash
# Navigate to schedule deployment
open https://sailorskills-schedule-57q4bc2fi-brians-projects-bc2d3592.vercel.app/schedule

# Test:
1. Select service type
2. Choose date
3. Pick time slot
4. Fill customer info
5. Submit booking
6. Verify confirmation email received
7. Check Google Calendar for event
8. Check Supabase bookings table
```

**Test Admin Dashboard:**

```bash
open https://sailorskills-schedule-57q4bc2fi-brians-projects-bc2d3592.vercel.app/admin

# Test:
1. View bookings list
2. Update booking status
3. Cancel booking
4. Verify calendar updated
```

**Test All Pages:**

```bash
# Monorepo pages
open https://cost-calculator-ifzew4e8b-brians-projects-bc2d3592.vercel.app/
open https://cost-calculator-ifzew4e8b-brians-projects-bc2d3592.vercel.app/training
open https://cost-calculator-ifzew4e8b-brians-projects-bc2d3592.vercel.app/detailing
open https://cost-calculator-ifzew4e8b-brians-projects-bc2d3592.vercel.app/deliveries
```

---

### Step 5: DNS Migration (1 hour)

**When everything is tested and working:**

1. **Configure Custom Domain in Vercel:**
   - Open: https://vercel.com/brians-projects-bc2d3592/cost-calculator/settings/domains
   - Add domain: `sailorskills.com`
   - Add domain: `www.sailorskills.com`
   - Note the Vercel nameservers or A records provided

2. **Update DNS at Squarespace:**
   - Log into Squarespace
   - Navigate to: Domains → sailorskills.com → DNS Settings
   - Update A records to point to Vercel IPs (Vercel will provide)
   - Or: Update nameservers if Vercel suggests

3. **Wait for Propagation (15-60 minutes)**

4. **Verify SSL Certificate:**
   - Vercel auto-generates SSL
   - Check https://sailorskills.com loads with padlock

5. **Test All Routes:**
   ```bash
   # Should all work:
   https://sailorskills.com
   https://sailorskills.com/training
   https://sailorskills.com/diving
   https://sailorskills.com/schedule
   ```

---

## 🔧 Troubleshooting

### Google Calendar Errors
```bash
# Regenerate token:
cd /Users/brian/app-development/sailorskills
node scripts/generate-google-token.js

# Test connection:
node scripts/test-calendar-api.js
```

### Email Not Sending
```bash
# Test email configuration:
node scripts/test-email.js

# Check:
1. Environment variables set correctly in Vercel
2. Gmail app password is correct (no spaces)
3. SendGrid API key has Mail Send permission
```

### Database Errors
```bash
# Check Supabase connection:
# Visit: https://supabase.com/dashboard/project/fzygakldvvzxmahkdylq/editor/sql

# Verify tables exist
SELECT * FROM service_types;
SELECT * FROM bookings;
```

---

## 📝 Post-Launch Checklist

After DNS migration is complete:

- [ ] Test booking flow on production domain
- [ ] Verify calendar sync working
- [ ] Check email notifications arrive
- [ ] Test all navigation links
- [ ] Mobile responsive check (phone/tablet)
- [ ] Cross-browser test (Chrome, Safari, Firefox)
- [ ] Monitor Vercel logs for errors
- [ ] Set up monitoring/alerts
- [ ] Cancel Wix subscription (wait 1 week to be safe)

---

## 🎉 Success Criteria

Your migration is complete when:

✅ sailorskills.com loads the home page
✅ All navigation works (training, diving, schedule, etc.)
✅ Booking system accepts appointments
✅ Calendar events are created in Google Calendar
✅ Confirmation emails are sent
✅ Admin dashboard shows bookings
✅ Site is mobile responsive
✅ SSL certificate is active
✅ No Wix content is being served

---

## 📞 Need Help?

**Documentation:**
- MIGRATION_COMPLETION_STATUS.md - Current status
- GOOGLE_CALENDAR_SETUP.md - Detailed calendar setup
- EMAIL_SETUP.md - Email provider setup

**Test Scripts:**
```bash
cd /Users/brian/app-development/sailorskills

# Test Google Calendar:
node scripts/test-calendar-api.js

# Generate new OAuth token:
node scripts/generate-google-token.js

# Test email:
node scripts/test-email.js
```

---

**Ready to launch? Start with Step 1! 🚀**
