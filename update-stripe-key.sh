#!/bin/bash

# Script to update Stripe secret key in Supabase Edge Functions
# Usage: ./update-stripe-key.sh

echo "==================================="
echo "Stripe Secret Key Update Script"
echo "==================================="
echo ""
echo "You have two active Stripe keys:"
echo "1. Diver Support Services: sk_live_...j4RK (created May 22)"
echo "2. Cost Calc Admin: sk_live_...KiPh (created Sep 7)"
echo ""
echo "Please choose which key to use (or get the full key from Stripe Dashboard):"
echo ""
read -p "Enter your Stripe secret key (sk_live_...): " STRIPE_KEY

# Validate the key format
if [[ ! "$STRIPE_KEY" =~ ^sk_(live|test)_.+ ]]; then
    echo "❌ Invalid key format. Must start with sk_live_ or sk_test_"
    exit 1
fi

echo ""
echo "Updating Supabase secrets..."

# Update the secret in Supabase
supabase secrets set STRIPE_SECRET_KEY=$STRIPE_KEY

if [ $? -eq 0 ]; then
    echo "✅ Stripe secret key updated successfully in Supabase!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy the functions: supabase functions deploy"
    echo "2. Update Vercel environment variables if needed"
    echo "3. Test the payment flow"
else
    echo "❌ Failed to update Stripe secret key"
    exit 1
fi

echo ""
echo "==================================="
echo "Security Reminders:"
echo "- Never commit this key to version control"
echo "- Use different keys for dev/staging/production"
echo "- Rotate keys periodically"
echo "==================================="