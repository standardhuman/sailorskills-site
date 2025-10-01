/**
 * Checkout handler module for Stripe integration and order processing
 */

import stateManager from './state.js';
import * as dom from './domHelpers.js';
import { stripeConfig, supabaseFunctionsUrl } from './configuration.js';

// Stripe elements
let stripe = null;
let elements = null;
let cardElement = null;

// DOM elements cache
let domElements = {};

/**
 * Initialize checkout handler
 */
export function init() {
    cacheDOMElements();
    initializeStripe();
    setupEventListeners();
}

/**
 * Cache DOM elements
 */
function cacheDOMElements() {
    domElements = {
        checkoutSection: dom.getElementById('checkout-section'),
        submitButton: dom.getElementById('submit-order'),
        cardErrors: dom.getElementById('card-errors'),
        serviceAgreement: dom.getElementById('service-agreement'),
        backToCalculator: dom.getElementById('back-to-calculator'),

        // Form sections
        boatInfoSection: dom.getElementById('boat-info-section'),
        itemRecoverySection: dom.getElementById('item-recovery-section'),
        serviceIntervalSection: dom.getElementById('service-interval-section'),

        // Form fields
        boatName: dom.getElementById('boat-name'),
        boatLengthCheckout: dom.getElementById('boat-length-checkout'),
        boatMake: dom.getElementById('boat-make'),
        boatModel: dom.getElementById('boat-model'),
        marinaName: dom.getElementById('marina-name'),
        dock: dom.getElementById('dock'),
        slipNumber: dom.getElementById('slip-number'),

        // Item recovery fields
        recoveryLocation: dom.getElementById('recovery-location'),
        itemDescription: dom.getElementById('item-description'),
        dropDate: dom.getElementById('drop-date'),

        // Customer fields
        customerName: dom.getElementById('customer-name'),
        customerEmail: dom.getElementById('customer-email'),
        customerPhone: dom.getElementById('customer-phone'),
        billingAddress: dom.getElementById('billing-address'),
        billingCity: dom.getElementById('billing-city'),
        billingState: dom.getElementById('billing-state'),
        billingZip: dom.getElementById('billing-zip'),
        customerNotes: dom.getElementById('customer-notes')
    };
}

/**
 * Initialize Stripe elements
 */
function initializeStripe() {
    stripe = Stripe(stripeConfig.publishableKey);
    elements = stripe.elements();

    const style = {
        base: {
            fontSize: '16px',
            color: '#000',
            fontFamily: 'Arial, sans-serif',
            '::placeholder': {
                color: '#999'
            }
        }
    };

    cardElement = elements.create('card', { style });
    cardElement.mount('#card-element');

    // Handle card errors
    cardElement.on('change', (event) => {
        if (event.error) {
            dom.setText(domElements.cardErrors, event.error.message);
        } else {
            dom.setText(domElements.cardErrors, '');
        }
        validateCheckoutForm();
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Listen for show checkout event
    window.addEventListener('showCheckout', showCheckout);

    // Service interval selection
    const intervalOptions = dom.querySelectorAll('.interval-option');
    intervalOptions.forEach(option => {
        dom.addEventListener(option, 'click', function() {
            intervalOptions.forEach(opt => dom.removeClass(opt, 'selected'));
            dom.addClass(this, 'selected');
            stateManager.update({
                selectedServiceInterval: this.getAttribute('data-interval')
            });
            validateCheckoutForm();
        });
    });

    // Form validation
    const requiredInputs = dom.querySelectorAll('#checkout-section input[required], #checkout-section select[required]');
    requiredInputs.forEach(input => {
        dom.addEventListener(input, 'input', validateCheckoutForm);
        dom.addEventListener(input, 'change', validateCheckoutForm);
    });

    // Agreement checkbox
    if (domElements.serviceAgreement) {
        dom.addEventListener(domElements.serviceAgreement, 'change', validateCheckoutForm);
    }

    // Submit button
    if (domElements.submitButton) {
        dom.addEventListener(domElements.submitButton, 'click', handleOrderSubmission);
    }

    // Back to calculator
    if (domElements.backToCalculator) {
        dom.addEventListener(domElements.backToCalculator, 'click', hideCheckout);
    }
}

/**
 * Show checkout section
 */
export function showCheckout() {
    const state = stateManager.get();
    const { selectedServiceKey, orderData } = state;

    // Hide calculator elements
    dom.querySelectorAll('.form-step').forEach(step => dom.hide(step));
    dom.hide(dom.querySelector('.navigation-buttons'));
    dom.hide(dom.querySelector('.service-info-section'));

    // Show checkout
    dom.show(domElements.checkoutSection);

    // Configure form based on service type
    configureCheckoutForm(selectedServiceKey);

    // Pre-fill boat length
    if (orderData.boatLength > 0 && domElements.boatLengthCheckout) {
        dom.setValue(domElements.boatLengthCheckout, orderData.boatLength);
    }

    // Scroll to checkout
    setTimeout(() => {
        dom.scrollToElement(domElements.checkoutSection, 30);
    }, 100);

    stateManager.update({ isCheckoutVisible: true });
}

/**
 * Hide checkout section
 */
function hideCheckout() {
    dom.hide(domElements.checkoutSection);
    dom.show(dom.getElementById('step-8')); // Show results
    dom.show(dom.querySelector('.navigation-buttons'), 'flex');
    dom.show(dom.querySelector('.service-info-section'));

    stateManager.update({ isCheckoutVisible: false });
}

/**
 * Configure checkout form based on service type
 */
function configureCheckoutForm(serviceKey) {
    const isItemRecovery = serviceKey === 'item_recovery';
    const isRecurringCleaning = serviceKey === 'recurring_cleaning';

    // Show/hide appropriate sections
    if (isItemRecovery) {
        dom.hide(domElements.boatInfoSection);
        dom.show(domElements.itemRecoverySection);
        dom.hide(domElements.serviceIntervalSection);

        // Set as one-time service
        stateManager.update({ selectedServiceInterval: 'one-time' });

        // Update required fields
        toggleRequiredFields(false, true);

    } else {
        dom.show(domElements.boatInfoSection);
        dom.hide(domElements.itemRecoverySection);

        // Handle interval section
        if (isRecurringCleaning) {
            dom.show(domElements.serviceIntervalSection);

            // Hide one-time option for recurring service
            const oneTimeOption = dom.querySelector('[data-interval="one-time"]');
            if (oneTimeOption) {
                dom.hide(oneTimeOption);
            }

            // Select bi-monthly by default
            const biMonthlyOption = dom.querySelector('[data-interval="2"]');
            if (biMonthlyOption) {
                dom.querySelectorAll('.interval-option').forEach(opt => dom.removeClass(opt, 'selected'));
                dom.addClass(biMonthlyOption, 'selected');
                stateManager.update({ selectedServiceInterval: '2' });
            }

        } else {
            dom.hide(domElements.serviceIntervalSection);

            // Auto-select one-time
            const oneTimeOption = dom.querySelector('[data-interval="one-time"]');
            if (oneTimeOption) {
                dom.show(oneTimeOption, 'flex');
                dom.querySelectorAll('.interval-option').forEach(opt => dom.removeClass(opt, 'selected'));
                dom.addClass(oneTimeOption, 'selected');
                stateManager.update({ selectedServiceInterval: 'one-time' });
            }
        }

        // Update required fields
        toggleRequiredFields(true, false);
    }
}

/**
 * Toggle required fields based on service type
 */
function toggleRequiredFields(boatFields, itemRecoveryFields) {
    // Boat info fields
    const boatFieldIds = ['boat-name', 'boat-make', 'boat-model', 'marina-name', 'dock', 'slip-number'];
    boatFieldIds.forEach(id => {
        const field = dom.getElementById(id);
        if (field) {
            field.required = boatFields;
        }
    });

    // Item recovery fields
    const itemFieldIds = ['recovery-location', 'item-description', 'drop-date'];
    itemFieldIds.forEach(id => {
        const field = dom.getElementById(id);
        if (field) {
            field.required = itemRecoveryFields;
        }
    });
}

/**
 * Validate checkout form
 */
function validateCheckoutForm() {
    const state = stateManager.get();
    const requiredInputs = dom.querySelectorAll('#checkout-section input[required]:not([type="checkbox"]), #checkout-section select[required], #checkout-section textarea[required]');

    let allFieldsFilled = true;
    requiredInputs.forEach(input => {
        // Check if input is visible
        const isVisible = input.offsetParent !== null;
        if (isVisible && !input.value.trim()) {
            allFieldsFilled = false;
        }
    });

    const isItemRecovery = state.selectedServiceKey === 'item_recovery';
    const intervalSelected = isItemRecovery ? true : (state.selectedServiceInterval !== null);
    const agreementChecked = domElements.serviceAgreement?.checked || false;
    const cardComplete = cardElement && cardElement._complete;

    const isValid = allFieldsFilled && intervalSelected && agreementChecked && cardComplete;

    if (domElements.submitButton) {
        dom.setEnabled(domElements.submitButton, isValid);
    }
}

/**
 * Handle order submission
 */
async function handleOrderSubmission() {
    const state = stateManager.get();
    const { selectedServiceKey, selectedServiceInterval, orderData } = state;

    dom.setEnabled(domElements.submitButton, false);
    dom.setText(domElements.submitButton, 'Processing...');

    try {
        // Collect form data
        const formData = {
            serviceInterval: selectedServiceInterval,
            customerName: dom.getValue(domElements.customerName),
            customerEmail: dom.getValue(domElements.customerEmail),
            customerPhone: dom.getValue(domElements.customerPhone),
            billingAddress: dom.getValue(domElements.billingAddress),
            billingCity: dom.getValue(domElements.billingCity),
            billingState: dom.getValue(domElements.billingState),
            billingZip: dom.getValue(domElements.billingZip),
            customerNotes: dom.getValue(domElements.customerNotes) || '',
            estimate: orderData.estimate,
            service: orderData.service,
            serviceDetails: orderData.serviceDetails
        };

        // Add service-specific data
        if (selectedServiceKey === 'item_recovery') {
            formData.recoveryLocation = dom.getValue(domElements.recoveryLocation);
            formData.itemDescription = dom.getValue(domElements.itemDescription);
            formData.dropDate = dom.getValue(domElements.dropDate);
            formData.marinaName = 'See recovery location';
            formData.boatName = 'N/A - Item Recovery';
            formData.boatLength = '0';
            formData.boatMake = 'N/A';
            formData.boatModel = 'N/A';
            formData.dock = 'N/A';
            formData.slipNumber = 'N/A';
        } else {
            formData.boatName = dom.getValue(domElements.boatName) || '';
            formData.boatLength = dom.getValue(domElements.boatLengthCheckout) || '';
            formData.boatMake = dom.getValue(domElements.boatMake) || '';
            formData.boatModel = dom.getValue(domElements.boatModel) || '';
            formData.marinaName = dom.getValue(domElements.marinaName) || '';
            formData.dock = dom.getValue(domElements.dock) || '';
            formData.slipNumber = dom.getValue(domElements.slipNumber) || '';
        }

        // Call Supabase Edge Function
        const response = await fetch(`${supabaseFunctionsUrl}/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${stripeConfig.supabaseAnonKey}`
            },
            body: JSON.stringify({ formData })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const { clientSecret, intentType, orderId, orderNumber } = await response.json();

        // Process payment with Stripe
        let result;
        if (intentType === 'setup') {
            // For recurring: Save payment method
            result = await stripe.confirmCardSetup(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: createBillingDetails(formData)
                }
            });
        } else {
            // For one-time: Charge immediately
            result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: createBillingDetails(formData)
                }
            });
        }

        if (result.error) {
            throw result.error;
        }

        // Success!
        showOrderConfirmation(orderNumber, selectedServiceInterval);

    } catch (error) {
        console.error('Order submission error:', error);

        let errorMessage = 'There was an error processing your order. ';
        if (error.message) {
            if (error.message.includes('fetch')) {
                errorMessage += 'Unable to connect to payment server. Please check your internet connection and try again.';
            } else if (error.message.includes('payment')) {
                errorMessage += 'Payment processing failed. Please check your card details and try again.';
            } else {
                errorMessage += error.message;
            }
        } else {
            errorMessage += 'Please try again or contact support.';
        }

        alert(errorMessage);
        dom.setEnabled(domElements.submitButton, true);
        dom.setText(domElements.submitButton, 'Complete Order');
    }
}

/**
 * Create billing details object
 */
function createBillingDetails(formData) {
    return {
        name: formData.customerName,
        email: formData.customerEmail,
        phone: formData.customerPhone,
        address: {
            line1: formData.billingAddress,
            city: formData.billingCity,
            state: formData.billingState,
            postal_code: formData.billingZip,
            country: 'US'
        }
    };
}

/**
 * Show order confirmation
 */
function showOrderConfirmation(orderNumber, serviceInterval) {
    const isRecurring = serviceInterval !== 'one-time';

    const paymentMessage = isRecurring
        ? `<p style="margin: 20px 0; color: #345475;"><strong>Payment Method Saved!</strong><br>
           Your card is securely saved and will be charged after each service completion.</p>`
        : `<p style="margin: 20px 0; color: #345475;"><strong>Payment Processed!</strong><br>
           Your card has been charged for this one-time service.</p>`;

    const confirmationHTML = `
        <div class="confirmation-message" style="text-align: center; padding: 40px;">
            <h2 style="color: #4CAF50;">✅ Order Confirmed!</h2>
            <p style="font-size: 1.2em; margin: 20px 0;">Thank you for your order.</p>
            <p style="font-size: 1.1em;"><strong>Order Number:</strong> ${orderNumber}</p>
            ${paymentMessage}
            <p style="margin: 20px 0;">We'll contact you within 24 hours to schedule your service.</p>
            <p>You'll receive a confirmation email shortly.</p>
            <button onclick="location.reload()" class="submit-button" style="margin-top: 30px;">Start New Estimate</button>
        </div>
    `;

    dom.setHTML(domElements.checkoutSection, confirmationHTML);
    window.scrollTo(0, 0);
}