# Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

Your project is now ready for Vercel deployment with:
- ✅ `vercel.json` configuration file
- ✅ API converted to Vercel Functions format
- ✅ Production environment variables prepared
- ✅ Production build tested

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Choose "Yes" when asked to link to existing project or create new
   - Select your scope/team
   - Choose project name (e.g., "sailorskills-booking")

3. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub**
   ```bash
   git add -A
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository: `standardhuman/costcalc`
   - Configure project settings

## 🔐 Environment Variables Setup

**IMPORTANT**: Add these in Vercel Dashboard → Settings → Environment Variables

### Required Variables:
```
VITE_SUPABASE_URL=https://fzygakldvvzxmahkdylq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eWdha2xkdnZ6eG1haGtkeWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODM4OTgsImV4cCI6MjA2OTY1OTg5OH0.8BNDF5zmpk2HFdprTjsdOWTDh_XkAPdTnGo7omtiVIk
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eWdha2xkdnZ6eG1haGtkeWxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA4Mzg5OCwiZXhwIjoyMDY5NjU5ODk4fQ.2yijB4vVm1CLBDT0-ifiA0suOwcoStqA-qMqBHjUlV0
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_pri1IepedMvGQmLCFrV4kVzF
STRIPE_SECRET_KEY=[Add your Stripe secret key from dashboard]
NODE_ENV=production
VITE_APP_URL=https://your-app.vercel.app
ADMIN_EMAIL=admin@sailorskills.com
```

### Optional (add when ready):
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
SENDGRID_API_KEY=your_sendgrid_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

## 📝 Post-Deployment Steps

1. **Update VITE_APP_URL**
   - After deployment, update this environment variable with your actual Vercel URL
   - Example: `https://sailorskills-booking.vercel.app`

2. **Configure Custom Domain (Optional)**
   - In Vercel Dashboard → Settings → Domains
   - Add your custom domain (e.g., `booking.sailorskills.com`)
   - Update DNS records as instructed

3. **Test the Deployment**
   - Visit your app URL
   - Test the calculator at `/`
   - Test the booking system at `/booking`
   - Test the admin dashboard at `/admin`
   - Test API health at `/api/health`

## 🔧 Troubleshooting

### API Not Working?
- Check that environment variables are set in Vercel Dashboard
- Check Function logs in Vercel Dashboard → Functions tab

### Build Failing?
- Make sure all dependencies are in `package.json`
- Check build logs in Vercel Dashboard

### Database Connection Issues?
- Verify Supabase keys are correct
- Check Supabase dashboard for any issues

## 📱 URLs After Deployment

Your app will be available at:
- **Main URL**: `https://[your-project].vercel.app`
- **Calculator**: `https://[your-project].vercel.app/`
- **Booking**: `https://[your-project].vercel.app/booking`
- **Admin**: `https://[your-project].vercel.app/admin`
- **API Health**: `https://[your-project].vercel.app/api/health`

## 🎯 Ready to Deploy!

Your project is fully configured for Vercel. Just run:
```bash
vercel --prod
```

Or push to GitHub and connect via Vercel Dashboard!