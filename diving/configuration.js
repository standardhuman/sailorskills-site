/**
 * Configuration module for diving services calculator
 * Contains all service data, pricing, and constants
 */

export const serviceData = {
    recurring_cleaning: {
        rate: 4.50,
        name: "Recurring Cleaning & Anodes",
        type: 'per_foot',
        description: "Regular hull cleaning keeps your boat performing at its best. Service includes cleaning and zinc anode inspection. Available at 1, 2, 3, or 6-month intervals."
    },
    onetime_cleaning: {
        rate: 6.00,
        name: "One-time Cleaning & Anodes",
        type: 'per_foot',
        description: "Complete hull cleaning and zinc anode inspection. Perfect for pre-haul out, pre-survey, or when your regular diver is unavailable."
    },
    item_recovery: {
        rate: 199,
        name: "Item Recovery",
        type: 'flat',
        description: "Professional recovery of lost items like phones, keys, tools, or dinghies. Quick response to minimize water damage. Service includes up to 45 minutes of searching time. Recovery is not guaranteed."
    },
    underwater_inspection: {
        rate: 4,
        name: "Underwater Inspection",
        type: 'per_foot',
        description: "Thorough underwater inspection with detailed photo/video documentation. Ideal for insurance claims, pre-purchase surveys, or damage assessment. $4 per foot with $150 minimum."
    },
    propeller_service: {
        rate: 349,
        name: "Propeller Removal/Installation",
        type: 'flat',
        description: "Professional propeller removal or installation service. $349 per propeller for either service. Includes proper handling, alignment, and torque specifications."
    },
    anodes_only: {
        rate: 150,
        name: "Anodes Only",
        type: 'flat',
        description: "Zinc anode inspection and replacement service. $150 minimum service charge plus cost of anodes. Perfect for boats that only need anode replacement without hull cleaning."
    }
};

export const minimumCharge = 150;
export const anodeInstallationRate = 15; // Per anode

export const paintConditions = {
    EXCELLENT: "Excellent",
    GOOD: "Good",
    FAIR: "Fair",
    POOR: "Poor",
    MISSING: "Missing"
};

export const growthLevels = {
    MINIMAL: "Minimal",
    MODERATE: "Moderate",
    HEAVY: "Heavy",
    SEVERE: "Severe"
};

// Surcharge rates
export const surcharges = {
    powerboat: 0.25,      // 25% for powerboat
    catamaran: 0.25,      // 25% for catamaran
    trimaran: 0.50,       // 50% for trimaran
    twinEngines: 0.10,    // 10% for twin engines
    paintPoor: 0.10,      // 10% for poor paint
    paintMissing: 0.15,   // 15% for missing paint
    growthHeavy: 0.35,    // 35% for heavy growth (average)
    growthSevere: 2.00    // 200% for severe growth
};

// Stripe configuration
export const stripeConfig = {
    publishableKey: 'pk_live_pri1IepedMvGQmLCFrV4kVzF',
    supabaseUrl: 'https://fzygakldvvzxmahkdylq.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eWdha2xkdnZ6eG1haGtkeWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODM4OTgsImV4cCI6MjA2OTY1OTg5OH0.8BNDF5zmpk2HFdprTjsdOWTDh_XkAPdTnGo7omtiVIk'
};

export const supabaseFunctionsUrl = `${stripeConfig.supabaseUrl}/functions/v1`;

// Service order for display
export const serviceDisplayOrder = [
    'recurring_cleaning',
    'onetime_cleaning',
    'separator',
    'anodes_only',
    'underwater_inspection',
    'item_recovery',
    'propeller_service'
];

// Default form values
export const defaultFormValues = {
    boatLength: 30,
    boatType: 'sailboat',
    hullType: 'monohull',
    twinEngines: false,
    lastPainted: '0-6_months',
    lastCleaned: '0-2_months',
    anodesToInstall: 0
};