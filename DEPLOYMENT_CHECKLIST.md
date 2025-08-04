# Deployment Checklist for Hull Cleaning Cost Calculator

## Current Status
- ✅ Code deployed to GitHub Pages at: https://standardhuman.github.io/costcalc/
- ✅ Supabase backend configured with database and Edge Functions
- ✅ Admin dashboard created at /admin
- ✅ Stripe integration implemented (using live keys)

## Production Setup Requirements

### 1. Environment Configuration
Currently, your Supabase credentials are hardcoded in `script.js`:
- SUPABASE_URL: https://fzygakldvvzxmahkdylq.supabase.co
- SUPABASE_ANON_KEY: (hardcoded in script.js)
- STRIPE_PUBLIC_KEY: pk_live_pri1IepedMvGQmLCFrV4kVzF (in script.js)

⚠️ **Security Note**: While these are public keys and safe to expose, consider if you want to restrict access.

### 2. Supabase Configuration
- [x] Database tables created (customers, orders)
- [x] Edge Functions deployed (create-payment-intent)
- [x] RLS policies configured
- [ ] **ACTION NEEDED**: Ensure Supabase project is on a paid plan for production use
- [ ] **ACTION NEEDED**: Set up Supabase Auth for admin access (currently using anon key)

### 3. Stripe Configuration
- [x] Live Stripe keys integrated
- [x] Payment flow implemented (SetupIntent for recurring, PaymentIntent for one-time)
- [ ] **ACTION NEEDED**: Configure Stripe webhook endpoint for payment confirmations
- [ ] **ACTION NEEDED**: Set up Stripe dashboard settings (business details, payout schedule)

### 4. Domain & Hosting
Current URL: https://standardhuman.github.io/costcalc/

Options for custom domain:
1. **Keep GitHub Pages** (free):
   - Add CNAME file to repository
   - Configure DNS records to point to GitHub Pages
   
2. **Move to Vercel/Netlify** (better for environment variables):
   - Allows secure environment variable management
   - Better deployment controls
   - Still free for your use case

### 5. Testing Checklist
- [ ] Test complete customer flow on production URL
- [ ] Test payment processing with real card
- [ ] Test admin dashboard login and order management
- [ ] Test email notifications (if configured)
- [ ] Test on mobile devices

### 6. Security & Compliance
- [ ] Add Terms of Service page
- [ ] Add Privacy Policy page
- [ ] Ensure PCI compliance (Stripe handles most of this)
- [ ] Set up SSL certificate (GitHub Pages provides this)

### 7. Monitoring & Analytics
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Add Google Analytics or similar
- [ ] Monitor Supabase usage and limits
- [ ] Set up Stripe payment notifications

### 8. Admin Access
- [ ] Document admin URL: https://standardhuman.github.io/costcalc/admin
- [ ] Set up secure authentication for admin panel
- [ ] Create admin user documentation

## Next Steps Priority

1. **Test the live site**: Visit https://standardhuman.github.io/costcalc/ and go through the full flow
2. **Configure Stripe webhooks**: To handle payment confirmations
3. **Set up Supabase Auth**: For secure admin access
4. **Add legal pages**: Terms of Service and Privacy Policy
5. **Consider custom domain**: If you want a branded URL

## Quick Test Commands

Test the live site:
```bash
open https://standardhuman.github.io/costcalc/
```

Test the admin panel:
```bash
open https://standardhuman.github.io/costcalc/admin
```

## Support Contacts

- Stripe Support: https://support.stripe.com/
- Supabase Support: https://supabase.com/support
- GitHub Pages: https://docs.github.com/en/pages