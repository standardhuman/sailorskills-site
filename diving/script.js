const serviceData = {
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
const minimumCharge = 150;

const estPaintLabels = {
    EXCELLENT: "Excellent", // Simplified for explainer text
    GOOD: "Good",
    FAIR: "Fair"
};
const estGrowthLabels = { // Simplified for explainer text
    MINIMAL: "Minimal",
    MODERATE: "Moderate",
    HEAVY: "Heavy",
    SEVERE: "Severe"
};

// New surcharge mappings based on refined logic
const paintConditions = {
    EXCELLENT: "Excellent",
    GOOD: "Good",
    FAIR: "Fair",
    POOR: "Poor",
    MISSING: "Missing"
};

/*
const paintSurchargesByCondition = { // This map is no longer directly used for surcharge percentage
    [paintConditions.EXCELLENT]: 0,
    [paintConditions.GOOD]: 0.0375,
    [paintConditions.FAIR]: 0.075,
    [paintConditions.POOR]: 0.10 // Surcharge for Poor, can be adjusted
};
*/

// const growthSurchargesByLevel = { // This map is no longer directly used for surcharge percentage
//     [estGrowthLabels.MINIMAL]: 0,      
//     [estGrowthLabels.MODERATE]: 0,     
//     [estGrowthLabels.HEAVY]: 0.25,     
//     [estGrowthLabels.SEVERE]: 0.50      
// };

let currentStep = 0;
const stepElements = []; // Will be populated with DOM elements

// DOM Elements (cache them for performance and clarity)
let serviceButtons, servicePriceExplainer;
let selectedServiceKey = null; // Track selected service
let boatLengthInput, boatLengthError;
let costBreakdownEl, totalCostDisplayEl;
let paintExplainerEl, growthExplainerEl;
let backButton, nextButton;
let anodesToInstallInput;
let twinEnginesCheckbox; // Added for the new checkbox

// Checkout flow elements
let checkoutSection;
let selectedServiceInterval = null;
let stripe = null;
let elements = null;
let cardElement = null;

// Store order data
let orderData = {
    estimate: 0,
    service: '',
    boatLength: 0,
    serviceDetails: {}
};


document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    serviceButtons = document.getElementById('serviceButtons');
    servicePriceExplainer = document.getElementById('servicePriceExplainer');
    boatLengthInput = document.getElementById('boatLength');
    boatLengthError = document.getElementById('boatLengthError');
    anodesToInstallInput = document.getElementById('anodesToInstall');
    twinEnginesCheckbox = document.getElementById('has_twin_engines'); // Cache the checkbox
    
    costBreakdownEl = document.getElementById('costBreakdown');
    totalCostDisplayEl = document.getElementById('totalCostDisplay');
    paintExplainerEl = document.getElementById('paintExplainerText');
    growthExplainerEl = document.getElementById('growthExplainerText');
    
    backButton = document.getElementById('backButton');
    nextButton = document.getElementById('nextButton');
    
    // Checkout elements
    checkoutSection = document.getElementById('checkout-section');

    // Populate stepElements array
    stepElements.push(document.getElementById('step-0'));
    stepElements.push(document.getElementById('step-1'));
    stepElements.push(document.getElementById('step-2'));
    stepElements.push(document.getElementById('step-3'));
    stepElements.push(document.getElementById('step-4'));
    stepElements.push(document.getElementById('step-5'));
    stepElements.push(document.getElementById('step-6'));
    stepElements.push(document.getElementById('step-7'));
    stepElements.push(document.getElementById('step-8'));

    populateServiceButtons();
    
    // Only add event listeners if the buttons exist (not on admin page)
    if (nextButton) {
        nextButton.addEventListener('click', handleNextClick);
    }
    if (backButton) {
        backButton.addEventListener('click', handleBackClick);
    }
    
    // Add event listeners for paint and cleaning dropdowns to update surcharge displays
    const lastPaintedDropdown = document.getElementById('lastPaintedTime');
    const lastCleanedDropdown = document.getElementById('lastCleanedTime');
    
    if (lastPaintedDropdown) {
        lastPaintedDropdown.addEventListener('change', updatePaintSurchargeDisplay);
    }
    
    if (lastCleanedDropdown) {
        lastCleanedDropdown.addEventListener('change', updateGrowthSurchargeDisplay);
    }
    
    // Initialize Stripe
    initializeStripe();
    
    // Setup checkout event listeners
    setupCheckoutListeners();

    renderCurrentStep(); // Initial render
});

function populateServiceButtons() {
    // Skip if serviceButtons element doesn't exist
    if (!serviceButtons) {
        console.log('serviceButtons element not found, skipping population');
        return;
    }
    
    // Clear existing buttons if any
    serviceButtons.innerHTML = '';
    
    // Define the order to display services
    const serviceOrder = ['recurring_cleaning', 'onetime_cleaning', 'separator', 'anodes_only', 'underwater_inspection', 'item_recovery', 'propeller_service'];
    
    console.log('Populating service buttons with click handlers...');
    
    for (const key of serviceOrder) {
        // Add a separator between cleaning and other services
        if (key === 'separator') {
            const separator = document.createElement('div');
            separator.className = 'service-separator';
            separator.innerHTML = '<span>Other Services</span>';
            serviceButtons.appendChild(separator);
            continue;
        }

        const service = serviceData[key];
        const button = document.createElement('div');
        button.className = 'service-option';
        // Add special class for cleaning services
        if (key === 'recurring_cleaning' || key === 'onetime_cleaning') {
            button.className += ' cleaning-service';
        }
        // Add special class for underwater inspection to make it full-width
        if (key === 'underwater_inspection' || key === 'anodes_only') {
            button.className += ' full-width-service';
        }
        button.dataset.serviceKey = key;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'service-name';
        nameDiv.textContent = service.name;
        button.appendChild(nameDiv);
        
        const priceDiv = document.createElement('div');
        priceDiv.className = 'service-price';
        if (service.type === 'per_foot') {
            priceDiv.textContent = `$${service.rate} per foot`;
        } else if (key === 'anodes_only') {
            priceDiv.textContent = 'Per anode rate';
        } else {
            priceDiv.textContent = `$${service.rate} flat rate`;
        }
        button.appendChild(priceDiv);
        
        // Add "Save 25%" badge to recurring cleaning option
        if (key === 'recurring_cleaning') {
            const saveBadge = document.createElement('div');
            saveBadge.className = 'save-badge';
            saveBadge.textContent = 'Save 25%';
            button.appendChild(saveBadge);
        }
        
        button.addEventListener('click', function() {
            console.log('Service button clicked:', key);
            selectService(key);
        });
        console.log('Added click listener for:', key);
        
        serviceButtons.appendChild(button);
    }
}

// Function to handle smooth transition from service buttons to details form
function transitionToDetailsForm(serviceKey) {
    const service = serviceData[serviceKey];
    if (!service) return;
    
    const serviceContainer = document.getElementById('step-0');
    const serviceGrid = serviceContainer.querySelector('.service-selection-grid');
    
    // Fade out the service buttons
    serviceGrid.classList.add('service-fade-container', 'fade-out');
    
    // After fade out, replace content with the next step's content
    setTimeout(() => {
        // Move to the next step
        currentStep = 1;
        
        // Hide the service selection step
        document.getElementById('step-0').style.display = 'none';
        
        // Show the next appropriate step
        const nextStepElement = getNextStepElement();
        if (nextStepElement) {
            nextStepElement.style.display = 'block';
            nextStepElement.classList.add('service-fade-container', 'fade-in');
            
            // Remove fade-in class after animation
            setTimeout(() => {
                nextStepElement.classList.remove('service-fade-container', 'fade-in');
            }, 600);
        }
        
        // Update navigation
        renderCurrentStep();
        
        // Scroll to top of the form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
}

// Helper function to get the next step element based on service type
function getNextStepElement() {
    const service = serviceData[selectedServiceKey];
    if (!service) return null;
    
    if (service.type === 'per_foot') {
        return document.getElementById('step-1'); // Boat length step
    } else {
        return document.getElementById('step-7'); // Anodes step for flat rate services
    }
}

function selectService(serviceKey) {
    console.log('selectService called with:', serviceKey);
    
    // Check if this service is already selected
    const wasAlreadySelected = selectedServiceKey === serviceKey;
    
    // If already selected, perform fade transition to next step
    if (wasAlreadySelected) {
        console.log('Service already selected, transitioning to details form');
        // Check if in admin interface
        if (typeof window.transitionToDetailsForm === 'function') {
            window.transitionToDetailsForm(serviceKey);
        } else {
            // For public diving page, proceed to next step
            const service = serviceData[serviceKey];
            if (service) {
                // Hide service selection
                const step0 = document.getElementById('step-0');
                if (step0) {
                    step0.classList.remove('active');
                    step0.style.display = 'none';
                }
                
                // Show appropriate next step based on service type
                if (service.type === 'per_foot') {
                    // For per-foot services, go to step 1 (boat details)
                    const step1 = document.getElementById('step-1');
                    if (step1) {
                        step1.classList.add('active');
                        step1.style.display = 'block';
                        currentStep = 1; // Set current step
                    }
                } else {
                    // For flat rate services, skip boat details and go to anodes
                    const step7 = document.getElementById('step-7');
                    if (step7) {
                        step7.classList.add('active');
                        step7.style.display = 'block';
                        currentStep = 7; // Set current step
                    }
                }
                
                // Update navigation
                renderCurrentStep();
            }
        }
        return;
    }
    
    // First, restore all buttons to their original state
    document.querySelectorAll('.service-option').forEach(btn => {
        btn.classList.remove('selected', 'expanded');
        // Restore original content if it was expanded
        const key = btn.dataset.serviceKey;
        const service = serviceData[key];
        if (service) {
            // Clear and rebuild original button content
            btn.innerHTML = '';
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'service-name';
            nameDiv.textContent = service.name;
            btn.appendChild(nameDiv);
            
            const priceDiv = document.createElement('div');
            priceDiv.className = 'service-price';
            if (service.type === 'per_foot') {
                priceDiv.textContent = `$${service.rate} per foot`;
            } else {
                priceDiv.textContent = `$${service.rate} flat rate`;
            }
            btn.appendChild(priceDiv);
            
            // Re-add "Save 25%" badge to recurring cleaning
            if (key === 'recurring_cleaning') {
                const saveBadge = document.createElement('div');
                saveBadge.className = 'save-badge';
                saveBadge.textContent = 'Save 25%';
                btn.appendChild(saveBadge);
            }
        }
    });
    
    // Add selected class and expand the clicked button with description
    const selectedButton = document.querySelector(`[data-service-key="${serviceKey}"]`);
    if (selectedButton) {
        selectedButton.classList.add('selected', 'expanded');
        
        // Add description to the selected button
        const service = serviceData[serviceKey];
        if (service && service.description) {
            const descDiv = document.createElement('div');
            descDiv.className = 'service-description-inline';
            descDiv.textContent = service.description;
            selectedButton.appendChild(descDiv);
            
            // Add "click again" hint
            const hintDiv = document.createElement('div');
            hintDiv.className = 'service-click-hint';
            hintDiv.textContent = '→ Click again to continue';
            selectedButton.appendChild(hintDiv);
        }
    }
    
    // Update selected service
    selectedServiceKey = serviceKey;
    console.log('Set selectedServiceKey to:', selectedServiceKey);
    
    // Hide the old service price explainer since description is now inline
    if (servicePriceExplainer) {
        servicePriceExplainer.style.display = 'none';
    }
    
    // Update button states to enable the Next button
    renderCurrentStep();
    
    // Scroll to position the recurring cleaning service (first service) at the top of viewport
    setTimeout(() => {
        const firstServiceButton = document.querySelector('[data-service-key="recurring_cleaning"]');
        if (firstServiceButton) {
            // Get the first service button's position
            const buttonRect = firstServiceButton.getBoundingClientRect();
            // Scroll to put the recurring cleaning service at the top with a small offset
            const scrollTo = window.pageYOffset + buttonRect.top - 20; // 20px padding from top
            
            // Smooth scroll to show recurring cleaning at top
            window.scrollTo({
                top: scrollTo,
                behavior: 'smooth'
            });
        }
    }, 100); // Small delay to ensure DOM updates
    
    // Calculate cost for the selected service
    console.log('About to call calculateCost...');
    calculateCost();
    console.log('calculateCost finished');
    
    // Update charge summary if on admin page
    if (typeof window.updateChargeSummary === 'function') {
        console.log('Calling updateChargeSummary...');
        window.updateChargeSummary();
    }
}

function updateServicePriceExplainer() {
    // Check if servicePriceExplainer exists (might not exist on admin page)
    if (servicePriceExplainer) {
        if (selectedServiceKey && serviceData[selectedServiceKey]) {
            const service = serviceData[selectedServiceKey];
            servicePriceExplainer.textContent = service.description || "Select a service to see its description.";
        } else {
            servicePriceExplainer.textContent = "Select a service to see its description.";
        }
    }
    renderCurrentStep(); // Add this call to update button states
}

function renderCurrentStep() {
    // console.log('renderCurrentStep - currentStep:', currentStep);
    // console.log('renderCurrentStep - stepElements.length:', stepElements.length);

    // Skip if we're on a page without step navigation
    if (!stepElements || stepElements.length === 0) {
        return;
    }

    // Safety check: Never show anode step (7) for item recovery
    if (selectedServiceKey === 'item_recovery' && currentStep === 7) {
        console.warn('Warning: Attempted to show anode step for item recovery. Skipping to results.');
        currentStep = 8;
    }

    stepElements.forEach((stepEl, index) => {
        if (!stepEl) {
            console.error(`Step element at index ${index} is null!`);
            return;
        }
        stepEl.style.display = (index === currentStep) ? 'block' : 'none';
    });
    
    // Scroll to focus on the content for steps after service selection
    if (currentStep > 0) {
        setTimeout(() => {
            // Find the active step content
            const activeStep = stepElements[currentStep];
            if (activeStep) {
                // Find the first heading or form element in the active step
                const heading = activeStep.querySelector('h2, h3, .question-text');
                const targetElement = heading || activeStep;
                
                // Calculate position
                const rect = targetElement.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const targetPosition = rect.top + scrollTop - 30; // 30px padding from top
                
                // Scroll to position
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }

    // Button visibility and text
    if (backButton) {
        backButton.style.display = (currentStep === 0) ? 'none' : 'inline-block';
    }
    
    const totalSteps = stepElements.length;
    const perFootServiceSteps = [1, 2, 3, 4, 5, 6]; // Indices of per-foot only steps
    const isPerFootService = selectedServiceKey && serviceData[selectedServiceKey] && serviceData[selectedServiceKey].type === 'per_foot';

    if (nextButton && currentStep === totalSteps - 1) { // Last step (Results)
        nextButton.textContent = 'Start Over';
    } else if (nextButton && currentStep === 0) {
        if (isPerFootService) {
            nextButton.textContent = 'Next (Boat Length)';
        } else if (selectedServiceKey) { // Flat rate service selected
            // For recovery, go straight to estimate
            if (selectedServiceKey === 'item_recovery') {
                nextButton.textContent = 'View Estimate';
            } else {
                nextButton.textContent = 'Next (Anodes)';
            }
        } else {
            nextButton.textContent = 'Next'; // Default if no service selected yet
        }
    } else if (nextButton && selectedServiceKey === 'underwater_inspection') {
        // Special handling for underwater inspection navigation
        if (currentStep === 1) nextButton.textContent = 'Next (Hull Type)';
        else if (currentStep === 3) nextButton.textContent = 'View Estimate';
        else nextButton.textContent = 'Next';
    } else if (nextButton && isPerFootService) {
        if (currentStep === 1) nextButton.textContent = 'Next (Boat Type)';
        else if (currentStep === 2) nextButton.textContent = 'Next (Hull Type)';
        else if (currentStep === 3) nextButton.textContent = 'Next (Engine Config)';
        else if (currentStep === 4) nextButton.textContent = 'Next (Paint Age)';
        else if (currentStep === 5) nextButton.textContent = 'Next (Last Cleaned)';
        else if (currentStep === 6) nextButton.textContent = 'Next (Anodes)';
        else if (currentStep === 7) nextButton.textContent = 'View Estimate';
        else nextButton.textContent = 'Next'; // Should not happen in per-foot flow
    } else if (nextButton) { // Flat rate service, and currentStep > 0
        if (currentStep === 7) { // Anodes step for flat rate (equivalent of old step-2)
            nextButton.textContent = 'View Estimate';
        } else {
             nextButton.textContent = 'Next'; // Should ideally not be reached if skipping correctly
        }
    }
    
    // Disable Next if no service is selected on the first step
    if (nextButton && currentStep === 0 && (!selectedServiceKey || selectedServiceKey === "")) {
        nextButton.disabled = true;
        nextButton.textContent = 'Next'; // Reset text if it was 'View Estimate'
    } else if (nextButton) {
        nextButton.disabled = false;
    }
}

function validateStep1Inputs() {
    const length = parseFloat(boatLengthInput.value);
    if (isNaN(length) || length <= 0) {
        boatLengthError.style.display = 'block';
        boatLengthInput.focus();
        return false;
    }
    boatLengthError.style.display = 'none';
    return true;
}

function handleNextClick() {
    // console.log('handleNextClick - currentStep at start:', currentStep);
    
    const serviceType = serviceData[selectedServiceKey]?.type;
    const totalSteps = stepElements.length;
    // console.log('handleNextClick - totalSteps:', totalSteps);

    // Ensure currentStep is a number for safety, though it should be.
    let numericCurrentStep = parseInt(currentStep, 10);

    if (numericCurrentStep === totalSteps - 1) { // Current step is Results (e.g., step 8 if totalSteps is 9)
        // console.log('handleNextClick - Resetting form');
        resetForm();
        return;
    }

    // Validation for Boat Length (Step 1)
    if (numericCurrentStep === 1 && serviceType === 'per_foot') {
        if (!validateStep1Inputs()) {
            // console.log('handleNextClick - Validation failed for step 1');
            return; 
        }
    }

    let nextStep = numericCurrentStep + 1;
    // console.log('handleNextClick - Initial nextStep:', nextStep);

    // Special handling for underwater inspection - go to boat length, then hull type, then results
    if (selectedServiceKey === 'underwater_inspection') {
        if (numericCurrentStep === 0) {
            nextStep = 1; // Go to boat length
        } else if (numericCurrentStep === 1) {
            nextStep = 3; // Skip boat type, go to hull type
        } else if (numericCurrentStep === 3) {
            nextStep = 8; // Go to results
        }
    }
    // Skip per-foot steps if service is flat rate, ONLY when starting from step 0
    else if (serviceType === 'flat' && numericCurrentStep === 0) {
        // For recovery services, skip anodes and go straight to results
        if (selectedServiceKey === 'item_recovery') {
            nextStep = 8; // Skip directly to Results
            console.log('handleNextClick - Item Recovery service detected, skipping anodes, going directly to step 8');
        } else {
            nextStep = 7; // Skip to Anodes (Step 7) for other flat rate services
            // console.log('handleNextClick - Flat rate service, skipping to step 7. nextStep:', nextStep);
        }
    }
    
    currentStep = nextStep;
    // console.log('handleNextClick - Updated currentStep:', currentStep);

    if (currentStep === totalSteps -1) { // If new currentStep is the Results step
        // console.log('handleNextClick - Calculating cost for results step');
        try {
            calculateCost();
        } catch (error) {
            console.error('Error in calculateCost:', error);
        }
    }
    renderCurrentStep();
}

function handleBackClick() {
    if (currentStep === 0) return; // Should not happen if button is hidden

    const serviceType = serviceData[selectedServiceKey]?.type;
    const totalSteps = stepElements.length;

    let prevStep = currentStep - 1;

    // If current service is flat rate
    if (serviceType === 'flat') {
        // If on Anodes (step 7), go back to Service Selection (step 0)
        if (currentStep === 7) {
            prevStep = 0;
        }
        // If on Results (step 8) for recovery, go back to Service Selection (step 0)
        else if (currentStep === 8 && selectedServiceKey === 'item_recovery') {
            prevStep = 0;
        }
        // For underwater inspection, navigate back through boat length and hull type
        else if (selectedServiceKey === 'underwater_inspection') {
            if (currentStep === 8) {
                prevStep = 3; // Back to hull type
            } else if (currentStep === 3) {
                prevStep = 1; // Back to boat length
            } else if (currentStep === 1) {
                prevStep = 0; // Back to service selection
            }
        }
    }
    
    currentStep = prevStep;
    renderCurrentStep();
}

function resetForm() {
    // Reset input fields to their initial values
    selectedServiceKey = null;
    document.querySelectorAll('.service-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    updateServicePriceExplainer();

    boatLengthInput.value = "30";
    boatLengthError.style.display = 'none';

    document.getElementById('boat_type_sailboat').checked = true;
    document.getElementById('hull_monohull').checked = true;
    if(twinEnginesCheckbox) {
        twinEnginesCheckbox.checked = false; // Reset new checkbox
    }
    
    document.getElementById('lastPaintedTime').value = '0-6_months'; // New default
    document.getElementById('lastCleanedTime').value = '0-2_months'; // New default
    
    anodesToInstallInput.value = "0";

    // Clear results
    if (costBreakdownEl) costBreakdownEl.innerText = "";
    if (totalCostDisplayEl) totalCostDisplayEl.innerText = "$0.00";
    if (paintExplainerEl) {
        paintExplainerEl.innerHTML = "The age of your boat's bottom paint helps us estimate its current condition."; // Reset explainer
    }
    if (growthExplainerEl) {
        growthExplainerEl.innerHTML = "The time since your last hull cleaning is a key factor in estimating marine growth."; // Reset explainer
    }

    // Remove checkout button if it exists
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.remove();
    }
    
    // Hide checkout section
    if (checkoutSection) {
        checkoutSection.style.display = 'none';
    }
    
    // Reset checkout form
    selectedServiceInterval = null;
    const intervalOptions = document.querySelectorAll('.interval-option');
    intervalOptions.forEach(opt => opt.classList.remove('selected'));
    
    // Clear checkout form fields
    const checkoutInputs = document.querySelectorAll('#checkout-section input:not([type="checkbox"])');
    checkoutInputs.forEach(input => input.value = '');
    document.getElementById('service-agreement').checked = false;
    
    // Reset order data
    orderData = {
        estimate: 0,
        service: '',
        boatLength: 0,
        serviceDetails: {}
    };
    
    // Show navigation and service info
    document.querySelector('.navigation-buttons').style.display = 'flex';
    document.querySelector('.service-info-section').style.display = 'block';

    currentStep = 0;
    renderCurrentStep();
}


function calculateCost() {
    console.log('calculateCost - starting with selectedServiceKey:', selectedServiceKey);
    
    // Re-initialize elements if they're null (for admin page)
    if (!costBreakdownEl) {
        costBreakdownEl = document.getElementById('costBreakdown');
        console.log('Initialized costBreakdownEl:', costBreakdownEl ? 'found' : 'not found');
    }
    if (!totalCostDisplayEl) {
        totalCostDisplayEl = document.getElementById('totalCostDisplay');
        console.log('Initialized totalCostDisplayEl:', totalCostDisplayEl ? 'found' : 'not found');
    }
    if (!twinEnginesCheckbox) {
        twinEnginesCheckbox = document.getElementById('has_twin_engines');
        console.log('Initialized twinEnginesCheckbox:', twinEnginesCheckbox ? 'found' : 'not found');
    }
    
    if (!selectedServiceKey) {
        console.log('No service key selected');
        if (costBreakdownEl) costBreakdownEl.innerText = "Please select a service first.";
        if (totalCostDisplayEl) totalCostDisplayEl.innerText = "$0.00";
        return;
    }
    const currentServiceData = serviceData[selectedServiceKey];
    console.log('Service data for', selectedServiceKey, ':', currentServiceData);
    
    let boatLength = 0;
    let isPowerboat = false;
    let additionalHulls = 0;
    let additionalProps = 0;
    
    let paintSurchargePercent = 0;
    let estimatedPaintConditionBaseLabel = ""; 
    let growthSurchargePercent = 0;
    let estimatedGrowthLevelBaseLabel = ""; 
    
    if (costBreakdownEl) costBreakdownEl.innerHTML = ""; // Clear previous results
    if (totalCostDisplayEl) totalCostDisplayEl.innerText = "$0.00"; 

    // Check if we're on the admin page with direct condition dropdowns
    const actualPaintCondition = document.getElementById('actualPaintCondition');
    const actualGrowthLevel = document.getElementById('actualGrowthLevel');
    
    if (actualPaintCondition && actualGrowthLevel) {
        // Direct condition mode (admin page)
        const paintValue = actualPaintCondition.value;
        const growthValue = actualGrowthLevel.value;
        
        // Map direct values to labels
        switch(paintValue) {
            case 'excellent': estimatedPaintConditionBaseLabel = paintConditions.EXCELLENT; break;
            case 'good': estimatedPaintConditionBaseLabel = paintConditions.GOOD; break;
            case 'fair': estimatedPaintConditionBaseLabel = paintConditions.FAIR; break;
            case 'poor': estimatedPaintConditionBaseLabel = paintConditions.POOR; break;
            case 'missing': estimatedPaintConditionBaseLabel = paintConditions.MISSING; break;
            default: estimatedPaintConditionBaseLabel = paintConditions.GOOD;
        }
        
        switch(growthValue) {
            case 'minimal': estimatedGrowthLevelBaseLabel = estGrowthLabels.MINIMAL; break;
            case 'moderate': estimatedGrowthLevelBaseLabel = estGrowthLabels.MODERATE; break;
            case 'heavy': estimatedGrowthLevelBaseLabel = estGrowthLabels.HEAVY; break;
            case 'severe': estimatedGrowthLevelBaseLabel = estGrowthLabels.SEVERE; break;
            default: estimatedGrowthLevelBaseLabel = estGrowthLabels.MINIMAL;
        }
        
        // Use direct surcharge functions
        paintSurchargePercent = getDirectPaintSurcharge(estimatedPaintConditionBaseLabel);
        growthSurchargePercent = getDirectGrowthSurcharge(estimatedGrowthLevelBaseLabel);
        
    } else {
        // Time-based estimation mode (regular calculator)
        // --- Determine Paint Condition & Surcharge ---
        const lastPaintedValue = document.getElementById('lastPaintedTime')?.value;
        if (lastPaintedValue) {
            estimatedPaintConditionBaseLabel = getPaintCondition(lastPaintedValue);
            paintSurchargePercent = getSpecificPaintSurchargePercent(estimatedPaintConditionBaseLabel, lastPaintedValue);
            if (paintExplainerEl) {
                paintExplainerEl.innerHTML = `Est. Paint Condition: <strong>${estimatedPaintConditionBaseLabel}</strong>. Potential surcharge: <strong>+${(paintSurchargePercent * 100).toFixed(1)}%</strong>.`;
            }
        }

        // --- Determine Growth & Surcharge ---
        const lastCleanedValue = document.getElementById('lastCleanedTime')?.value;
        if (lastCleanedValue) {
            estimatedGrowthLevelBaseLabel = getGrowthLevel(estimatedPaintConditionBaseLabel, lastCleanedValue);
            growthSurchargePercent = getSpecificGrowthSurchargePercent(estimatedPaintConditionBaseLabel, lastCleanedValue);
            
            let growthExplainerMsg = `Est. Growth Level: <strong>${estimatedGrowthLevelBaseLabel}</strong>. `;
            if (estimatedGrowthLevelBaseLabel === estGrowthLabels.MINIMAL || estimatedGrowthLevelBaseLabel === estGrowthLabels.MODERATE) {
                growthExplainerMsg += `Potential surcharge: <strong>0%</strong>.`;
            } else if (estimatedGrowthLevelBaseLabel === estGrowthLabels.HEAVY) {
                growthExplainerMsg += `Potential surcharge: <strong>+25-50%</strong>.`;
            } else if (estimatedGrowthLevelBaseLabel === estGrowthLabels.SEVERE) {
                growthExplainerMsg += `Potential surcharge: <strong>+200%</strong>.`;
            }

            if (growthExplainerEl) {
                growthExplainerEl.innerHTML = growthExplainerMsg;
            }
        }
    }

    // --- Main Calculation Logic ---
    let hullType = 'monohull'; // Default
    if (currentServiceData.type === 'per_foot') {
        boatLength = parseFloat(document.getElementById('boatLength').value) || 0;
        if (boatLength <= 0) {
            if (costBreakdownEl) costBreakdownEl.innerText = "Error: Boat length is invalid for a per-foot service. Please go back and enter a valid length.";
            if (totalCostDisplayEl) totalCostDisplayEl.innerText = "$0.00";
            return; 
        }
        isPowerboat = document.querySelector('input[name="boat_type"]:checked').value === 'powerboat';
        hullType = document.querySelector('input[name="hull_type"]:checked').value;
        if (hullType === 'catamaran') additionalHulls = 1;
        else if (hullType === 'trimaran') additionalHulls = 2;
        if (twinEnginesCheckbox && twinEnginesCheckbox.checked) {
            additionalProps = 1;
        }
    }
    
    const anodesToInstall = parseInt(anodesToInstallInput.value) || 0;
    let baseServiceCost = 0;
    let calculatedSubtotal = 0;
    let breakdown = `Service: ${currentServiceData.name}\n`;

    if (currentServiceData.type === 'per_foot' && boatLength > 0) {
        let initialBaseCost = currentServiceData.rate * boatLength;
        baseServiceCost = initialBaseCost; // Keep original calculation
        
        // Check if minimum will need to be applied later
        const serviceMinimum = minimumCharge;
        const belowMinimum = (initialBaseCost < serviceMinimum && initialBaseCost > 0);
        
        breakdown += `- Base (${currentServiceData.rate.toFixed(2)}/ft * ${boatLength}ft): $${initialBaseCost.toFixed(2)}\n`;

        let variableSurchargeTotal = 0;
        let variableDetails = "";

        // Calculate all surcharges based on actual boat cost, not minimum
        if (isPowerboat) {
            let surcharge = initialBaseCost * 0.25;  // Use actual cost, not minimum
            variableSurchargeTotal += surcharge;
            variableDetails += `  - Powerboat Surcharge (+25%): $${surcharge.toFixed(2)}\n`;
        }
        if (additionalHulls > 0) {
            let surchargeFactor = additionalHulls === 1 ? 0.25 : 0.50;
            let surcharge = initialBaseCost * surchargeFactor;  // Use actual cost
            variableSurchargeTotal += surcharge;
            variableDetails += `  - ${additionalHulls === 1 ? 'Catamaran' : 'Trimaran'} Surcharge (+${surchargeFactor * 100}%): $${surcharge.toFixed(2)}\n`;
        }
        if (additionalProps > 0) {
            let surcharge = initialBaseCost * 0.10;  // Use actual cost
            variableSurchargeTotal += surcharge;
            variableDetails += `  - Twin Engine Surcharge (+10%): $${surcharge.toFixed(2)}\n`;
        }
        
        // Only add paint and growth surcharges for cleaning services
        const isCleaningService = selectedServiceKey === 'onetime_cleaning' || selectedServiceKey === 'recurring_cleaning';
        
        if (isCleaningService) {
            let actualPaintSurchargeAmount = initialBaseCost * paintSurchargePercent;  // Use actual cost
            variableSurchargeTotal += actualPaintSurchargeAmount;
            // Remove "Actual" prefix - just use condition names
            const conditionPrefix = (actualPaintCondition && actualGrowthLevel) ? "" : "Est. ";
            variableDetails += `  - ${conditionPrefix}Paint (${estimatedPaintConditionBaseLabel}): +${(paintSurchargePercent * 100).toFixed(2)}% ($${actualPaintSurchargeAmount.toFixed(2)})\n`;
            
            let actualGrowthSurchargeAmount = initialBaseCost * growthSurchargePercent;  // Use actual cost
            variableSurchargeTotal += actualGrowthSurchargeAmount;
            variableDetails += `  - ${conditionPrefix}Growth (${estimatedGrowthLevelBaseLabel}): +${(growthSurchargePercent * 100).toFixed(0)}% ($${actualGrowthSurchargeAmount.toFixed(2)})\n`;
        }
        
        calculatedSubtotal = initialBaseCost + variableSurchargeTotal;  // Use actual cost as base
        if (variableDetails) {
            const surchargeHeaderText = (actualPaintCondition && actualGrowthLevel) ? "Variable Surcharges Applied:\n" : "Variable Surcharges Applied (Estimates):\n";
            breakdown += surchargeHeaderText + variableDetails; // variableDetails already has \n for its items
        }
        breakdown += `- Subtotal for Diving Service: $${calculatedSubtotal.toFixed(2)}\n`;

    } else if (currentServiceData.type === 'flat') {
        baseServiceCost = currentServiceData.rate;
        calculatedSubtotal = baseServiceCost;
        breakdown += `- Flat Rate: $${calculatedSubtotal.toFixed(2)}\n`;
    }

    let anodeInstallationCost = 0;
    if (anodesToInstall > 0) {
        anodeInstallationCost = anodesToInstall * 15;
        breakdown += `- Anode Installation (${anodesToInstall} @ $15 each): $${anodeInstallationCost.toFixed(2)}\n`;
    }
    
    let totalBeforeMinimum = calculatedSubtotal + anodeInstallationCost;
    totalBeforeMinimum = Math.max(0, totalBeforeMinimum); 
    
    let finalCost = totalBeforeMinimum;
    let serviceOrAnodesPriced = false;
    if (currentServiceData.type === 'flat' && baseServiceCost > 0) serviceOrAnodesPriced = true;
    if (currentServiceData.type === 'per_foot' && boatLength > 0 && baseServiceCost > 0) serviceOrAnodesPriced = true;
    if (anodeInstallationCost > 0) serviceOrAnodesPriced = true;

    if (serviceOrAnodesPriced) {
        // Apply minimum charge if needed, but no rounding
        if (totalBeforeMinimum > 0 && totalBeforeMinimum >= minimumCharge) {
            finalCost = totalBeforeMinimum;
        } else if (totalBeforeMinimum < minimumCharge && totalBeforeMinimum > 0) {
            finalCost = minimumCharge;
        }
        
        // Use "Total" instead of "Total Estimate" when in direct condition mode
        const totalLabel = (actualPaintCondition && actualGrowthLevel) ? "Total" : "Total Estimate";
        breakdown += `\n${totalLabel}: $${finalCost.toFixed(2)}\n`;
        if (totalBeforeMinimum < minimumCharge && totalBeforeMinimum > 0) {
            breakdown += `Applied Minimum Charge: $${minimumCharge.toFixed(2)}\n`;
        }
    } else {
        finalCost = 0;
        if (currentStep === stepElements.length - 1) { 
             breakdown = "No services or anodes selected, or invalid input for selected per-foot service.\n";
        } else {
            breakdown = ""; 
        }
    }

    const lines = breakdown.trim().split('\n');
    if (costBreakdownEl) {
        costBreakdownEl.innerHTML = lines.map(line => {
        if (line.trim() === "") return ""; 
        if (line.startsWith('  - ')) {
            return `<span class="breakdown-item breakdown-detail">${line.replace('  - ', '&nbsp;&nbsp;&bull;&nbsp;')}</span>`;
        } else if (line.startsWith('- ')) {
            return `<span class="breakdown-item">${line.replace('- ', '&bull;&nbsp;')}</span>`;
        } else if (line.toLowerCase().includes("total estimate:") || line.toLowerCase().includes("applied minimum charge:")) {
            return `<strong class="breakdown-total-line">${line}</strong>`;
        } else if (line.toLowerCase().startsWith("service:") || line.toLowerCase().startsWith("variable surcharges applied") || line.toLowerCase().startsWith("subtotal for diving service:")) {
            return `<strong class="breakdown-header">${line}</strong>`;
        }
        return `<span class="breakdown-line">${line}</span>`; 
        }).join('');
    }

    if (finalCost % 1 === 0) {
        if (totalCostDisplayEl) totalCostDisplayEl.innerText = `$${finalCost}`;
    } else {
        if (totalCostDisplayEl) totalCostDisplayEl.innerText = `$${finalCost.toFixed(2)}`;
    }
    
    // Store order data
    orderData.estimate = finalCost;
    orderData.service = currentServiceData.name;
    orderData.boatLength = boatLength;
    orderData.serviceDetails = {
        baseRate: currentServiceData.rate,
        serviceType: currentServiceData.type,
        anodes: anodesToInstall,
        boatType: isPowerboat ? 'powerboat' : 'sailboat',
        hullType: hullType,
        twinEngines: additionalProps > 0,
        paintCondition: estimatedPaintConditionBaseLabel,
        growthLevel: estimatedGrowthLevelBaseLabel
    };
    
    // If we're on the charge customer page, update the charge summary
    if (typeof updateChargeSummary === 'function') {
        updateChargeSummary();
    }
    
    // Add checkout button only if we're on the results page (step 8) and it's not already present
    if (currentStep === 8 && !document.getElementById('checkout-button')) {
        const checkoutButton = document.createElement('button');
        checkoutButton.id = 'checkout-button';
        checkoutButton.className = 'submit-button';
        checkoutButton.textContent = 'Proceed to Checkout';
        checkoutButton.style.marginTop = '20px';
        checkoutButton.style.marginBottom = '10px';
        checkoutButton.addEventListener('click', showCheckout);

        // Insert button right before the navigation buttons (which contains Start Over)
        const navButtons = document.querySelector('.navigation-buttons');
        if (navButtons && navButtons.parentNode) {
            navButtons.parentNode.insertBefore(checkoutButton, navButtons);
        } else {
            // Fallback to appending at the end of results
            const resultSection = document.getElementById('step-8');
            resultSection.appendChild(checkoutButton);
        }
    }
}

// Get paint surcharge based on actual condition (for admin page)
function getDirectPaintSurcharge(paintCondition) {
    switch(paintCondition) {
        case paintConditions.EXCELLENT:
        case paintConditions.GOOD:
        case paintConditions.FAIR:
            return 0; // No surcharge for Excellent, Good, or Fair
        case paintConditions.POOR:
            return 0.10; // 10% surcharge for poor paint (average of 5-15%)
        case paintConditions.MISSING:
            return 0.15; // 15% surcharge for missing paint
        default:
            return 0;
    }
}

// Get growth surcharge based on actual condition (for admin page)
function getDirectGrowthSurcharge(growthLevel) {
    // First check if we have a data-surcharge attribute with the exact percentage
    const growthElement = document.getElementById('actualGrowthLevel');
    if (growthElement && growthElement.hasAttribute('data-surcharge')) {
        const percentage = parseFloat(growthElement.getAttribute('data-surcharge'));
        return percentage / 100; // Convert percentage to decimal
    }

    // Fallback to original logic if no data-surcharge attribute
    switch(growthLevel) {
        case estGrowthLabels.MINIMAL:
            return 0; // No surcharge
        case estGrowthLabels.MODERATE:
            return 0; // No surcharge
        case estGrowthLabels.HEAVY:
            return 0.35; // 35% surcharge (average of 25-50%)
        case estGrowthLabels.SEVERE:
            return 2.00; // 200% surcharge
        default:
            return 0;
    }
}

// Calculate cost with direct paint/growth values (for admin page)
function calculateCostDirect() {
    calculateCost(); // Just use regular calculateCost, it will detect the actual dropdowns
}

// Make it available globally
window.calculateCostDirect = calculateCostDirect;
window.getDirectPaintSurcharge = getDirectPaintSurcharge;
window.getDirectGrowthSurcharge = getDirectGrowthSurcharge;

// Helper function to determine paint condition
function getPaintCondition(lastPaintedValue) {
    switch (lastPaintedValue) {
        case '0-6_months':
            return paintConditions.EXCELLENT;
        case '7-12_months':
            return paintConditions.GOOD;
        case '13-21_months':
            return paintConditions.FAIR;
        case '22-24_months':
        case 'over_24_months':
        case 'unsure_paint': // Unsure paint defaults to POOR
            return paintConditions.POOR;
        default:
            return paintConditions.POOR; // Default fallback
    }
}

// Helper function to determine growth level based on paint condition and last cleaned time
function getGrowthLevel(paintCondition, lastCleanedValue) {
    switch (paintCondition) {
        case paintConditions.EXCELLENT:
            if (lastCleanedValue === '0-2_months') return estGrowthLabels.MINIMAL;
            if (lastCleanedValue === '3-4_months') return estGrowthLabels.MODERATE;
            if (lastCleanedValue === '5-6_months' || lastCleanedValue === '7-8_months') return estGrowthLabels.HEAVY;
            if (lastCleanedValue === '9-12_months' || lastCleanedValue === '13-24_months' || lastCleanedValue === 'over_24_months_unsure') return estGrowthLabels.SEVERE;
            break;
        case paintConditions.GOOD:
            if (lastCleanedValue === '0-2_months') return estGrowthLabels.MINIMAL; 
            if (lastCleanedValue === '3-4_months') return estGrowthLabels.MODERATE; 
            if (lastCleanedValue === '5-6_months' || lastCleanedValue === '7-8_months') return estGrowthLabels.HEAVY;
            if (lastCleanedValue === '9-12_months' || lastCleanedValue === '13-24_months' || lastCleanedValue === 'over_24_months_unsure') return estGrowthLabels.SEVERE;
            break;
        case paintConditions.FAIR:
            if (lastCleanedValue === '0-2_months') return estGrowthLabels.MODERATE;
            if (lastCleanedValue === '3-4_months' || lastCleanedValue === '5-6_months') return estGrowthLabels.HEAVY;
            if (lastCleanedValue === '7-8_months' || lastCleanedValue === '9-12_months' || lastCleanedValue === '13-24_months' || lastCleanedValue === 'over_24_months_unsure') return estGrowthLabels.SEVERE;
            break;
        case paintConditions.POOR: 
            if (lastCleanedValue === '0-2_months' || lastCleanedValue === '3-4_months') return estGrowthLabels.HEAVY;
            if (lastCleanedValue === '5-6_months' || lastCleanedValue === '7-8_months' || lastCleanedValue === '9-12_months' || lastCleanedValue === '13-24_months' || lastCleanedValue === 'over_24_months_unsure') return estGrowthLabels.SEVERE;
            break;
    }
    return estGrowthLabels.SEVERE; // Default fallback
}

// New helper function to get specific paint surcharge percentage
function getSpecificPaintSurchargePercent(paintConditionLabel, lastPaintedValue) {
    if (paintConditionLabel !== paintConditions.POOR) {
        return 0; // No surcharge for Excellent, Good, or Fair paint
    }

    // Only apply surcharge if condition is POOR
    switch (lastPaintedValue) {
        case '22-24_months':
            return 0.05; // 5% for "Poor (Low)"
        case 'over_24_months':
        case 'unsure_paint':
            return 0.15; // 15% for "Poor (High/Missing)"
        default:
            // This case should ideally not be reached if lastPaintedValue leading to POOR is one of the above
            return 0; // Default to 0 if POOR but not matching specific lastPaintedValue cases
    }
}

// New helper function to get specific growth surcharge percentage
function getSpecificGrowthSurchargePercent(paintCondition, lastCleanedValue) {
    switch (paintCondition) {
        case paintConditions.EXCELLENT:
            if (lastCleanedValue === '0-2_months') return 0; // Minimal
            if (lastCleanedValue === '3-4_months') return 0; // Moderate
            if (lastCleanedValue === '5-6_months') return 0.25; // Heavy (early)
            if (lastCleanedValue === '7-8_months') return 0.40; // Heavy (late)
            if (lastCleanedValue === '9-12_months') return 0.70; // Severe (early)
            if (lastCleanedValue === '13-24_months') return 0.85; // Severe (mid)
            if (lastCleanedValue === 'over_24_months_unsure') return 1.00; // Severe (max for excellent paint)
            break;
        case paintConditions.GOOD:
            if (lastCleanedValue === '0-2_months') return 0; // Minimal
            if (lastCleanedValue === '3-4_months') return 0; // Moderate
            if (lastCleanedValue === '5-6_months') return 0.25; // Heavy (early)
            if (lastCleanedValue === '7-8_months') return 0.40; // Heavy (late)
            if (lastCleanedValue === '9-12_months') return 0.75; // Severe (early-mid)
            if (lastCleanedValue === '13-24_months') return 0.90; // Severe (mid-high)
            if (lastCleanedValue === 'over_24_months_unsure') return 1.00; // Severe (100%)
            break;
        case paintConditions.FAIR:
            if (lastCleanedValue === '0-2_months') return 0; // Moderate
            if (lastCleanedValue === '3-4_months') return 0.25; // Heavy (early)
            if (lastCleanedValue === '5-6_months') return 0.40; // Heavy (late)
            if (lastCleanedValue === '7-8_months') return 0.70; // Severe (early)
            if (lastCleanedValue === '9-12_months') return 0.85; // Severe (mid-low)
            if (lastCleanedValue === '13-24_months') return 0.95; // Severe (95%)
            if (lastCleanedValue === 'over_24_months_unsure') return 1.00; // Severe (max for fair paint)
            break;
        case paintConditions.POOR: // Also covers "Missing Paint" implicitly
            if (lastCleanedValue === '0-2_months') return 0.30; // Heavy (early, poor paint)
            if (lastCleanedValue === '3-4_months') return 0.50; // Heavy (late, poor paint)
            if (lastCleanedValue === '5-6_months') return 0.80; // Severe (early, poor paint)
            if (lastCleanedValue === '7-8_months') return 0.90; // Severe (mid, poor paint)
            if (lastCleanedValue === '9-12_months') return 0.95; // Severe (late, poor paint)
            if (lastCleanedValue === '13-24_months') return 1.00; // Severe (max, poor paint)
            if (lastCleanedValue === 'over_24_months_unsure') return 1.00; // Severe (max, poor paint / unsure)
            break;
    }
    return 1.00; // Default fallback to highest surcharge if combo not matched
}

// Initialize Stripe
function initializeStripe() {
    // Stripe publishable key for Sailor Skills
    stripe = Stripe('pk_live_pri1IepedMvGQmLCFrV4kVzF');
    elements = stripe.elements();
    
    // Create card element
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
    
    cardElement = elements.create('card', { style: style });
    cardElement.mount('#card-element');
    
    // Handle errors
    cardElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
        validateCheckoutForm();
    });
}

// Setup checkout event listeners
function setupCheckoutListeners() {
    // Service interval selection
    const intervalOptions = document.querySelectorAll('.interval-option');
    intervalOptions.forEach(option => {
        option.addEventListener('click', function() {
            intervalOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            selectedServiceInterval = this.getAttribute('data-interval');
            validateCheckoutForm();
        });
    });
    
    // Form validation on input
    const checkoutInputs = document.querySelectorAll('#checkout-section input[required], #checkout-section select[required]');
    checkoutInputs.forEach(input => {
        input.addEventListener('input', validateCheckoutForm);
        input.addEventListener('change', validateCheckoutForm);
    });
    
    // Agreement checkbox
    const agreementCheckbox = document.getElementById('service-agreement');
    if (agreementCheckbox) {
        agreementCheckbox.addEventListener('change', validateCheckoutForm);
    }
    
    // Submit button
    const submitButton = document.getElementById('submit-order');
    if (submitButton) {
        submitButton.addEventListener('click', handleOrderSubmission);
    }
    
    // Back to calculator button
    const backToCalcButton = document.getElementById('back-to-calculator');
    if (backToCalcButton) {
        backToCalcButton.addEventListener('click', function() {
            checkoutSection.style.display = 'none';
            stepElements[stepElements.length - 1].style.display = 'block'; // Show results
            document.querySelector('.navigation-buttons').style.display = 'flex';
            document.querySelector('.service-info-section').style.display = 'block';
        });
    }
}

// Validate checkout form
function validateCheckoutForm() {
    const submitButton = document.getElementById('submit-order');
    const requiredInputs = document.querySelectorAll('#checkout-section input[required]:not([type="checkbox"]), #checkout-section select[required]');
    const agreementCheckbox = document.getElementById('service-agreement');

    let allFieldsFilled = true;
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            allFieldsFilled = false;
        }
    });

    // For item recovery, interval is not required (it's always one-time)
    const isItemRecovery = selectedServiceKey === 'item_recovery';
    const intervalSelected = isItemRecovery ? true : (selectedServiceInterval !== null);
    const agreementChecked = agreementCheckbox.checked;
    const cardComplete = cardElement && cardElement._complete;

    if (allFieldsFilled && intervalSelected && agreementChecked && cardComplete) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
}

// Supabase configuration
const SUPABASE_URL = 'https://fzygakldvvzxmahkdylq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eWdha2xkdnZ6eG1haGtkeWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODM4OTgsImV4cCI6MjA2OTY1OTg5OH0.8BNDF5zmpk2HFdprTjsdOWTDh_XkAPdTnGo7omtiVIk';
const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Handle order submission
async function handleOrderSubmission() {
    const submitButton = document.getElementById('submit-order');
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';

    try {
        // Collect form data based on service type
        let formData = {
            serviceInterval: selectedServiceInterval,
            customerName: document.getElementById('customer-name').value,
            customerEmail: document.getElementById('customer-email').value,
            customerPhone: document.getElementById('customer-phone').value,
            billingAddress: document.getElementById('billing-address').value,
            billingCity: document.getElementById('billing-city').value,
            billingState: document.getElementById('billing-state').value,
            billingZip: document.getElementById('billing-zip').value,
            customerNotes: document.getElementById('customer-notes')?.value || '',
            estimate: orderData.estimate,
            service: orderData.service,
            serviceDetails: orderData.serviceDetails
        };

        // Add item recovery specific fields
        if (selectedServiceKey === 'item_recovery') {
            formData.recoveryLocation = document.getElementById('recovery-location').value;
            formData.itemDescription = document.getElementById('item-description').value;
            formData.dropDate = document.getElementById('drop-date').value;
            // For item recovery, use location as the "marina" info
            formData.marinaName = 'See recovery location';
            formData.boatName = 'N/A - Item Recovery';
            formData.boatLength = '0';
            formData.boatMake = 'N/A';
            formData.boatModel = 'N/A';
            formData.dock = 'N/A';
            formData.slipNumber = 'N/A';
        } else {
            // Add boat-specific fields for other services
            formData.boatName = document.getElementById('boat-name')?.value || '';
            formData.boatLength = document.getElementById('boat-length-checkout')?.value || '';
            formData.boatMake = document.getElementById('boat-make')?.value || '';
            formData.boatModel = document.getElementById('boat-model')?.value || '';
            formData.marinaName = document.getElementById('marina-name')?.value || '';
            formData.dock = document.getElementById('dock')?.value || '';
            formData.slipNumber = document.getElementById('slip-number')?.value || '';

            // Add anode details if it's anodes_only service
            if (selectedServiceKey === 'anodes_only') {
                formData.anodeDetails = document.getElementById('anode-details')?.value || '';
            }
        }

        console.log('Submitting order with data:', formData);

        // Call Supabase Edge Function to create payment intent
        const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ formData })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const { clientSecret, intentType, orderId, orderNumber } = await response.json();

        // Handle based on intent type
        let error;
        if (intentType === 'setup') {
            // For recurring: Save payment method without charging
            const result = await stripe.confirmCardSetup(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
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
                    }
                }
            });
            error = result.error;
        } else {
            // For one-time: Charge immediately
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
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
                    }
                }
            });
            error = result.error;
        }

        if (error) {
            throw error;
        }

        // Success! Show confirmation
        showOrderConfirmation(orderNumber);
        
    } catch (error) {
        console.error('Order submission error:', error);

        // Show more detailed error message
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
        submitButton.disabled = false;
        submitButton.textContent = 'Complete Order';
    }
}

// Show order confirmation
function showOrderConfirmation(orderNumber) {
    const checkoutSection = document.getElementById('checkout-section');
    const isRecurring = selectedServiceInterval !== 'one-time';
    
    const paymentMessage = isRecurring 
        ? `<p style="margin: 20px 0; color: #345475;"><strong>Payment Method Saved!</strong><br>
           Your card is securely saved and will be charged after each service completion.</p>`
        : `<p style="margin: 20px 0; color: #345475;"><strong>Payment Processed!</strong><br>
           Your card has been charged for this one-time service.</p>`;
    
    checkoutSection.innerHTML = `
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
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Show checkout section
function showCheckout() {
    // Hide calculator, show checkout
    stepElements.forEach(el => el.style.display = 'none');
    document.querySelector('.navigation-buttons').style.display = 'none';
    document.querySelector('.service-info-section').style.display = 'none';
    checkoutSection.style.display = 'block';
    
    // Show/hide appropriate form sections based on service type
    const boatInfoSection = document.getElementById('boat-info-section');
    const itemRecoverySection = document.getElementById('item-recovery-section');
    const anodeDetailsSection = document.getElementById('anode-details-section');
    const intervalSection = document.getElementById('service-interval-section');
    const oneTimeOption = document.querySelector('[data-interval="one-time"]');

    // Handle form sections based on service type
    if (selectedServiceKey === 'item_recovery') {
        // For item recovery, show special location form
        if (boatInfoSection) boatInfoSection.style.display = 'none';
        if (itemRecoverySection) itemRecoverySection.style.display = 'block';
        if (anodeDetailsSection) anodeDetailsSection.style.display = 'none';

        // Hide interval section and set to one-time
        intervalSection.style.display = 'none';
        orderData.interval = 'one-time';
        selectedServiceInterval = 'one-time'; // Set this for validation to work

        // Update required fields
        toggleRequiredFields(false, true);
    } else {
        // For all other services, show boat info
        if (boatInfoSection) boatInfoSection.style.display = 'block';
        if (itemRecoverySection) itemRecoverySection.style.display = 'none';

        // Show anode details section only for anodes_only service
        if (anodeDetailsSection) {
            anodeDetailsSection.style.display = (selectedServiceKey === 'anodes_only') ? 'block' : 'none';
        }
        
        // Update required fields
        toggleRequiredFields(true, false);
        
        // Handle interval section for other services
        if (selectedServiceKey === 'recurring_cleaning') {
            intervalSection.style.display = 'block';
            // Hide the one-time option for recurring service
            if (oneTimeOption) {
                oneTimeOption.style.display = 'none';
            }
            // If one-time was previously selected, select bi-monthly (recommended) instead
            if (orderData.interval === 'one-time' || !orderData.interval) {
                const biMonthlyOption = document.querySelector('[data-interval="2"]');
                if (biMonthlyOption) {
                    document.querySelectorAll('.interval-option').forEach(opt => opt.classList.remove('selected'));
                    biMonthlyOption.classList.add('selected');
                    orderData.interval = '2';
                }
            }
        } else {
            intervalSection.style.display = 'none';
            // Show the one-time option for non-recurring services
            if (oneTimeOption) {
                oneTimeOption.style.display = 'flex';
            }
            // For non-recurring services, automatically select "one-time"
            if (oneTimeOption) {
                document.querySelectorAll('.interval-option').forEach(opt => opt.classList.remove('selected'));
                oneTimeOption.classList.add('selected');
                orderData.interval = 'one-time';
            }
        }
        
        // Pre-fill boat length (only for non-item-recovery services)
        const boatLengthCheckout = document.getElementById('boat-length-checkout');
        if (orderData.boatLength > 0 && boatLengthCheckout) {
            boatLengthCheckout.value = orderData.boatLength;
        }
    }
    
    // Scroll to focus on checkout form, past the header
    setTimeout(() => {
        const checkoutSection = document.getElementById('checkout-section');
        if (checkoutSection) {
            // Get the position of the checkout section
            const rect = checkoutSection.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetPosition = rect.top + scrollTop - 30; // 30px padding from top
            
            // Scroll to position
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }, 100);
}

// Toggle required fields based on service type
function toggleRequiredFields(boatFields, itemRecoveryFields) {
    // Boat info fields
    const boatFieldIds = ['boat-name', 'boat-make', 'boat-model', 'marina-name', 'dock', 'slip-number'];
    boatFieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.required = boatFields;
        }
    });
    
    // Item recovery fields
    const itemFieldIds = ['recovery-location', 'item-description', 'drop-date'];
    itemFieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.required = itemRecoveryFields;
        }
    });
}

// Update paint surcharge display when dropdown changes
function updatePaintSurchargeDisplay() {
    const lastPaintedValue = document.getElementById('lastPaintedTime')?.value;
    const paintExplainerEl = document.getElementById('paintExplainerText');
    
    if (!lastPaintedValue || !paintExplainerEl) return;
    
    // Get paint condition based on time since last painting
    const estimatedPaintCondition = getPaintCondition(lastPaintedValue);
    const paintSurchargePercent = getSpecificPaintSurchargePercent(estimatedPaintCondition, lastPaintedValue);
    
    // Build the explainer message
    paintExplainerEl.innerHTML = `Est. Paint Condition: <strong>${estimatedPaintCondition}</strong>. Potential surcharge: <strong>+${(paintSurchargePercent * 100).toFixed(1)}%</strong>.`;
}

// Update growth surcharge display when dropdown changes
function updateGrowthSurchargeDisplay() {
    const lastCleanedValue = document.getElementById('lastCleanedTime')?.value;
    const growthExplainerEl = document.getElementById('growthExplainerText');
    
    if (!lastCleanedValue || !growthExplainerEl) return;
    
    // Get the estimated paint condition from the paint dropdown if available
    const lastPaintedValue = document.getElementById('lastPaintedTime')?.value;
    const estimatedPaintCondition = lastPaintedValue ? getPaintCondition(lastPaintedValue) : "Good";
    
    // Get growth level based on time since last cleaning
    const estimatedGrowthLevel = getGrowthLevel(estimatedPaintCondition, lastCleanedValue);
    
    // Build the explainer message
    let growthExplainerMsg = `Est. Growth Level: <strong>${estimatedGrowthLevel}</strong>. `;
    
    // Add surcharge percentage based on growth level
    if (estimatedGrowthLevel === "Minimal" || estimatedGrowthLevel === "Moderate") {
        growthExplainerMsg += `Potential surcharge: <strong>0%</strong>.`;
    } else if (estimatedGrowthLevel === "Heavy") {
        growthExplainerMsg += `Potential surcharge: <strong>+25-50%</strong>.`;
    } else if (estimatedGrowthLevel === "Severe") {
        growthExplainerMsg += `Potential surcharge: <strong>+200%</strong>.`;
    }
    
    growthExplainerEl.innerHTML = growthExplainerMsg;
}

// Export functions for use in admin.html
window.populateServiceButtons = populateServiceButtons;
window.calculateCost = calculateCost;
window.selectService = selectService;
window.serviceData = serviceData;
// Expose selectedServiceKey as a getter so it's always current
Object.defineProperty(window, 'selectedServiceKey', {
    get: function() { return selectedServiceKey; },
    set: function(value) { selectedServiceKey = value; }
});
