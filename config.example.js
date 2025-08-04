// config.example.js
// Copy this to config.js and fill in your values
// Do NOT commit config.js to git (it's in .gitignore)

const config = {
    // Supabase Configuration
    SUPABASE_URL: 'your-supabase-url',
    SUPABASE_ANON_KEY: 'your-supabase-anon-key',
    
    // Stripe Configuration  
    STRIPE_PUBLIC_KEY: 'your-stripe-publishable-key',
    
    // Environment
    IS_PRODUCTION: true
};

// For GitHub Pages deployment, you can use a fallback approach:
if (typeof window !== 'undefined') {
    window.CONFIG = config;
}