# Wix to Vercel Migration Plan

## Overview
Complete migration of sailorskills.com from Wix to Vercel with custom Google Calendar-integrated booking system.

## Current State
- **Existing on Vercel**: `/diving` page with calculator, Stripe checkout, customer portal
- **Existing on Wix**: Home, Training, Detailing, Deliveries pages + booking system
- **Domain**: Registered with Squarespace, currently pointing to Wix
- **Dependencies on Wix**: Booking system at `/let-s-connect` and `/book-lessons`

## Goal
Full site on Vercel with custom booking system synced to Google Calendar, maintaining exact URL structure (sailorskills.com/diving, etc.)

---

## Phase 1: Core Pages (Days 1-2)

### Tasks
1. **Create home page** (`index.html`)
   - Hero section with Sailor Skills branding
   - Service overview (Training, Diving, Detailing, Deliveries)
   - Call-to-action buttons
   - Navigation header (consistent with diving page)
   - Footer with contact info

2. **Create training page** (`training/training.html`)
   - Service details and pricing
   - Lesson types (Half Day, Full Day, Extended Session, Consultation)
   - CTA linking to booking system
   - Testimonials/credentials section

3. **Create detailing page** (`detailing/detailing.html`)
   - Similar structure to diving page
   - Service description
   - Pricing (if applicable)
   - Booking CTA

4. **Create deliveries page** (`deliveries/deliveries.html`)
   - Service information
   - Contact form or booking integration
   - Pricing/quote request

5. **Navigation consistency**
   - Ensure all pages have same header navigation
   - Update diving page navigation if needed
   - Mobile responsive menu

### Deliverables
- 4 new HTML pages with consistent branding
- Responsive design matching diving page quality
- Working internal navigation

---

## Phase 2: Google Calendar Integration (Day 3)

### Prerequisites
- Google Cloud Project (free tier)
- Google Calendar API enabled
- OAuth 2.0 credentials

### Tasks
6. **Set up Google Cloud Project**
   - Create project at console.cloud.google.com
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs

7. **Backend Calendar Integration** (`server.js`)
   - Install `googleapis` npm package
   - Add OAuth flow for calendar access
   - Create `/api/calendar/availability` endpoint
   - Create `/api/calendar/create-booking` endpoint
   - Handle token refresh logic

8. **Availability Checking Logic**
   - Fetch busy times from Google Calendar
   - Apply business hours filter
   - Apply buffer times between bookings
   - Apply service-specific rules
   - Return available time slots

9. **Calendar Event Creation**
   - Create event on booking confirmation
   - Include customer details in event description
   - Set event reminders
   - Handle timezone correctly

### Technical Details
```javascript
// Availability check flow:
1. Get date range from request
2. Fetch Google Calendar busy times
3. Generate potential slots based on business hours
4. Filter out busy times + buffer
5. Return available slots to frontend

// Booking creation flow:
1. Verify slot still available
2. Create Supabase booking record
3. Create Google Calendar event
4. Send confirmation emails
5. Return success/failure
```

### Deliverables
- Working Google Calendar API integration
- Real-time availability checking
- Two-way sync (bookings create calendar events)

---

## Phase 3: Booking System (Days 4-5)

### Database Schema (Supabase)

#### `service_types` table
```sql
- id (uuid, primary key)
- name (text) - e.g., "Training Half Day"
- duration_minutes (integer)
- buffer_minutes (integer) - time after booking before next can start
- price_cents (integer)
- description (text)
- active (boolean)
- created_at (timestamp)
```

#### `business_hours` table
```sql
- id (uuid, primary key)
- day_of_week (integer) - 0=Sunday, 6=Saturday
- start_time (time) - e.g., "08:00:00"
- end_time (time) - e.g., "18:00:00"
- active (boolean)
```

#### `bookings` table
```sql
- id (uuid, primary key)
- service_type_id (uuid, foreign key)
- customer_name (text)
- customer_email (text)
- customer_phone (text)
- booking_start (timestamp with timezone)
- booking_end (timestamp with timezone)
- status (text) - 'pending', 'confirmed', 'completed', 'cancelled'
- notes (text)
- google_calendar_event_id (text)
- stripe_payment_intent_id (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `booking_settings` table
```sql
- id (uuid, primary key)
- setting_key (text) - e.g., 'min_advance_hours', 'max_booking_days'
- setting_value (text)
- updated_at (timestamp)
```

### Tasks

10. **Database Setup**
    - Create tables in Supabase
    - Add RLS policies
    - Seed initial service types
    - Seed business hours (default 8am-6pm, Mon-Sat)

11. **Booking UI** (`schedule/schedule.html` and `lessons/lessons.html`)
    - Service type selector
    - Calendar widget (use FullCalendar.js or similar)
    - Show only available slots (from API)
    - Time slot selection
    - Customer information form
    - Optional payment/deposit integration
    - Confirmation screen

12. **Stripe Integration**
    - Option 1: Charge deposit at booking
    - Option 2: Save card for later (like diving page)
    - Payment intent creation
    - Confirmation handling

13. **Email Notifications**
    - Booking confirmation to customer
    - Booking notification to you
    - Reminder emails (optional, could use Google Calendar's reminders)
    - Cancellation emails

### Frontend Flow
```
1. Customer visits /schedule or /lessons
2. Selects service type
3. Calendar loads, shows available slots (API call)
4. Picks date/time
5. Fills in contact info
6. Reviews booking details
7. Payment (optional)
8. Confirmation + emails sent
```

### Deliverables
- Two booking pages (general schedule + lessons)
- Working calendar UI with real availability
- Complete booking flow
- Email notifications
- Database records created

---

## Phase 4: Admin Controls (Day 5)

### Tasks

15. **Booking Management in Admin Dashboard**
    - Add to existing `admin/dashboard.html`
    - New section: "Bookings"
    - List upcoming bookings
    - View booking details
    - Cancel/reschedule functionality
    - Filter by date, service type, status

16. **Service Configuration UI**
    - Manage service types (add/edit/disable)
    - Set durations and buffer times
    - Set pricing
    - Preview how changes affect availability

17. **Business Hours Settings**
    - Configure hours per day of week
    - Set blackout dates (vacations, holidays)
    - Minimum advance notice setting
    - Maximum booking window setting

18. **Calendar Sync Dashboard**
    - View sync status with Google Calendar
    - Refresh OAuth token if needed
    - Test availability calculations
    - Manual override for specific dates

### Admin Features
- View all bookings in list/calendar view
- Quick actions: confirm, cancel, reschedule
- Customer communication (send email from admin)
- Booking statistics (bookings per week, revenue, etc.)

### Deliverables
- Complete admin interface for booking management
- Service type configuration
- Business hours management
- Google Calendar sync monitoring

---

## Phase 5: Testing & Launch (Day 6)

### Tasks

19. **Playwright Tests**
    - Test all new pages load correctly
    - Test booking flow end-to-end
    - Test calendar availability API
    - Test admin booking management
    - Test responsive design on mobile

20. **Google Calendar Sync Testing**
    - Verify bookings appear in Google Calendar
    - Verify busy times block availability
    - Test buffer times work correctly
    - Test timezone handling

21. **Deploy to Vercel**
    - Ensure all pages included in build
    - Update `vercel.json` with new routes
    - Set environment variables (Google API credentials)
    - Deploy to production

22. **DNS Configuration (Squarespace)**
    - Update DNS A records to point to Vercel
    - Configure custom domain in Vercel
    - Verify SSL certificate
    - Test all pages at sailorskills.com

23. **Final Testing**
    - Test all pages live
    - Test booking flow on production
    - Test payment processing
    - Test email delivery
    - Cross-browser testing (Chrome, Safari, Firefox)
    - Mobile device testing

### Pre-Launch Checklist
- [ ] All pages live and working
- [ ] Navigation works across all pages
- [ ] Booking system creates calendar events
- [ ] Payments process correctly
- [ ] Emails send successfully
- [ ] Admin dashboard accessible
- [ ] SSL certificate active
- [ ] Mobile responsive
- [ ] All links working
- [ ] Contact forms working
- [ ] Google Analytics/tracking (if needed)

### Deliverables
- Fully tested site
- Live on sailorskills.com
- Wix can be cancelled

---

## Technical Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- FullCalendar.js (or similar) for calendar UI
- Stripe.js for payments
- Fetch API for backend communication

### Backend
- Node.js + Express (existing `server.js`)
- Google Calendar API (`googleapis` package)
- Supabase for database
- Stripe API for payments

### Hosting
- Vercel (static files + serverless functions)
- Supabase (database + auth)
- Stripe (payments)

### Domain
- Squarespace (DNS management)
- Vercel (hosting)

---

## Environment Variables Needed

```bash
# Existing
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=

# New for Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_CALENDAR_ID=
```

---

## Migration Checklist

### Pre-Migration
- [ ] Document all Wix page content
- [ ] Export any Wix data needed
- [ ] Screenshot all Wix pages for reference
- [ ] Note all current bookings in Wix

### During Migration
- [ ] Phase 1: Build core pages
- [ ] Phase 2: Google Calendar integration
- [ ] Phase 3: Booking system
- [ ] Phase 4: Admin controls
- [ ] Phase 5: Testing & launch

### Post-Migration
- [ ] Monitor bookings for first week
- [ ] Verify all emails sending
- [ ] Check Google Calendar sync daily
- [ ] Cancel Wix subscription
- [ ] Update any external links to site
- [ ] Update social media links if needed

---

## Timeline Estimate

- **Phase 1**: 1-2 days (page building)
- **Phase 2**: 1 day (Google Calendar API)
- **Phase 3**: 1-2 days (booking system)
- **Phase 4**: 0.5-1 day (admin UI)
- **Phase 5**: 0.5-1 day (testing/launch)

**Total**: 5-7 days of development work

---

## Risks & Mitigation

### Risk: Google Calendar API rate limits
- **Mitigation**: Cache availability data, implement exponential backoff

### Risk: Double bookings during transition
- **Mitigation**: Disable Wix bookings before enabling new system, or run parallel for 24 hours

### Risk: Email delivery issues
- **Mitigation**: Use SendGrid or similar service, test thoroughly

### Risk: DNS propagation delay
- **Mitigation**: Lower TTL values 24 hours before migration, schedule during low-traffic time

### Risk: Payment processing errors
- **Mitigation**: Extensive testing with Stripe test mode, have fallback contact method

---

## Success Metrics

- All pages load in < 2 seconds
- Booking system shows accurate availability
- 100% of bookings sync to Google Calendar
- Zero double-bookings
- All confirmation emails delivered within 1 minute
- Mobile responsive score > 95 (Lighthouse)
- Zero downtime during DNS switch

---

## Next Steps

1. **Start Phase 1**: Build home page
2. **Get content**: Review Wix pages, extract all copy/images
3. **Design consistency**: Ensure new pages match diving page quality
4. **Set up Google Cloud**: Create project, enable Calendar API

---

## Notes

- Keep Wix account active until fully migrated and tested
- Consider running both systems in parallel for 24-48 hours
- Backup all Wix content before DNS switch
- Have rollback plan ready (DNS can be reverted)
- Document all API keys and credentials securely

---

## Resources

- [Google Calendar API Docs](https://developers.google.com/calendar/api)
- [FullCalendar.js Docs](https://fullcalendar.io/docs)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

*Last Updated: 2025-09-30*
