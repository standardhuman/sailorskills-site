#!/bin/bash

# Supabase Setup Script for Hull Cleaning Cost Calculator

echo "🚀 Setting up Supabase for Hull Cleaning Cost Calculator"
echo "======================================================="

# Check if project ref is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your Supabase project reference ID"
    echo "Usage: ./setup-supabase.sh YOUR_PROJECT_REF"
    echo "Example: ./setup-supabase.sh abcdefghijklmnop"
    exit 1
fi

PROJECT_REF=$1

echo "📎 Linking to Supabase project: $PROJECT_REF"
supabase link --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo "❌ Failed to link project. Please check your project reference."
    exit 1
fi

echo "✅ Project linked successfully!"

echo "📊 Pushing database schema..."
supabase db push

if [ $? -ne 0 ]; then
    echo "❌ Failed to push database schema."
    exit 1
fi

echo "✅ Database schema created!"

echo "🔑 Setting up Stripe secret key..."
echo "Please enter your Stripe SECRET key (starts with sk_):"
read -s STRIPE_KEY

supabase secrets set STRIPE_SECRET_KEY=$STRIPE_KEY

if [ $? -ne 0 ]; then
    echo "❌ Failed to set Stripe secret."
    exit 1
fi

echo "✅ Stripe secret configured!"

echo "🚀 Deploying Edge Function..."
supabase functions deploy create-payment-intent

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy Edge Function."
    exit 1
fi

echo "✅ Edge Function deployed!"

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Update SUPABASE_URL in script.js with: https://$PROJECT_REF.supabase.co"
echo "2. Update SUPABASE_ANON_KEY in script.js with your anon key from the Supabase dashboard"
echo "3. Update Stripe publishable key in index.html"
echo ""
echo "Find your keys at: https://app.supabase.com/project/$PROJECT_REF/settings/api"