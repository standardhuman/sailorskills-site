// Wizard functionality for admin page
// Handles service selection wizard and multi-step forms

// Global wizard state
window.wizardCurrentStep = 0;
window.wizardSteps = [];

// Service data for pricing calculations
window.serviceData = {
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

// Paint condition selection for wizard
const selectWizardPaintCondition = function(value) {
    // Remove selected class from all paint condition buttons
    document.querySelectorAll('.option-button[class*="paint-"]').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Add selected class to clicked button
    const selectedButton = document.querySelector(`.option-button.paint-${value}`);
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }

    // Update hidden input
    const paintInput = document.getElementById('wizardPaintCondition');
    if (paintInput) {
        paintInput.value = value;
    }

    // Update any visible buttons in the form
    document.querySelectorAll('.option-button[data-value="' + value + '"]').forEach(btn => {
        if (btn.classList.contains('paint-' + value)) {
            btn.classList.add('selected');
        }
    });

    // Sync with hidden form input
    const paintConditionHidden = document.getElementById('paint_condition');
    if (paintConditionHidden) {
        paintConditionHidden.value = value;
    }

    // Trigger price calculation
    if (window.calculateCost) window.calculateCost();
    if (window.updateChargeSummary) window.updateChargeSummary();
    if (window.updateWizardPricing) window.updateWizardPricing();
};
window.selectWizardPaintCondition = selectWizardPaintCondition;

// Main function to render consolidated service form
const renderConsolidatedForm = function(isCleaningService, serviceKey) {
    console.log('Full renderConsolidatedForm called for', serviceKey);
    const wizardContainer = document.getElementById('wizardContainer');
    const wizardContent = document.getElementById('wizardContent');
    const simpleServiceButtons = document.getElementById('simpleServiceButtons');

    if (!wizardContainer || !wizardContent) {
        console.error('Wizard elements not found');
        return;
    }

    // Show wizard container and hide service buttons
    wizardContainer.style.display = 'block';
    if (simpleServiceButtons) {
        simpleServiceButtons.style.display = 'none';
    }

    const service = window.serviceData ? window.serviceData[serviceKey] : null;
    const serviceName = service ? service.name : 'Service';

    // Determine which fields are needed based on service
    const needsBoatConfig = isCleaningService;
    const needsPaintGrowth = isCleaningService;

    // For other services, just need basic boat info
    const isItemRecovery = serviceKey === 'item_recovery';
    const isUnderwaterInspection = serviceKey === 'underwater_inspection';
    const isPropellerService = serviceKey === 'propeller_service';
    const isAnodesOnly = serviceKey === 'anodes_only';

    // Underwater inspection only needs hull type (for pricing)
    const needsHullTypeOnly = isUnderwaterInspection;

    // Clear any existing content to prevent duplication
    wizardContent.innerHTML = '';

    // Build consolidated form HTML
    let formHTML = '<div class="consolidated-form">';

    // Add header with service name and back button
    formHTML += `
        <div class="form-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #2c3e50;">${serviceName}</h2>
            <button onclick="backToServices()" class="back-btn" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                ← Back to Services
            </button>
        </div>
    `;

    // Check if service needs boat length (per-foot services)
    const needsBoatLength = service && service.type === 'per_foot';

    // Always include boat information section
    formHTML += `
        <div class="form-section">
            <h3>Boat Information</h3>
            <div class="input-group">
                <label for="wizardBoatName">Boat Name</label>
                <input type="text" id="wizardBoatName" placeholder="Enter boat name (optional)"
                       value="${document.getElementById('boatName')?.value || ''}"
                       style="font-size: 18px; padding: 14px; width: 100%; border: 2px solid #ddd; border-radius: 8px;">
            </div>`;

    // Only show boat length for per-foot services
    if (needsBoatLength) {
        formHTML += `
            <div class="input-group">
                <label for="wizardBoatLength">Boat Length (feet) *</label>
                <input type="text" id="wizardBoatLength" placeholder="e.g., 35, 42, 50"
                       value="${document.getElementById('boatLength')?.value || '35'}"
                       style="font-size: 18px; padding: 14px; width: 100%; border: 2px solid #ddd; border-radius: 8px;">
            </div>`;
    }

    formHTML += `
        </div>
    `;

    // Add special hull type section for underwater inspection
    if (needsHullTypeOnly) {
        formHTML += `
            <div class="form-section">
                <h3>Hull Configuration</h3>

                <!-- Hull Type -->
                <div class="input-group">
                    <label>Number of Hulls</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="wizard_hull_type" value="monohull" checked>
                            <span>Monohull</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="wizard_hull_type" value="catamaran">
                            <span>Catamaran (2 hulls)</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="wizard_hull_type" value="trimaran">
                            <span>Trimaran (3 hulls)</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    // Add cleaning-specific fields
    else if (isCleaningService) {
        formHTML += `
            <div class="form-section">
                <h3>Boat Configuration</h3>

                <!-- Boat Type -->
                <div class="input-group">
                    <label>Boat Type</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="wizard_boat_type" value="sailboat" checked>
                            <span>Sailboat</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="wizard_boat_type" value="powerboat">
                            <span>Powerboat (+25% surcharge)</span>
                        </label>
                    </div>
                </div>

                <!-- Hull Type -->
                <div class="input-group">
                    <label>Hull Type</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="wizard_hull_type" value="monohull" checked>
                            <span>Monohull</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="wizard_hull_type" value="catamaran">
                            <span>Catamaran (+25% surcharge)</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="wizard_hull_type" value="trimaran">
                            <span>Trimaran (+25% surcharge)</span>
                        </label>
                    </div>
                </div>

                <!-- Engine Configuration -->
                <div class="input-group">
                    <label>Engine Configuration</label>
                    <div class="checkbox-group">
                        <label class="checkbox-option">
                            <input type="checkbox" id="wizard_twin_engines" name="wizard_twin_engines">
                            <span>Twin engines (+10% surcharge)</span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>Current Condition</h3>

                <!-- Paint Condition -->
                <div class="input-group">
                    <label>Paint Condition</label>
                    <div class="option-button-group" id="wizardPaintConditionButtons">
                        <button type="button" class="option-button paint-excellent" data-value="excellent" onclick="selectWizardPaintCondition('excellent')">Excellent</button>
                        <button type="button" class="option-button paint-good selected" data-value="good" onclick="selectWizardPaintCondition('good')">Good</button>
                        <button type="button" class="option-button paint-fair" data-value="fair" onclick="selectWizardPaintCondition('fair')">Fair</button>
                        <button type="button" class="option-button paint-poor" data-value="poor" onclick="selectWizardPaintCondition('poor')">Poor</button>
                        <button type="button" class="option-button paint-missing" data-value="missing" onclick="selectWizardPaintCondition('missing')">Missing</button>
                    </div>
                    <input type="hidden" id="wizardPaintCondition" value="good">
                </div>

                <!-- Growth Level -->
                <div class="input-group">
                    <label>Growth Level</label>
                    <div class="growth-slider-container">
                        <input type="range" class="growth-slider" id="wizardGrowthLevelSlider" min="0" max="100" value="0" step="5">
                        <div class="growth-slider-labels">
                            <span>Minimal<br>0%</span>
                            <span>Moderate<br>25%</span>
                            <span>Heavy<br>50%</span>
                            <span>Severe<br>200%</span>
                        </div>
                        <div class="growth-slider-value" id="wizardGrowthSliderValue">Minimal (0%)</div>
                    </div>
                    <input type="hidden" id="wizardGrowthLevel" value="minimal">
                </div>
            </div>
        `;
    }

    // Add the "Add Anodes" button after Current Condition
    // For "Anodes Only" service, show different message and auto-open
    if (isAnodesOnly) {
        formHTML += `
            <div class="form-section" style="text-align: center; margin-top: 20px;">
                <button onclick="toggleAnodeSection()" class="customer-btn" style="background-color: #e67e22; font-size: 16px; padding: 12px 24px;">
                    ⚓ Select Anodes
                </button>
                <p style="margin-top: 10px; color: #666; font-size: 14px;">
                    Select zinc anodes for replacement ($150 minimum service fee)
                </p>
            </div>
        `;
    } else {
        formHTML += `
            <div class="form-section" style="text-align: center; margin-top: 20px;">
                <button onclick="toggleAnodeSection()" class="customer-btn" style="background-color: #e67e22; font-size: 16px; padding: 12px 24px;">
                    ⚓ Add Anodes to Service
                </button>
                <p style="margin-top: 10px; color: #666; font-size: 14px;">
                    Optional: Add zinc anode replacement to this service
                </p>
            </div>
        `;
    }

    // Add pricing display section in the wizard
    formHTML += `
        <div class="form-section" id="wizardPricingSection" style="background: #e8f4f8; border: 2px solid #3498db;">
            <h3 style="color: #2980b9;">💰 Price Estimate</h3>
            <div id="wizardCostBreakdown" style="font-size: 16px; line-height: 1.6; color: #34495e;"></div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #3498db;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 20px; font-weight: bold; color: #2c3e50;">Total:</span>
                    <span id="wizardTotalPrice" style="font-size: 24px; font-weight: bold; color: #27ae60;">$0.00</span>
                </div>
            </div>
        </div>
    `;

    formHTML += '</div>';

    // Update content
    wizardContent.innerHTML = formHTML;
    wizardContent.className = 'consolidated-form-container active';

    // Add CSS for form sections if not already added
    if (!document.getElementById('consolidatedFormStyles')) {
        const style = document.createElement('style');
        style.id = 'consolidatedFormStyles';
        style.textContent = `
            .consolidated-form {
                display: flex;
                flex-direction: column;
                gap: 25px;
            }
            .form-section {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 12px;
                border: 1px solid #e0e0e0;
            }
            .form-section h3 {
                margin-top: 0;
                margin-bottom: 20px;
                color: #2c3e50;
                font-size: 20px;
                font-weight: 600;
            }
            .form-section .input-group {
                margin-bottom: 20px;
            }
            .form-section .input-group:last-child {
                margin-bottom: 0;
            }
            .consolidated-form-container {
                padding: 20px 0;
            }
            .radio-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 10px;
            }
            .radio-option {
                display: flex;
                align-items: center;
                padding: 12px;
                background: white;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .radio-option:hover {
                background: #f0f8ff;
                border-color: #3498db;
            }
            .radio-option input[type="radio"] {
                margin-right: 10px;
            }
            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 10px;
            }
            .checkbox-option {
                display: flex;
                align-items: center;
                padding: 12px;
                background: white;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .checkbox-option:hover {
                background: #f0f8ff;
                border-color: #3498db;
            }
            .checkbox-option input[type="checkbox"] {
                margin-right: 10px;
            }
            .growth-slider-container {
                margin-top: 15px;
                padding: 20px;
                background: white;
                border-radius: 8px;
            }
            .growth-slider {
                width: 100%;
                margin: 20px 0;
            }
            .growth-slider-labels {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: #666;
                margin-top: -10px;
            }
            .growth-slider-value {
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                color: #2c3e50;
                margin-top: 15px;
            }
        `;
        document.head.appendChild(style);
    }

    // Setup event listeners and sync values after DOM is ready
    setTimeout(() => {
        syncWizardValues();
        setupGrowthSlider();

        // IMPORTANT: Ensure adminApp has the current service key
        if (window.adminApp && serviceKey) {
            window.adminApp.currentServiceKey = serviceKey;
            console.log('Setting adminApp.currentServiceKey in renderConsolidatedForm to:', serviceKey);
        }

        console.log('Initial calculation on wizard load');
        if (window.calculateCost) {
            window.calculateCost();
            console.log('calculateCost called on wizard initialization');
        }
        if (window.updateWizardPricing) {
            window.updateWizardPricing();
            console.log('updateWizardPricing called on wizard initialization');
        }
    }, 100);
};
window.renderConsolidatedForm = renderConsolidatedForm;

// Setup growth slider
function setupGrowthSlider() {
    const slider = document.getElementById('wizardGrowthLevelSlider');
    const valueDisplay = document.getElementById('wizardGrowthSliderValue');
    const hiddenInput = document.getElementById('wizardGrowthLevel');

    if (!slider) return;

    slider.addEventListener('input', function() {
        const value = parseInt(this.value);
        let level, surcharge;

        if (value <= 25) {
            level = 'minimal';
            surcharge = '0%';
        } else if (value <= 50) {
            level = 'moderate';
            surcharge = '25%';
        } else if (value <= 75) {
            level = 'heavy';
            surcharge = '50%';
        } else {
            level = 'severe';
            surcharge = '200%';
        }

        valueDisplay.textContent = `${level.charAt(0).toUpperCase() + level.slice(1)} (${surcharge})`;
        hiddenInput.value = level;

        // Sync with hidden form input
        const growthLevelHidden = document.getElementById('growth_level');
        if (growthLevelHidden) {
            growthLevelHidden.value = level;
        }

        // Trigger price calculation
        if (window.calculateCost) window.calculateCost();
        if (window.updateChargeSummary) window.updateChargeSummary();
        if (window.updateWizardPricing) window.updateWizardPricing();
    });
}

// Sync wizard values with hidden form inputs
function syncWizardValues() {
    // Sync boat name
    const wizardBoatName = document.getElementById('wizardBoatName');
    if (wizardBoatName) {
        wizardBoatName.addEventListener('input', function() {
            const boatName = document.getElementById('boatName');
            if (boatName) boatName.value = this.value;
        });
    }

    // Sync boat length (only if it exists for per-foot services)
    const wizardBoatLength = document.getElementById('wizardBoatLength');
    if (wizardBoatLength) {
        // Set initial value from hidden input
        const boatLength = document.getElementById('boatLength');
        if (boatLength && boatLength.value) {
            wizardBoatLength.value = boatLength.value;
        }

        wizardBoatLength.addEventListener('input', function() {
            const boatLength = document.getElementById('boatLength');
            if (boatLength) {
                boatLength.value = this.value;
                console.log('Boat length synced to:', this.value);

                // Trigger calculations immediately
                if (window.calculateCost) {
                    window.calculateCost();
                    console.log('calculateCost called after boat length change');
                }
                if (window.updateChargeSummary) {
                    window.updateChargeSummary();
                }
                if (window.updateWizardPricing) {
                    window.updateWizardPricing();
                    console.log('updateWizardPricing called after boat length change');
                }
            }
        });
    } else {
        // For flat rate services, set boat length to 0 or a default
        const boatLength = document.getElementById('boatLength');
        if (boatLength) {
            boatLength.value = '0';
        }
    }

    // Sync boat type
    const wizardBoatTypes = document.querySelectorAll('input[name="wizard_boat_type"]');
    wizardBoatTypes.forEach(radio => {
        radio.addEventListener('change', function() {
            const hiddenBoatType = document.querySelector(`input[name="boat_type"][value="${this.value}"]`);
            if (hiddenBoatType) {
                hiddenBoatType.checked = true;
                if (window.calculateCost) window.calculateCost();
                if (window.updateChargeSummary) window.updateChargeSummary();
                if (window.updateWizardPricing) window.updateWizardPricing();
            }
        });
    });

    // Sync hull type
    const wizardHullTypes = document.querySelectorAll('input[name="wizard_hull_type"]');
    wizardHullTypes.forEach(radio => {
        radio.addEventListener('change', function() {
            const hiddenHullType = document.querySelector(`input[name="hull_type"][value="${this.value}"]`);
            if (hiddenHullType) {
                hiddenHullType.checked = true;
                if (window.calculateCost) window.calculateCost();
                if (window.updateChargeSummary) window.updateChargeSummary();
                if (window.updateWizardPricing) window.updateWizardPricing();
            }
        });
    });

    // Sync twin engines
    const wizardTwinEngines = document.getElementById('wizard_twin_engines');
    if (wizardTwinEngines) {
        wizardTwinEngines.addEventListener('change', function() {
            const hiddenTwinEngines = document.getElementById('has_twin_engines');
            if (hiddenTwinEngines) {
                hiddenTwinEngines.checked = this.checked;
                if (window.calculateCost) window.calculateCost();
                if (window.updateChargeSummary) window.updateChargeSummary();
                if (window.updateWizardPricing) window.updateWizardPricing();
            }
        });
    }

    // Sync paint condition value to hidden input
    const wizardPaintCondition = document.getElementById('wizardPaintCondition');
    if (wizardPaintCondition) {
        // Set initial value
        const paintConditionHidden = document.getElementById('paint_condition');
        if (paintConditionHidden) {
            paintConditionHidden.value = wizardPaintCondition.value;
        }

        // Watch for changes (via MutationObserver since it's updated programmatically)
        const observer = new MutationObserver(function() {
            if (paintConditionHidden) {
                paintConditionHidden.value = wizardPaintCondition.value;
            }
        });
        observer.observe(wizardPaintCondition, { attributes: true, attributeFilter: ['value'] });
    }

    // Sync growth level value to hidden input
    const wizardGrowthLevel = document.getElementById('wizardGrowthLevel');
    if (wizardGrowthLevel) {
        // Set initial value
        const growthLevelHidden = document.getElementById('growth_level');
        if (growthLevelHidden) {
            growthLevelHidden.value = wizardGrowthLevel.value;
        }

        // Watch for changes (via MutationObserver since it's updated programmatically)
        const observer = new MutationObserver(function() {
            if (growthLevelHidden) {
                growthLevelHidden.value = wizardGrowthLevel.value;
            }
        });
        observer.observe(wizardGrowthLevel, { attributes: true, attributeFilter: ['value'] });
    }
}

// Function to go back to service selection
window.backToServices = function() {
    const serviceSelector = document.querySelector('.service-selector');
    const serviceHeading = serviceSelector ? serviceSelector.querySelector('h2') : null;
    const wizardContainer = document.getElementById('wizardContainer');
    const simpleButtons = document.getElementById('simpleServiceButtons');

    // Hide wizard
    wizardContainer.style.display = 'none';
    wizardContainer.innerHTML = '';

    // Show simple service buttons
    if (simpleButtons) {
        simpleButtons.style.display = 'flex';
    }

    // Show heading
    if (serviceHeading) {
        serviceHeading.style.display = 'block';
    }

    // Reset selected service
    window.currentServiceKey = null;
    window.selectedServiceKey = null;
};

// Toggle anode section
window.toggleAnodeSection = function() {
    const anodeSection = document.getElementById('anodeSection');
    if (anodeSection) {
        if (anodeSection.style.display === 'none' || !anodeSection.style.display) {
            anodeSection.style.display = 'block';
            anodeSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            anodeSection.style.display = 'none';
        }
    }
};

// Update wizard pricing display
window.updateWizardPricing = function() {
    console.log('updateWizardPricing called');

    const serviceKey = window.currentServiceKey || window.selectedServiceKey;
    if (!serviceKey) {
        console.log('No service selected');
        return;
    }

    const service = window.serviceData[serviceKey];
    if (!service) {
        console.log('Service not found:', serviceKey);
        return;
    }

    const boatLength = parseFloat(document.getElementById('boatLength')?.value) || 0;
    const isPerFoot = service.type === 'per_foot';

    let basePrice = isPerFoot ? service.rate * boatLength : service.rate;
    let breakdown = [];
    let totalSurcharge = 0;

    if (isPerFoot && boatLength > 0) {
        breakdown.push(`Base rate: $${service.rate}/ft × ${boatLength}ft = $${basePrice.toFixed(2)}`);
    } else if (!isPerFoot) {
        breakdown.push(`Flat rate: $${basePrice.toFixed(2)}`);
    }

    // Calculate surcharges for cleaning services
    if (serviceKey === 'recurring_cleaning' || serviceKey === 'onetime_cleaning') {
        // Boat type surcharge
        const boatType = document.querySelector('input[name="wizard_boat_type"]:checked')?.value ||
                        document.querySelector('input[name="boat_type"]:checked')?.value || 'sailboat';
        if (boatType === 'powerboat') {
            const surcharge = basePrice * 0.25;
            totalSurcharge += surcharge;
            breakdown.push(`Powerboat surcharge (25%): +$${surcharge.toFixed(2)}`);
        }

        // Hull type surcharge
        const hullType = document.querySelector('input[name="wizard_hull_type"]:checked')?.value ||
                        document.querySelector('input[name="hull_type"]:checked')?.value || 'monohull';
        if (hullType === 'catamaran' || hullType === 'trimaran') {
            const surcharge = basePrice * 0.25;
            totalSurcharge += surcharge;
            breakdown.push(`${hullType.charAt(0).toUpperCase() + hullType.slice(1)} surcharge (25%): +$${surcharge.toFixed(2)}`);
        }

        // Twin engines surcharge
        const twinEngines = document.getElementById('wizard_twin_engines')?.checked ||
                           document.getElementById('has_twin_engines')?.checked;
        if (twinEngines) {
            const surcharge = basePrice * 0.10;
            totalSurcharge += surcharge;
            breakdown.push(`Twin engines surcharge (10%): +$${surcharge.toFixed(2)}`);
        }

        // Paint condition surcharge
        const paintCondition = document.getElementById('wizardPaintCondition')?.value ||
                              document.getElementById('paint_condition')?.value || 'good';
        const paintSurcharges = {
            'excellent': 0,
            'good': 0.0375,
            'fair': 0.075,
            'poor': 0.10,
            'missing': 0.15
        };
        const paintSurchargeRate = paintSurcharges[paintCondition] || 0;
        if (paintSurchargeRate > 0) {
            const surcharge = basePrice * paintSurchargeRate;
            totalSurcharge += surcharge;
            breakdown.push(`Paint condition (${paintCondition}) surcharge: +$${surcharge.toFixed(2)}`);
        }

        // Growth level surcharge
        const growthLevel = document.getElementById('wizardGrowthLevel')?.value ||
                           document.getElementById('growth_level')?.value || 'minimal';
        const growthSurcharges = {
            'minimal': 0,
            'moderate': 0.25,
            'heavy': 0.50,
            'severe': 2.00
        };
        const growthSurchargeRate = growthSurcharges[growthLevel] || 0;
        if (growthSurchargeRate > 0) {
            const surcharge = basePrice * growthSurchargeRate;
            totalSurcharge += surcharge;
            breakdown.push(`Growth level (${growthLevel}) surcharge: +$${surcharge.toFixed(2)}`);
        }
    }

    // Calculate total
    const total = basePrice + totalSurcharge;

    // Apply minimum charge
    const minimumCharge = 150;
    const finalTotal = Math.max(total, minimumCharge);

    if (finalTotal === minimumCharge && total < minimumCharge) {
        breakdown.push(`Minimum charge applied: $${minimumCharge}`);
    }

    // Update wizard pricing display
    const wizardCostBreakdown = document.getElementById('wizardCostBreakdown');
    const wizardTotalPrice = document.getElementById('wizardTotalPrice');

    if (wizardCostBreakdown) {
        wizardCostBreakdown.innerHTML = breakdown.join('<br>');
    }

    if (wizardTotalPrice) {
        wizardTotalPrice.textContent = `$${finalTotal.toFixed(2)}`;
    }

    // CRITICAL: Update the hidden totalCost input that charge summary reads from
    const totalCostInput = document.getElementById('totalCost');
    if (totalCostInput) {
        totalCostInput.value = finalTotal.toFixed(2);
        console.log('Updated totalCost hidden input to:', finalTotal.toFixed(2));
    }

    // Also update the totalCostDisplay input
    const totalCostDisplayInput = document.getElementById('totalCostDisplay');
    if (totalCostDisplayInput) {
        totalCostDisplayInput.value = finalTotal.toFixed(2);
    }

    // Trigger charge summary update after setting the price
    if (window.adminApp && typeof window.adminApp.updateChargeSummary === 'function') {
        window.adminApp.updateChargeSummary();
        console.log('Called adminApp.updateChargeSummary after setting price');
    }

    // Also update the main pricing display
    const priceBreakdown = document.getElementById('priceBreakdown');
    if (priceBreakdown) {
        priceBreakdown.innerHTML = `
            <div style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
                ${breakdown.join('<br>')}
                <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #dee2e6;">
                    <strong style="font-size: 18px;">Total: $${finalTotal.toFixed(2)}</strong>
                </div>
            </div>
        `;
    }

    // Update the editable amount input
    const editableAmount = document.getElementById('editableAmount');
    if (editableAmount) {
        editableAmount.value = finalTotal.toFixed(2);
    }

    // Update total cost display for charge summary
    const totalCostDisplay = document.getElementById('totalCostDisplay');
    if (totalCostDisplay) {
        totalCostDisplay.textContent = `$${finalTotal.toFixed(2)}`;
    }

    const totalCost = document.getElementById('totalCost');
    if (totalCost) {
        totalCost.textContent = `$${finalTotal.toFixed(2)}`;
        totalCost.value = finalTotal.toFixed(2);
    }

    // CRITICAL: Ensure adminApp has the current service key
    if (window.adminApp && serviceKey) {
        window.adminApp.currentServiceKey = serviceKey;
        console.log('Setting adminApp.currentServiceKey to:', serviceKey);

        // Trigger charge summary update
        if (typeof window.adminApp.updateChargeSummary === 'function') {
            window.adminApp.updateChargeSummary();
        }
    }

    // Enable charge button
    const chargeButton = document.getElementById('pricingChargeButton');
    if (chargeButton) {
        chargeButton.disabled = false;
    }

    // Also enable the main charge button
    const mainChargeButton = document.getElementById('chargeButton');
    if (mainChargeButton) {
        mainChargeButton.disabled = false;
    }
};

// Growth level display update
const updateGrowthDisplay = function(value) {
    const labels = ['Minimal Growth', 'Moderate Growth', 'Heavy Growth', 'Severe Growth'];
    const display = document.getElementById('growthDisplay');
    if (display) {
        display.textContent = labels[parseInt(value)];
    }
};
window.updateGrowthDisplay = updateGrowthDisplay;

// Navigate wizard steps (if multi-step wizard is used)
const navigateWizard = function(direction) {
    if (direction === 'next') {
        if (window.wizardCurrentStep < window.wizardSteps.length - 1) {
            window.wizardCurrentStep++;
            updateWizardDisplay();
        }
    } else if (direction === 'prev') {
        if (window.wizardCurrentStep > 0) {
            window.wizardCurrentStep--;
            updateWizardDisplay();
        }
    }
};
window.navigateWizard = navigateWizard;

// Update wizard display for multi-step forms
const updateWizardDisplay = function() {
    const steps = document.querySelectorAll('.wizard-step');
    steps.forEach((step, index) => {
        if (index === window.wizardCurrentStep) {
            step.classList.add('active');
            step.style.display = 'block';
        } else {
            step.classList.remove('active');
            step.style.display = 'none';
        }
    });

    // Update step indicators
    const stepIndicators = document.querySelectorAll('.step-indicator');
    stepIndicators.forEach((indicator, index) => {
        if (index === window.wizardCurrentStep) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });

    // Update navigation buttons
    const prevBtn = document.getElementById('wizardPrev');
    const nextBtn = document.getElementById('wizardNext');

    if (prevBtn) {
        prevBtn.style.display = window.wizardCurrentStep === 0 ? 'none' : 'inline-block';
    }

    if (nextBtn) {
        nextBtn.textContent = window.wizardCurrentStep === window.wizardSteps.length - 1 ? 'Finish' : 'Next';
    }
};
window.updateWizardDisplay = updateWizardDisplay;

// Update pricing function
window.updatePricing = function() {
    console.log('updatePricing called - calculating price based on current inputs');

    // This would normally calculate pricing based on all the form inputs
    // For now, just update the charge summary if it exists
    if (window.updateChargeSummary && typeof window.updateChargeSummary === 'function') {
        window.updateChargeSummary();
    }
};

// All functions already assigned to window above

// Export for use in other modules
export {
    selectWizardPaintCondition,
    renderConsolidatedForm,
    updateGrowthDisplay,
    navigateWizard,
    updateWizardDisplay
};