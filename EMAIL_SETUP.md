# Email Configuration Guide

The booking system sends email notifications for confirmations and reminders. You can use Gmail, SendGrid, or any custom SMTP server.

## Option 1: Gmail (Easiest for Development)

### Setup Steps:

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to [myaccount.google.com](https://myaccount.google.com)
   - Security → 2-Step Verification

2. **Create an App Password**
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. **Add to .env file**:
   ```bash
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

### Limitations:
- Gmail has sending limits (500 emails/day for free accounts)
- Not recommended for high-volume production use

---

## Option 2: SendGrid (Recommended for Production)

### Setup Steps:

1. **Create SendGrid Account**
   - Sign up at [sendgrid.com](https://sendgrid.com) (free tier: 100 emails/day)

2. **Create API Key**
   - Dashboard → Settings → API Keys
   - Create API Key with "Mail Send" permissions
   - Copy the API key

3. **Add to .env file**:
   ```bash
   SENDGRID_API_KEY=SG.your_api_key
   EMAIL_FROM=noreply@yourdomain.com
   ```

4. **Verify Sender Identity**
   - SendGrid requires sender verification
   - Dashboard → Settings → Sender Authentication
   - Verify your email or domain

### Benefits:
- Higher sending limits
- Better deliverability
- Email analytics
- Professional for production

---

## Option 3: Custom SMTP Server

If you have your own email server or use another provider (Mailgun, AWS SES, etc.):

```bash
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_username
SMTP_PASSWORD=your_password
EMAIL_FROM=noreply@yourdomain.com
```

---

## Testing Email Configuration

After configuring, test your email setup:

```bash
node scripts/test-email.js
```

This will attempt to send a test email and verify the configuration.

---

## Email Templates

The system sends three types of emails:

### 1. Booking Confirmation
Sent immediately when a customer books an appointment.

### 2. 24-Hour Reminder
Sent 24 hours before the appointment.

### 3. 1-Hour Reminder
Sent 1 hour before the appointment.

---

## Automated Reminders

Reminder emails are sent via a cron job. Set up on your server:

### Using cron (Linux/Mac):

```bash
# Edit crontab
crontab -e

# Add this line to run every hour
0 * * * * cd /path/to/cost-calculator && node scripts/send-reminders.js >> logs/reminders.log 2>&1
```

### Using Vercel Cron:

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/send-reminders",
    "schedule": "0 * * * *"
  }]
}
```

Then create `/api/cron/send-reminders.js` endpoint.

---

## Production Checklist

Before going live:

- [ ] Configure email provider (Gmail/SendGrid/SMTP)
- [ ] Test sending emails
- [ ] Verify sender domain (for SendGrid)
- [ ] Set up reminder cron job
- [ ] Monitor email delivery logs
- [ ] Set up email bounce/complaint handling

---

## Troubleshooting

### Emails not sending?

1. Check environment variables are set correctly
2. Verify email credentials
3. Check spam folder
4. Review server logs for errors

### Gmail "Less secure app" error?

- Gmail requires app passwords (not your regular password)
- Follow Option 1 setup steps above

### SendGrid "Sender not verified"?

- Complete sender verification in SendGrid dashboard
- Use the verified sender address in EMAIL_FROM

---

*Last Updated: 2025-09-30*
