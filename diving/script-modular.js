/**
 * Main script for diving calculator
 * Orchestrates all modules and initializes the application
 */

import { serviceData } from './configuration.js';
import * as formHandler from './formHandler.js';
import * as checkoutHandler from './checkoutHandler.js';
import { calculateServiceCost } from './calculator.js';

// Export globals for backward compatibility (admin page)
window.serviceData = serviceData;
window.calculateCost = formHandler.calculateAndDisplayCost;
window.selectService = formHandler.selectService;
window.populateServiceButtons = () => formHandler.init();

// Support for admin page direct calculation
window.calculateCostDirect = formHandler.calculateAndDisplayCost;
window.getDirectPaintSurcharge = (condition) => {
    const surcharges = {
        'Excellent': 0,
        'Good': 0,
        'Fair': 0,
        'Poor': 0.10,
        'Missing': 0.15
    };
    return surcharges[condition] || 0;
};

window.getDirectGrowthSurcharge = (level) => {
    const surcharges = {
        'Minimal': 0,
        'Moderate': 0,
        'Heavy': 0.35,
        'Severe': 2.00
    };
    return surcharges[level] || 0;
};

// Define selectedServiceKey getter/setter for admin compatibility
Object.defineProperty(window, 'selectedServiceKey', {
    get: function() {
        return window.stateManager?.get('selectedServiceKey') || null;
    },
    set: function(value) {
        if (window.stateManager) {
            window.stateManager.update({ selectedServiceKey: value });
        }
    }
});

/**
 * Initialize the application
 */
function init() {
    // Check if we're on the main diving page
    const isDivingPage = document.getElementById('serviceButtons') !== null;

    if (isDivingPage) {
        // Initialize modules
        formHandler.init();
        checkoutHandler.init();

        console.log('Diving calculator initialized with modular architecture');
    } else {
        // Admin page - just provide the necessary functions
        console.log('Admin page detected - providing compatibility functions');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// For admin page compatibility - expose state manager if needed
import stateManager from './state.js';
window.stateManager = stateManager;