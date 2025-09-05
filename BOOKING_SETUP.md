# Booking System Setup Guide

## Overview
A complete booking system for sailing lessons with Google Calendar sync, email/SMS notifications, and admin dashboard.

## Features
- **Service Selection**: Choose from consultation, half-day, full-day, or extended sessions
- **Calendar Integration**: Real-time availability checking with Google Calendar sync
- **Smart Scheduling**: Automated conflict detection and availability rules
- **Notifications**: Email confirmations via SendGrid, SMS via Twilio
- **Admin Dashboard**: Manage bookings, services, availability, and blocked dates
- **Payment Processing**: Stripe integration for secure payments
- **Responsive Design**: Works on desktop, tablet, and mobile

## Setup Instructions

### 1. Database Setup (Supabase)
```bash
# Run the migration to create tables
supabase db push
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required services:
- **Supabase**: For database and authentication
- **Stripe**: For payment processing
- **Google Calendar API**: For calendar sync
- **SendGrid**: For email notifications
- **Twilio**: For SMS notifications (optional)

### 3. Google Calendar Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/auth/google/callback`
6. Get refresh token using OAuth playground

### 4. Run the Application
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, start the API server
node api/index.js
```

### 5. Access the System
- **Booking Page**: http://localhost:3000/booking
- **Admin Dashboard**: http://localhost:3000/admin
- **API Server**: http://localhost:3001

## Admin Dashboard Features

### Bookings Tab
- View all bookings with customer details
- Update booking status (pending, confirmed, cancelled, completed)
- Filter by date range

### Calendar View
- Week view of all bookings
- Visual status indicators
- Navigate between weeks

### Services Management
- Edit service names, descriptions, prices
- Set duration and participant limits
- Enable/disable services

### Availability Settings
- Set weekly operating hours
- Block specific dates
- Configure buffer times between bookings

## Booking Flow

1. **Service Selection**: Customer chooses service type
2. **Date Selection**: Pick from available dates (up to 90 days ahead)
3. **Time Slot**: Select from available time slots
4. **Contact Info**: Enter name, email, phone
5. **Payment**: Process payment via Stripe (free consultations skip this)
6. **Confirmation**: Receive email/SMS confirmation
7. **Calendar Sync**: Automatically added to Google Calendar
8. **Reminder**: Automatic reminder 24 hours before

## API Endpoints

- `POST /api/create-booking-payment`: Create Stripe payment session
- `GET /api/booking-success`: Handle successful payment
- `POST /api/send-reminders`: Trigger reminder emails/SMS

## Customization

### Modify Service Types
Edit the migration file or use the admin dashboard to add/edit services.

### Adjust Scheduling Rules
- `advance_booking_days`: How far ahead customers can book
- `minimum_notice_hours`: Minimum hours before booking
- `buffer_time_minutes`: Time between bookings
- `reminder_hours_before`: When to send reminders

### Styling
All styles match the existing cost calculator design:
- `BookingPage.css`: Main booking interface
- `AdminDashboard.css`: Admin panel styling

## Testing

1. Create a test booking as a customer
2. Check admin dashboard for the new booking
3. Verify Google Calendar event creation
4. Confirm email/SMS notifications
5. Test payment flow with Stripe test cards

## Deployment

1. Set production environment variables
2. Update URLs in `.env`
3. Deploy to your hosting provider
4. Set up scheduled job for reminders (cron or similar)

## Troubleshooting

- **Calendar not syncing**: Check Google API credentials and refresh token
- **Emails not sending**: Verify SendGrid API key and sender email
- **SMS not working**: Confirm Twilio credentials and phone number format
- **Payment issues**: Ensure Stripe keys match environment (test/live)