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
        rate: 150, 
        name: "Item Recovery", 
        type: 'flat',
        description: "Professional recovery of dropped items like phones, keys, tools, or dinghies. Quick response to minimize water damage."
    },
    underwater_inspection: { 
        rate: 150, 
        name: "Underwater Inspection", 
        type: 'flat',
        description: "Thorough underwater inspection with detailed photo/video documentation. Ideal for insurance claims, pre-purchase surveys, or damage assessment."
    }
};
const minimumCharge = 100;

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
    POOR: "Poor" // Added Poor condition
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
    
    nextButton.addEventListener('click', handleNextClick);
    backButton.addEventListener('click', handleBackClick);
    
    // Initialize Stripe
    initializeStripe();
    
    // Setup checkout event listeners
    setupCheckoutListeners();

    renderCurrentStep(); // Initial render
});

function populateServiceButtons() {
    // Clear existing buttons if any
    serviceButtons.innerHTML = '';
    
    // Define the order to display services
    const serviceOrder = ['onetime_cleaning', 'recurring_cleaning', 'item_recovery', 'underwater_inspection'];
    
    for (const key of serviceOrder) {
        const service = serviceData[key];
        const button = document.createElement('div');
        button.className = 'service-option';
        // Add special class for cleaning services
        if (key === 'recurring_cleaning' || key === 'onetime_cleaning') {
            button.className += ' cleaning-service';
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
            selectService(key);
        });
        
        serviceButtons.appendChild(button);
    }
}

function selectService(serviceKey) {
    // Remove selected class from all buttons
    document.querySelectorAll('.service-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selected class to clicked button
    const selectedButton = document.querySelector(`[data-service-key="${serviceKey}"]`);
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }
    
    // Update selected service
    selectedServiceKey = serviceKey;
    
    // Update service price explainer
    updateServicePriceExplainer();
}

function updateServicePriceExplainer() {
    if (selectedServiceKey && serviceData[selectedServiceKey]) {
        const service = serviceData[selectedServiceKey];
        servicePriceExplainer.textContent = service.description || "Select a service to see its description.";
    } else {
        servicePriceExplainer.textContent = "Select a service to see its description.";
    }
    renderCurrentStep(); // Add this call to update button states
}

function renderCurrentStep() {
    // console.log('renderCurrentStep - currentStep:', currentStep);
    // console.log('renderCurrentStep - stepElements.length:', stepElements.length);
    
    stepElements.forEach((stepEl, index) => {
        if (!stepEl) {
            console.error(`Step element at index ${index} is null!`);
            return;
        }
        stepEl.style.display = (index === currentStep) ? 'block' : 'none';
    });

    // Button visibility and text
    backButton.style.display = (currentStep === 0) ? 'none' : 'inline-block';
    
    const totalSteps = stepElements.length;
    const perFootServiceSteps = [1, 2, 3, 4, 5, 6]; // Indices of per-foot only steps
    const isPerFootService = selectedServiceKey && serviceData[selectedServiceKey] && serviceData[selectedServiceKey].type === 'per_foot';

    if (currentStep === totalSteps - 1) { // Last step (Results)
        nextButton.textContent = 'Start Over';
    } else if (currentStep === 0) {
        if (isPerFootService) {
            nextButton.textContent = 'Next (Boat Length)';
        } else if (selectedServiceKey) { // Flat rate service selected
            nextButton.textContent = 'Next (Anodes)';
        } else {
            nextButton.textContent = 'Next'; // Default if no service selected yet
        }
    } else if (isPerFootService) {
        if (currentStep === 1) nextButton.textContent = 'Next (Boat Type)';
        else if (currentStep === 2) nextButton.textContent = 'Next (Hull Type)';
        else if (currentStep === 3) nextButton.textContent = 'Next (Engine Config)';
        else if (currentStep === 4) nextButton.textContent = 'Next (Paint Age)';
        else if (currentStep === 5) nextButton.textContent = 'Next (Last Cleaned)';
        else if (currentStep === 6) nextButton.textContent = 'Next (Anodes)';
        else if (currentStep === 7) nextButton.textContent = 'View Estimate';
        else nextButton.textContent = 'Next'; // Should not happen in per-foot flow
    } else { // Flat rate service, and currentStep > 0
        if (currentStep === 7) { // Anodes step for flat rate (equivalent of old step-2)
            nextButton.textContent = 'View Estimate';
        } else {
             nextButton.textContent = 'Next'; // Should ideally not be reached if skipping correctly
        }
    }
    
    // Disable Next if no service is selected on the first step
    if (currentStep === 0 && (!selectedServiceKey || selectedServiceKey === "")) {
        nextButton.disabled = true;
         nextButton.textContent = 'Next'; // Reset text if it was 'View Estimate'
    } else {
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

    // Skip per-foot steps if service is flat rate, ONLY when starting from step 0
    if (serviceType === 'flat' && numericCurrentStep === 0) {
        nextStep = 7; // Skip directly to Anodes (Step 7)
        // console.log('handleNextClick - Flat rate service, skipping to step 7. nextStep:', nextStep);
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

    // If current service is flat rate and we are on Anodes (step 7), going back should skip to Service Selection (step 0)
    if (serviceType === 'flat' && currentStep === 7) {
        prevStep = 0;
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
    costBreakdownEl.innerText = "";
    totalCostDisplayEl.innerText = "$0.00";
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
    // console.log('calculateCost - starting');
    if (!selectedServiceKey) {
        costBreakdownEl.innerText = "Please select a service first.";
        totalCostDisplayEl.innerText = "$0.00";
        return;
    }
    const currentServiceData = serviceData[selectedServiceKey];
    
    let boatLength = 0;
    let isPowerboat = false;
    let additionalHulls = 0;
    let additionalProps = 0;
    
    let paintSurchargePercent = 0;
    let estimatedPaintConditionBaseLabel = ""; 
    let growthSurchargePercent = 0;
    let estimatedGrowthLevelBaseLabel = ""; 
    
    costBreakdownEl.innerHTML = ""; // Clear previous results
    totalCostDisplayEl.innerText = "$0.00"; 

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
        growthExplainerMsg += `Potential surcharge: <strong>+50-100%</strong>.`;
    }

    if (growthExplainerEl) {
        growthExplainerEl.innerHTML = growthExplainerMsg;
    }
    }

    // --- Main Calculation Logic ---
    let hullType = 'monohull'; // Default
    if (currentServiceData.type === 'per_foot') {
        boatLength = parseFloat(document.getElementById('boatLength').value) || 0;
        if (boatLength <= 0) {
            costBreakdownEl.innerText = "Error: Boat length is invalid for a per-foot service. Please go back and enter a valid length.";
            totalCostDisplayEl.innerText = "$0.00";
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
        baseServiceCost = initialBaseCost; // Start with the calculated cost
        let appliedBaseMinimumNote = "";

        if (baseServiceCost < minimumCharge && baseServiceCost > 0) {
            baseServiceCost = minimumCharge;
            appliedBaseMinimumNote = ` (adjusted to $${minimumCharge.toFixed(2)} minimum base rate)`;
        }
        breakdown += `- Base (${currentServiceData.rate.toFixed(2)}/ft * ${boatLength}ft): $${initialBaseCost.toFixed(2)}${appliedBaseMinimumNote}\n`;
        if (appliedBaseMinimumNote) { // If note was added, show the actual base used for surcharges if different from initial calc + note
            if (initialBaseCost.toFixed(2) !== baseServiceCost.toFixed(2)) { // Check if initial and adjusted are different to avoid redundancy
                 breakdown += `  (Surcharges will be based on $${baseServiceCost.toFixed(2)})\n`;
            }
        }

        let variableSurchargeTotal = 0;
        let variableDetails = "";

        if (isPowerboat) {
            let surcharge = baseServiceCost * 0.25;
            variableSurchargeTotal += surcharge;
            variableDetails += `  - Powerboat Surcharge (+25%): $${surcharge.toFixed(2)}\n`;
        }
        if (additionalHulls > 0) {
            let surchargeFactor = additionalHulls === 1 ? 0.25 : 0.50;
            let surcharge = baseServiceCost * surchargeFactor;
            variableSurchargeTotal += surcharge;
            variableDetails += `  - ${additionalHulls === 1 ? 'Catamaran' : 'Trimaran'} Surcharge (+${surchargeFactor * 100}%): $${surcharge.toFixed(2)}\n`;
        }
        if (additionalProps > 0) {
            let surcharge = baseServiceCost * 0.10;
            variableSurchargeTotal += surcharge;
            variableDetails += `  - Twin Engine Surcharge (+10%): $${surcharge.toFixed(2)}\n`;
        }
        
        let actualPaintSurchargeAmount = baseServiceCost * paintSurchargePercent;
        variableSurchargeTotal += actualPaintSurchargeAmount;
        variableDetails += `  - Est. Paint (${estimatedPaintConditionBaseLabel}): +${(paintSurchargePercent * 100).toFixed(2)}% ($${actualPaintSurchargeAmount.toFixed(2)})\n`;
        
        let actualGrowthSurchargeAmount = baseServiceCost * growthSurchargePercent;
        variableSurchargeTotal += actualGrowthSurchargeAmount;
        variableDetails += `  - Est. Growth (${estimatedGrowthLevelBaseLabel}): +${(growthSurchargePercent * 100).toFixed(0)}% ($${actualGrowthSurchargeAmount.toFixed(2)})\n`;
        
        calculatedSubtotal = baseServiceCost + variableSurchargeTotal;
        if (variableDetails) {
            breakdown += "Variable Surcharges Applied (Estimates):\n" + variableDetails; // variableDetails already has \n for its items
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
        // Apply rounding before showing in breakdown
        if (totalBeforeMinimum > 0 && totalBeforeMinimum >= minimumCharge) {
            finalCost = Math.round(totalBeforeMinimum / 10) * 10;
        } else if (totalBeforeMinimum < minimumCharge && totalBeforeMinimum > 0) {
            finalCost = minimumCharge;
        }
        
        breakdown += `\nTotal Estimate: $${finalCost.toFixed(2)}\n`; // Show rounded/minimum amount
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

    if (finalCost % 1 === 0) {
        totalCostDisplayEl.innerText = `$${finalCost}`;
    } else {
        totalCostDisplayEl.innerText = `$${finalCost.toFixed(2)}`;
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
    
    // Add checkout button if not already present
    if (!document.getElementById('checkout-button')) {
        const checkoutButton = document.createElement('button');
        checkoutButton.id = 'checkout-button';
        checkoutButton.className = 'submit-button';
        checkoutButton.textContent = 'Proceed to Checkout';
        checkoutButton.style.marginTop = '20px';
        checkoutButton.addEventListener('click', showCheckout);
        
        const resultSection = document.getElementById('step-8');
        resultSection.appendChild(checkoutButton);
    }
}

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
            if (lastCleanedValue === '9-12_months') return 0.50; // Severe (early)
            if (lastCleanedValue === '13-24_months') return 0.60; // Severe (mid)
            if (lastCleanedValue === 'over_24_months_unsure') return 0.70; // Severe (high but capped for excellent paint)
            break;
        case paintConditions.GOOD:
            if (lastCleanedValue === '0-2_months') return 0; // Minimal
            if (lastCleanedValue === '3-4_months') return 0; // Moderate
            if (lastCleanedValue === '5-6_months') return 0.25; // Heavy (early)
            if (lastCleanedValue === '7-8_months') return 0.40; // Heavy (late)
            if (lastCleanedValue === '9-12_months') return 0.55; // Severe (early-mid)
            if (lastCleanedValue === '13-24_months') return 0.65; // Severe (mid-high)
            if (lastCleanedValue === 'over_24_months_unsure') return 0.75; // Severe (high but capped for good paint)
            break;
        case paintConditions.FAIR:
            if (lastCleanedValue === '0-2_months') return 0; // Moderate
            if (lastCleanedValue === '3-4_months') return 0.25; // Heavy (early)
            if (lastCleanedValue === '5-6_months') return 0.40; // Heavy (late)
            if (lastCleanedValue === '7-8_months') return 0.50; // Severe (early)
            if (lastCleanedValue === '9-12_months') return 0.65; // Severe (mid-low)
            if (lastCleanedValue === '13-24_months') return 0.75; // Severe (mid-high)
            if (lastCleanedValue === 'over_24_months_unsure') return 0.85; // Severe (high, capped for fair paint)
            break;
        case paintConditions.POOR: // Also covers "Missing Paint" implicitly
            if (lastCleanedValue === '0-2_months') return 0.30; // Heavy (early, poor paint)
            if (lastCleanedValue === '3-4_months') return 0.50; // Heavy (late, poor paint)
            if (lastCleanedValue === '5-6_months') return 0.60; // Severe (early, poor paint)
            if (lastCleanedValue === '7-8_months') return 0.80; // Severe (mid, poor paint)
            if (lastCleanedValue === '9-12_months') return 0.90; // Severe (late, poor paint)
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
    agreementCheckbox.addEventListener('change', validateCheckoutForm);
    
    // Submit button
    const submitButton = document.getElementById('submit-order');
    submitButton.addEventListener('click', handleOrderSubmission);
    
    // Back to calculator button
    const backToCalcButton = document.getElementById('back-to-calculator');
    backToCalcButton.addEventListener('click', function() {
        checkoutSection.style.display = 'none';
        stepElements[stepElements.length - 1].style.display = 'block'; // Show results
        document.querySelector('.navigation-buttons').style.display = 'flex';
        document.querySelector('.service-info-section').style.display = 'block';
    });
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
    
    const intervalSelected = selectedServiceInterval !== null;
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
    
    // Collect form data
    const formData = {
        boatName: document.getElementById('boat-name').value,
        boatLength: document.getElementById('boat-length-checkout').value,
        boatMake: document.getElementById('boat-make').value,
        boatModel: document.getElementById('boat-model').value,
        marinaName: document.getElementById('marina-name').value,
        dock: document.getElementById('dock').value,
        slipNumber: document.getElementById('slip-number').value,
        serviceInterval: selectedServiceInterval,
        customerName: document.getElementById('customer-name').value,
        customerEmail: document.getElementById('customer-email').value,
        customerPhone: document.getElementById('customer-phone').value,
        billingAddress: document.getElementById('billing-address').value,
        billingCity: document.getElementById('billing-city').value,
        billingState: document.getElementById('billing-state').value,
        billingZip: document.getElementById('billing-zip').value,
        customerBirthday: document.getElementById('customer-birthday').value,
        estimate: orderData.estimate,
        service: orderData.service,
        serviceDetails: orderData.serviceDetails
    };
    
    try {
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
        console.error('Error:', error);
        alert('There was an error processing your order. Please try again.');
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
    
    // Show/hide service interval section based on service type
    const intervalSection = document.getElementById('service-interval-section');
    if (selectedServiceKey === 'recurring_cleaning') {
        intervalSection.style.display = 'block';
    } else {
        intervalSection.style.display = 'none';
        // For non-recurring services, automatically select "one-time"
        const oneTimeOption = document.querySelector('[data-interval="one-time"]');
        if (oneTimeOption) {
            document.querySelectorAll('.interval-option').forEach(opt => opt.classList.remove('selected'));
            oneTimeOption.classList.add('selected');
            orderData.interval = 'one-time';
        }
    }
    
    // Pre-fill boat length
    const boatLengthCheckout = document.getElementById('boat-length-checkout');
    if (orderData.boatLength > 0) {
        boatLengthCheckout.value = orderData.boatLength;
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
} 