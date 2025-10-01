/**
 * Form handler module for diving calculator
 * Manages form navigation, validation, and step transitions
 */

import stateManager from './state.js';
import * as dom from './domHelpers.js';
import { serviceData, serviceDisplayOrder } from './configuration.js';
import { calculateServiceCost, formatBreakdown, getPaintCondition, getGrowthLevel } from './calculator.js';

// Cache DOM elements
let elements = {};
let stepElements = [];

/**
 * Initialize form handler
 */
export function init() {
    cacheElements();
    setupEventListeners();
    populateServiceButtons();
    renderCurrentStep();
}

/**
 * Cache DOM elements for performance
 */
function cacheElements() {
    elements = {
        // Service selection
        serviceButtons: dom.getElementById('serviceButtons'),
        servicePriceExplainer: dom.getElementById('servicePriceExplainer'),

        // Form inputs
        boatLength: dom.getElementById('boatLength'),
        boatLengthError: dom.getElementById('boatLengthError'),
        anodesToInstall: dom.getElementById('anodesToInstall'),
        twinEnginesCheckbox: dom.getElementById('has_twin_engines'),
        lastPaintedTime: dom.getElementById('lastPaintedTime'),
        lastCleanedTime: dom.getElementById('lastCleanedTime'),

        // Results
        costBreakdown: dom.getElementById('costBreakdown'),
        totalCostDisplay: dom.getElementById('totalCostDisplay'),
        paintExplainer: dom.getElementById('paintExplainerText'),
        growthExplainer: dom.getElementById('growthExplainerText'),

        // Navigation
        backButton: dom.getElementById('backButton'),
        nextButton: dom.getElementById('nextButton'),

        // Checkout
        checkoutSection: dom.getElementById('checkout-section')
    };

    // Populate step elements array
    for (let i = 0; i <= 8; i++) {
        stepElements.push(dom.getElementById(`step-${i}`));
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Navigation buttons
    if (elements.nextButton) {
        dom.addEventListener(elements.nextButton, 'click', handleNextClick);
    }

    if (elements.backButton) {
        dom.addEventListener(elements.backButton, 'click', handleBackClick);
    }

    // Paint and cleaning dropdowns
    if (elements.lastPaintedTime) {
        dom.addEventListener(elements.lastPaintedTime, 'change', updatePaintSurchargeDisplay);
    }

    if (elements.lastCleanedTime) {
        dom.addEventListener(elements.lastCleanedTime, 'change', updateGrowthSurchargeDisplay);
    }

    // State change listeners
    stateManager.on('stepChange', ({ newStep }) => {
        renderCurrentStep();
        if (newStep === 8) { // Results step
            calculateAndDisplayCost();
        }
    });
}

/**
 * Populate service selection buttons
 */
function populateServiceButtons() {
    if (!elements.serviceButtons) return;

    dom.clearChildren(elements.serviceButtons);

    serviceDisplayOrder.forEach(key => {
        // Add separator
        if (key === 'separator') {
            const separator = dom.createElement('div', {
                className: 'service-separator'
            });
            separator.innerHTML = '<span>Other Services</span>';
            elements.serviceButtons.appendChild(separator);
            return;
        }

        const service = serviceData[key];
        const button = dom.createElement('div', {
            className: 'service-option',
            dataset: { serviceKey: key }
        });

        // Add special classes
        if (key === 'recurring_cleaning' || key === 'onetime_cleaning') {
            dom.addClass(button, 'cleaning-service');
        }
        if (key === 'underwater_inspection' || key === 'anodes_only') {
            dom.addClass(button, 'full-width-service');
        }

        // Create button content
        const nameDiv = dom.createElement('div', { className: 'service-name' }, service.name);
        button.appendChild(nameDiv);

        const priceDiv = dom.createElement('div', { className: 'service-price' });
        if (service.type === 'per_foot') {
            priceDiv.textContent = `$${service.rate} per foot`;
        } else if (key === 'anodes_only') {
            priceDiv.textContent = 'Per anode rate';
        } else {
            priceDiv.textContent = `$${service.rate} flat rate`;
        }
        button.appendChild(priceDiv);

        // Add save badge for recurring cleaning
        if (key === 'recurring_cleaning') {
            const saveBadge = dom.createElement('div', {
                className: 'save-badge'
            }, 'Save 25%');
            button.appendChild(saveBadge);
        }

        // Add click handler
        dom.addEventListener(button, 'click', () => selectService(key));

        elements.serviceButtons.appendChild(button);
    });
}

/**
 * Handle service selection
 */
export function selectService(serviceKey) {
    const wasAlreadySelected = stateManager.get('selectedServiceKey') === serviceKey;

    if (wasAlreadySelected) {
        // Proceed to next step
        const service = serviceData[serviceKey];
        if (service) {
            if (service.type === 'per_foot') {
                stateManager.update({ currentStep: 1 });
            } else if (serviceKey === 'item_recovery') {
                stateManager.update({ currentStep: 8 });
            } else {
                stateManager.update({ currentStep: 7 });
            }
        }
        return;
    }

    // Clear previous selections
    dom.querySelectorAll('.service-option').forEach(btn => {
        dom.removeClass(btn, 'selected');
        dom.removeClass(btn, 'expanded');

        // Restore original content
        const key = btn.dataset.serviceKey;
        const service = serviceData[key];
        if (service) {
            dom.clearChildren(btn);

            const nameDiv = dom.createElement('div', { className: 'service-name' }, service.name);
            btn.appendChild(nameDiv);

            const priceDiv = dom.createElement('div', { className: 'service-price' });
            if (service.type === 'per_foot') {
                priceDiv.textContent = `$${service.rate} per foot`;
            } else {
                priceDiv.textContent = `$${service.rate} flat rate`;
            }
            btn.appendChild(priceDiv);

            if (key === 'recurring_cleaning') {
                const saveBadge = dom.createElement('div', {
                    className: 'save-badge'
                }, 'Save 25%');
                btn.appendChild(saveBadge);
            }
        }
    });

    // Select new service
    const selectedButton = dom.querySelector(`[data-service-key="${serviceKey}"]`);
    if (selectedButton) {
        dom.addClass(selectedButton, 'selected');
        dom.addClass(selectedButton, 'expanded');

        const service = serviceData[serviceKey];
        if (service && service.description) {
            const descDiv = dom.createElement('div', {
                className: 'service-description-inline'
            }, service.description);
            selectedButton.appendChild(descDiv);

            const hintDiv = dom.createElement('div', {
                className: 'service-click-hint'
            }, '→ Click again to continue');
            selectedButton.appendChild(hintDiv);
        }
    }

    stateManager.update({ selectedServiceKey: serviceKey });

    // Hide service price explainer
    if (elements.servicePriceExplainer) {
        dom.hide(elements.servicePriceExplainer);
    }

    // Scroll to show services
    setTimeout(() => {
        const firstService = dom.querySelector('[data-service-key="recurring_cleaning"]');
        if (firstService) {
            dom.scrollToElement(firstService, 20);
        }
    }, 100);
}

/**
 * Render current step
 */
function renderCurrentStep() {
    const currentStep = stateManager.get('currentStep');

    // Show/hide step elements
    stepElements.forEach((stepEl, index) => {
        if (stepEl) {
            if (index === currentStep) {
                dom.show(stepEl);
            } else {
                dom.hide(stepEl);
            }
        }
    });

    // Scroll to active step
    if (currentStep > 0) {
        setTimeout(() => {
            const activeStep = stepElements[currentStep];
            if (activeStep) {
                const heading = activeStep.querySelector('h2, h3, .question-text');
                const targetElement = heading || activeStep;
                dom.scrollToElement(targetElement, 30);
            }
        }, 100);
    }

    updateNavigationButtons();
}

/**
 * Update navigation button states and text
 */
function updateNavigationButtons() {
    const state = stateManager.get();
    const currentStep = state.currentStep;

    // Back button visibility
    if (elements.backButton) {
        if (currentStep === 0) {
            dom.hide(elements.backButton);
        } else {
            dom.show(elements.backButton, 'inline-block');
        }
    }

    // Next button text and state
    if (elements.nextButton) {
        const buttonText = stateManager.getNextButtonText();
        dom.setText(elements.nextButton, buttonText);

        const canProceed = stateManager.canProceed();
        dom.setEnabled(elements.nextButton, canProceed);
    }
}

/**
 * Handle next button click
 */
function handleNextClick() {
    const state = stateManager.get();
    const currentStep = state.currentStep;
    const totalSteps = stepElements.length;

    // If on results, reset
    if (currentStep === totalSteps - 1) {
        resetForm();
        return;
    }

    // Validate boat length if on that step
    if (currentStep === 1 && !validateBoatLength()) {
        return;
    }

    // Update form values before proceeding
    updateFormValues();

    // Get next step
    const nextStep = stateManager.getNextStep();
    stateManager.update({ currentStep: nextStep });
}

/**
 * Handle back button click
 */
function handleBackClick() {
    const prevStep = stateManager.getPreviousStep();
    stateManager.update({ currentStep: prevStep });
}

/**
 * Validate boat length input
 */
function validateBoatLength() {
    const length = dom.parseNumber(dom.getValue(elements.boatLength));

    if (isNaN(length) || length <= 0) {
        dom.show(elements.boatLengthError);
        elements.boatLength.focus();
        return false;
    }

    dom.hide(elements.boatLengthError);
    return true;
}

/**
 * Update form values in state
 */
function updateFormValues() {
    const formValues = {
        boatLength: dom.parseNumber(dom.getValue(elements.boatLength)),
        boatType: dom.querySelector('input[name="boat_type"]:checked')?.value || 'sailboat',
        hullType: dom.querySelector('input[name="hull_type"]:checked')?.value || 'monohull',
        twinEngines: dom.getValue(elements.twinEnginesCheckbox) || false,
        lastPainted: dom.getValue(elements.lastPaintedTime) || '0-6_months',
        lastCleaned: dom.getValue(elements.lastCleanedTime) || '0-2_months',
        anodesToInstall: parseInt(dom.getValue(elements.anodesToInstall)) || 0
    };

    stateManager.update({ formValues });
}

/**
 * Calculate and display cost
 */
export function calculateAndDisplayCost() {
    const state = stateManager.get();
    const { selectedServiceKey, formValues } = state;

    if (!selectedServiceKey) {
        if (elements.costBreakdown) {
            dom.setText(elements.costBreakdown, 'Please select a service first.');
        }
        if (elements.totalCostDisplay) {
            dom.setText(elements.totalCostDisplay, '$0.00');
        }
        return;
    }

    // Check for admin page direct conditions
    const actualPaintCondition = dom.getElementById('actualPaintCondition');
    const actualGrowthLevel = dom.getElementById('actualGrowthLevel');

    const params = {
        serviceKey: selectedServiceKey,
        boatLength: formValues.boatLength,
        boatType: formValues.boatType,
        hullType: formValues.hullType,
        hasTwinEngines: formValues.twinEngines,
        lastPaintedTime: formValues.lastPainted,
        lastCleanedTime: formValues.lastCleaned,
        anodesToInstall: formValues.anodesToInstall
    };

    // Add actual conditions if in admin mode
    if (actualPaintCondition && actualGrowthLevel) {
        params.actualPaintCondition = dom.getValue(actualPaintCondition);
        params.actualGrowthLevel = dom.getValue(actualGrowthLevel);
    }

    const result = calculateServiceCost(params);

    if (result.success) {
        // Format and display breakdown
        const isEstimate = !actualPaintCondition;
        const breakdown = formatBreakdown(result.breakdown, isEstimate);
        const lines = breakdown.split('\n');
        const breakdownHTML = dom.createBreakdownHTML(lines);

        if (elements.costBreakdown) {
            dom.setHTML(elements.costBreakdown, breakdownHTML);
        }

        if (elements.totalCostDisplay) {
            dom.setText(elements.totalCostDisplay, dom.formatCurrency(result.total));
        }

        // Update order data
        stateManager.update({
            orderData: {
                estimate: result.total,
                service: result.service,
                boatLength: formValues.boatLength,
                serviceDetails: {
                    ...result
                }
            }
        });

        // Add checkout button if on results page
        if (state.currentStep === 8 && !dom.getElementById('checkout-button')) {
            addCheckoutButton();
        }

    } else {
        if (elements.costBreakdown) {
            dom.setText(elements.costBreakdown, result.error);
        }
        if (elements.totalCostDisplay) {
            dom.setText(elements.totalCostDisplay, '$0.00');
        }
    }
}

/**
 * Add checkout button to results
 */
function addCheckoutButton() {
    const checkoutButton = dom.createElement('button', {
        id: 'checkout-button',
        className: 'submit-button'
    }, 'Proceed to Checkout');

    checkoutButton.style.marginTop = '20px';
    checkoutButton.style.marginBottom = '10px';

    dom.addEventListener(checkoutButton, 'click', showCheckout);

    const navButtons = dom.querySelector('.navigation-buttons');
    if (navButtons && navButtons.parentNode) {
        navButtons.parentNode.insertBefore(checkoutButton, navButtons);
    } else {
        const resultSection = dom.getElementById('step-8');
        resultSection.appendChild(checkoutButton);
    }
}

/**
 * Show checkout section
 */
function showCheckout() {
    // This will be handled by checkoutHandler module
    window.dispatchEvent(new CustomEvent('showCheckout'));
}

/**
 * Update paint surcharge display
 */
function updatePaintSurchargeDisplay() {
    const lastPaintedValue = dom.getValue(elements.lastPaintedTime);
    if (!lastPaintedValue || !elements.paintExplainer) return;

    const paintCondition = getPaintCondition(lastPaintedValue);
    let paintSurcharge = 0;

    if (paintCondition === 'Poor') {
        if (lastPaintedValue === '22-24_months') {
            paintSurcharge = 0.05;
        } else if (lastPaintedValue === 'over_24_months' || lastPaintedValue === 'unsure_paint') {
            paintSurcharge = 0.15;
        }
    }

    const explainerHTML = `Est. Paint Condition: <strong>${paintCondition}</strong>. Potential surcharge: <strong>+${(paintSurcharge * 100).toFixed(1)}%</strong>.`;
    dom.setHTML(elements.paintExplainer, explainerHTML);
}

/**
 * Update growth surcharge display
 */
function updateGrowthSurchargeDisplay() {
    const lastCleanedValue = dom.getValue(elements.lastCleanedTime);
    if (!lastCleanedValue || !elements.growthExplainer) return;

    const lastPaintedValue = dom.getValue(elements.lastPaintedTime);
    const paintCondition = lastPaintedValue ? getPaintCondition(lastPaintedValue) : 'Good';
    const growthLevel = getGrowthLevel(paintCondition, lastCleanedValue);

    let explainerMsg = `Est. Growth Level: <strong>${growthLevel}</strong>. `;

    if (growthLevel === 'Minimal' || growthLevel === 'Moderate') {
        explainerMsg += `Potential surcharge: <strong>0%</strong>.`;
    } else if (growthLevel === 'Heavy') {
        explainerMsg += `Potential surcharge: <strong>+25-50%</strong>.`;
    } else if (growthLevel === 'Severe') {
        explainerMsg += `Potential surcharge: <strong>+200%</strong>.`;
    }

    dom.setHTML(elements.growthExplainer, explainerMsg);
}

/**
 * Reset form to initial state
 */
export function resetForm() {
    stateManager.reset();

    // Reset form inputs
    dom.setValue(elements.boatLength, 30);
    dom.hide(elements.boatLengthError);
    dom.setValue(dom.getElementById('boat_type_sailboat'), true);
    dom.setValue(dom.getElementById('hull_monohull'), true);
    dom.setValue(elements.twinEnginesCheckbox, false);
    dom.setValue(elements.lastPaintedTime, '0-6_months');
    dom.setValue(elements.lastCleanedTime, '0-2_months');
    dom.setValue(elements.anodesToInstall, 0);

    // Clear results
    if (elements.costBreakdown) dom.setText(elements.costBreakdown, '');
    if (elements.totalCostDisplay) dom.setText(elements.totalCostDisplay, '$0.00');

    // Reset explainers
    if (elements.paintExplainer) {
        dom.setHTML(elements.paintExplainer, "The age of your boat's bottom paint helps us estimate its current condition.");
    }
    if (elements.growthExplainer) {
        dom.setHTML(elements.growthExplainer, "The time since your last hull cleaning is a key factor in estimating marine growth.");
    }

    // Remove checkout button
    const checkoutButton = dom.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.remove();
    }

    // Clear service selection
    dom.querySelectorAll('.service-option').forEach(btn => {
        dom.removeClass(btn, 'selected');
        dom.removeClass(btn, 'expanded');
    });

    populateServiceButtons();
    renderCurrentStep();
}