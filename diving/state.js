/**
 * State management module for diving calculator
 * Manages form state and provides event-driven updates
 */

import { defaultFormValues } from './configuration.js';

class StateManager {
    constructor() {
        this.state = {
            // Current step in the wizard
            currentStep: 0,

            // Selected service
            selectedServiceKey: null,

            // Form values
            formValues: { ...defaultFormValues },

            // Checkout data
            selectedServiceInterval: null,

            // Order data
            orderData: {
                estimate: 0,
                service: '',
                boatLength: 0,
                serviceDetails: {}
            },

            // UI state
            isCheckoutVisible: false,
            isCalculating: false
        };

        // Event listeners
        this.listeners = {
            stateChange: [],
            stepChange: [],
            serviceChange: [],
            calculationComplete: []
        };
    }

    /**
     * Get current state or specific property
     */
    get(property = null) {
        if (property) {
            return this.state[property];
        }
        return { ...this.state };
    }

    /**
     * Update state and trigger events
     */
    update(updates) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };

        // Trigger state change event
        this.trigger('stateChange', { oldState, newState: this.state });

        // Trigger specific events
        if (updates.currentStep !== undefined && updates.currentStep !== oldState.currentStep) {
            this.trigger('stepChange', {
                oldStep: oldState.currentStep,
                newStep: updates.currentStep
            });
        }

        if (updates.selectedServiceKey !== undefined && updates.selectedServiceKey !== oldState.selectedServiceKey) {
            this.trigger('serviceChange', {
                oldService: oldState.selectedServiceKey,
                newService: updates.selectedServiceKey
            });
        }
    }

    /**
     * Update form values
     */
    updateFormValue(field, value) {
        this.state.formValues = {
            ...this.state.formValues,
            [field]: value
        };
        this.trigger('stateChange', { field, value });
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.state = {
            currentStep: 0,
            selectedServiceKey: null,
            formValues: { ...defaultFormValues },
            selectedServiceInterval: null,
            orderData: {
                estimate: 0,
                service: '',
                boatLength: 0,
                serviceDetails: {}
            },
            isCheckoutVisible: false,
            isCalculating: false
        };

        this.trigger('stateChange', { reset: true });
    }

    /**
     * Subscribe to events
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        };
    }

    /**
     * Trigger event
     */
    trigger(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Get the next step number based on current state
     */
    getNextStep() {
        const currentStep = this.state.currentStep;
        const serviceKey = this.state.selectedServiceKey;
        const serviceType = serviceKey ? (window.serviceData?.[serviceKey]?.type || null) : null;
        const totalSteps = 9; // Total number of steps (0-8)

        // If on results step, go back to start
        if (currentStep === totalSteps - 1) {
            return 0;
        }

        // From service selection
        if (currentStep === 0) {
            if (serviceKey === 'underwater_inspection') {
                return 1; // Go to boat length
            } else if (serviceKey === 'item_recovery') {
                return 8; // Go directly to results
            } else if (serviceType === 'flat') {
                return 7; // Go to anodes
            } else if (serviceType === 'per_foot') {
                return 1; // Go to boat length
            }
        }

        // For underwater inspection
        if (serviceKey === 'underwater_inspection') {
            if (currentStep === 1) return 3; // Skip boat type, go to hull type
            if (currentStep === 3) return 8; // Go to results
        }

        // Default: next sequential step
        return currentStep + 1;
    }

    /**
     * Get the previous step number based on current state
     */
    getPreviousStep() {
        const currentStep = this.state.currentStep;
        const serviceKey = this.state.selectedServiceKey;
        const serviceType = serviceKey ? (window.serviceData?.[serviceKey]?.type || null) : null;

        // Can't go back from first step
        if (currentStep === 0) return 0;

        // From anodes step for flat rate services
        if (currentStep === 7 && serviceType === 'flat') {
            return 0; // Back to service selection
        }

        // From results for item recovery
        if (currentStep === 8 && serviceKey === 'item_recovery') {
            return 0; // Back to service selection
        }

        // For underwater inspection
        if (serviceKey === 'underwater_inspection') {
            if (currentStep === 8) return 3; // Back to hull type
            if (currentStep === 3) return 1; // Back to boat length
            if (currentStep === 1) return 0; // Back to service selection
        }

        // Default: previous sequential step
        return currentStep - 1;
    }

    /**
     * Check if the next button should be enabled
     */
    canProceed() {
        const currentStep = this.state.currentStep;

        // Service selection step
        if (currentStep === 0) {
            return this.state.selectedServiceKey !== null;
        }

        // Boat length step
        if (currentStep === 1) {
            const length = parseFloat(this.state.formValues.boatLength);
            return !isNaN(length) && length > 0;
        }

        // All other steps can proceed
        return true;
    }

    /**
     * Get button text for navigation
     */
    getNextButtonText() {
        const currentStep = this.state.currentStep;
        const serviceKey = this.state.selectedServiceKey;
        const serviceType = serviceKey ? (window.serviceData?.[serviceKey]?.type || null) : null;
        const totalSteps = 9;

        // Last step (Results)
        if (currentStep === totalSteps - 1) {
            return 'Start Over';
        }

        // Service selection step
        if (currentStep === 0) {
            if (!serviceKey) return 'Next';

            if (serviceType === 'per_foot') {
                return 'Next (Boat Length)';
            } else if (serviceKey === 'item_recovery') {
                return 'View Estimate';
            } else {
                return 'Next (Anodes)';
            }
        }

        // Step-specific text
        const stepTexts = {
            1: 'Next (Boat Type)',
            2: 'Next (Hull Type)',
            3: 'Next (Engine Config)',
            4: 'Next (Paint Age)',
            5: 'Next (Last Cleaned)',
            6: 'Next (Anodes)',
            7: 'View Estimate'
        };

        // Special handling for underwater inspection
        if (serviceKey === 'underwater_inspection') {
            if (currentStep === 1) return 'Next (Hull Type)';
            if (currentStep === 3) return 'View Estimate';
        }

        return stepTexts[currentStep] || 'Next';
    }
}

// Create singleton instance
const stateManager = new StateManager();

export default stateManager;