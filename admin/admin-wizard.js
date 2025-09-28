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

    // Add Customer Information Section
    formHTML += `
        <div class="form-section customer-info-section" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #495057;">Customer Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label for="wizardCustomerName" style="display: block; margin-bottom: 5px; color: #495057;">Name</label>
                    <div style="position: relative;">
                        <input type="text"
                               id="wizardCustomerName"
                               placeholder="Start typing to search..."
                               style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 5px; font-size: 14px;"
                               oninput="window.searchCustomerByName(this.value)"
                               autocomplete="off">
                        <div id="customerSearchResults" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ced4da; border-radius: 5px; max-height: 200px; overflow-y: auto; display: none; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.1);"></div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="wizardCustomerEmail" style="display: block; margin-bottom: 5px; color: #495057;">Email</label>
                    <input type="email"
                           id="wizardCustomerEmail"
                           placeholder="customer@example.com"
                           style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 5px; font-size: 14px;">
                </div>
                <div class="form-group">
                    <label for="wizardCustomerPhone" style="display: block; margin-bottom: 5px; color: #495057;">Phone</label>
                    <input type="tel"
                           id="wizardCustomerPhone"
                           placeholder="(555) 123-4567"
                           style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 5px; font-size: 14px;">
                </div>
            </div>
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
                            <span>Trimaran (+50% surcharge)</span>
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
                            <span style="font-size: 11px;">Min<br>0%</span>
                            <span style="font-size: 11px;">Light<br>0%</span>
                            <span style="font-size: 11px;">Mod<br>0%</span>
                            <span style="font-size: 11px;">Heavy<br>75%</span>
                            <span style="font-size: 11px;">Severe<br>150%</span>
                            <span style="font-size: 11px;">Extreme<br>200%</span>
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
                <button type="button" onclick="toggleAnodeSection()" class="customer-btn" style="background-color: #e67e22; font-size: 16px; padding: 12px 24px;">
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
                <button type="button" onclick="toggleAnodeSection()" class="customer-btn" style="background-color: #e67e22; font-size: 16px; padding: 12px 24px;">
                    ⚓ Add Anodes to Service
                </button>
                <p style="margin-top: 10px; color: #666; font-size: 14px;">
                    Optional: Add zinc anode replacement to this service
                </p>
            </div>
        `;
    }

    // Add the anode selection section (hidden by default except for anodes_only)
    formHTML += `
        <div id="anodeSection" class="form-section" style="display: ${isAnodesOnly ? 'block' : 'none'}; margin-top: 20px; background: #f8f9fa; border: 2px solid #e67e22;">
            <h3 style="color: #e67e22;">⚓ Select Zinc Anodes</h3>

            <div class="anode-selector">
                <div class="wizard-field">
                    <input type="text" id="anodeSearch" class="search-input"
                           placeholder="Search by size or type..."
                           oninput="if(window.adminApp) adminApp.filterAnodes(this.value)">
                </div>

                <div class="anode-categories" style="margin-top: 15px;">
                    <button type="button" class="category-btn active" onclick="if(window.adminApp) adminApp.filterByCategory('all')">All</button>
                    <button type="button" class="category-btn" onclick="if(window.adminApp) adminApp.filterByCategory('shaft')">Shaft</button>
                    <button type="button" class="category-btn" onclick="if(window.adminApp) adminApp.filterByCategory('propeller')">Prop</button>
                    <button type="button" class="category-btn" onclick="if(window.adminApp) adminApp.filterByCategory('hull')">Hull</button>
                    <button type="button" class="category-btn" onclick="if(window.adminApp) adminApp.filterByCategory('engine')">Engine</button>
                </div>

                <div id="materialFilter" class="material-filter" style="margin-top: 10px;">
                    <button type="button" class="material-btn active" onclick="if(window.adminApp) adminApp.filterByMaterial('all')">All</button>
                    <button type="button" class="material-btn" onclick="if(window.adminApp) adminApp.filterByMaterial('zinc')">Zinc</button>
                    <button type="button" class="material-btn" onclick="if(window.adminApp) adminApp.filterByMaterial('magnesium')">Mag</button>
                    <button type="button" class="material-btn" onclick="if(window.adminApp) adminApp.filterByMaterial('aluminum')">Alum</button>
                </div>

                <div id="shaftSubfilter" class="shaft-subfilter" style="display: none; margin-top: 10px;">
                    <button type="button" class="subfilter-btn active" onclick="if(window.adminApp) adminApp.filterShaftType('all')">All</button>
                    <button type="button" class="subfilter-btn" onclick="if(window.adminApp) adminApp.filterShaftType('standard')">Standard</button>
                    <button type="button" class="subfilter-btn" onclick="if(window.adminApp) adminApp.filterShaftType('metric')">Metric</button>
                </div>

                <div id="anodeGrid" class="anode-grid" style="max-height: 400px; overflow-y: auto; margin-top: 15px; border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                    <!-- Anodes will be populated here -->
                    <p style="color: #999;">Loading anodes...</p>
                </div>
            </div>

            <div class="selected-anodes" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                <h4>Selected Anodes: <span id="selectedCount">0</span></h4>
                <div id="selectedAnodesList"></div>
                <div class="anode-total" style="margin-top: 15px; padding: 15px; background: #fff3cd; border-radius: 8px;">
                    <strong>Anodes Subtotal: $<span id="anodeSubtotal">0.00</span></strong>
                    <br><small>Labor: $15 per anode</small>
                </div>
            </div>
        </div>
    `;

    // Remove the Price Estimate section - it will be shown in the main Charge Summary instead

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

            // Load anode catalog if service needs it
            if (serviceKey === 'recurring_cleaning' || serviceKey === 'onetime_cleaning' || serviceKey === 'anodes_only') {
                console.log('Loading anode catalog for service:', serviceKey);
                window.adminApp.loadAnodeCatalog();

                // For anodes_only service, auto-open the anode section
                if (serviceKey === 'anodes_only') {
                    const anodeSection = document.getElementById('anodeSection');
                    if (anodeSection) {
                        anodeSection.style.display = 'block';
                    }
                }
            }
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
        let level, surcharge, surchargePercent;

        // Growth surcharges only start at heavy level
        if (value <= 10) {
            level = 'minimal';
            surchargePercent = 0;
        } else if (value <= 20) {
            level = 'very-light';
            surchargePercent = 0;
        } else if (value <= 30) {
            level = 'light';
            surchargePercent = 0;
        } else if (value <= 40) {
            level = 'light-moderate';
            surchargePercent = 0;
        } else if (value <= 50) {
            level = 'moderate';
            surchargePercent = 0;
        } else if (value <= 60) {
            level = 'moderate-heavy';
            surchargePercent = 0;
        } else if (value <= 70) {
            level = 'heavy';
            surchargePercent = 75;
        } else if (value <= 80) {
            level = 'very-heavy';
            surchargePercent = 100;
        } else if (value <= 90) {
            level = 'severe';
            surchargePercent = 150;
        } else {
            level = 'extreme';
            surchargePercent = 200;
        }

        surcharge = surchargePercent + '%';
        // Format the display text nicely
        const displayLevel = level.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        valueDisplay.textContent = `${displayLevel} (${surcharge})`;
        hiddenInput.value = level;

        // Store the actual percentage for calculations
        hiddenInput.setAttribute('data-surcharge', surchargePercent / 100);

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
        if (hullType === 'catamaran') {
            const surcharge = basePrice * 0.25;
            totalSurcharge += surcharge;
            breakdown.push(`Catamaran surcharge (25%): +$${surcharge.toFixed(2)}`);
        } else if (hullType === 'trimaran') {
            const surcharge = basePrice * 0.50;
            totalSurcharge += surcharge;
            breakdown.push(`Trimaran surcharge (50%): +$${surcharge.toFixed(2)}`);
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
            'good': 0,      // No surcharge for good paint
            'fair': 0,      // No surcharge for fair paint
            'poor': 0.10,   // 10% surcharge for poor paint
            'missing': 0.15 // 15% surcharge for missing paint
        };
        const paintSurchargeRate = paintSurcharges[paintCondition] || 0;
        if (paintSurchargeRate > 0) {
            const surcharge = basePrice * paintSurchargeRate;
            totalSurcharge += surcharge;
            const percentage = (paintSurchargeRate * 100).toFixed(0);
            breakdown.push(`Paint condition (${paintCondition}) surcharge (${percentage}%): +$${surcharge.toFixed(2)}`);
        }

        // Growth level surcharge
        const growthLevelElement = document.getElementById('wizardGrowthLevel') || document.getElementById('growth_level');
        const growthLevel = growthLevelElement?.value || 'minimal';

        // Check if we have a data-surcharge attribute (new system) or use legacy mapping
        let growthSurchargeRate;
        if (growthLevelElement && growthLevelElement.hasAttribute('data-surcharge')) {
            growthSurchargeRate = parseFloat(growthLevelElement.getAttribute('data-surcharge')) || 0;
        } else {
            // Growth surcharges only start at heavy level
            const growthSurcharges = {
                'minimal': 0,           // 0% surcharge
                'very-light': 0,        // 0% surcharge
                'light': 0,             // 0% surcharge
                'light-moderate': 0,    // 0% surcharge
                'moderate': 0,          // 0% surcharge
                'moderate-heavy': 0,    // 0% surcharge
                'heavy': 0.75,          // 75% surcharge
                'very-heavy': 1.00,     // 100% surcharge
                'severe': 1.50,         // 150% surcharge
                'extreme': 2.00         // 200% surcharge
            };
            growthSurchargeRate = growthSurcharges[growthLevel] || 0;
        }
        if (growthSurchargeRate > 0) {
            const surcharge = basePrice * growthSurchargeRate;
            totalSurcharge += surcharge;
            const percentage = (growthSurchargeRate * 100).toFixed(0);
            breakdown.push(`Growth level (${growthLevel}) surcharge (${percentage}%): +$${surcharge.toFixed(2)}`);
        }
    }

    // Add total surcharge summary if there are surcharges
    if (totalSurcharge > 0 && basePrice > 0) {
        const totalSurchargePercent = ((totalSurcharge / basePrice) * 100).toFixed(0);
        breakdown.push(`<strong>Total surcharges (${totalSurchargePercent}%): +$${totalSurcharge.toFixed(2)}</strong>`);
    }

    // Calculate total
    const total = basePrice + totalSurcharge;

    // Apply minimum charge
    const minimumCharge = 150;
    const finalTotal = Math.max(total, minimumCharge);

    if (finalTotal === minimumCharge && total < minimumCharge) {
        breakdown.push(`Minimum charge applied: $${minimumCharge}`);
    }

    // Update the main charge summary instead of wizard pricing section
    const chargeSummaryContent = document.getElementById('chargeSummaryContent');

    if (chargeSummaryContent) {
        let summaryHTML = '<div class="charge-breakdown">';

        // Add customer info if available
        if (window.selectedCustomer) {
            summaryHTML += `
                <div class="charge-detail-row">
                    <span><strong>Customer:</strong></span>
                    <span>${window.selectedCustomer.name || window.selectedCustomer.email}</span>
                </div>`;
        }

        // Add service info
        summaryHTML += `
            <div class="charge-detail-row">
                <span><strong>Service:</strong></span>
                <span>${service.name}</span>
            </div>`;

        // Add boat details section
        summaryHTML += '<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">';
        summaryHTML += '<h4 style="margin: 0 0 10px 0; color: #2c3e50;">Boat Details</h4>';

        // Add boat name if available
        const boatName = document.getElementById('boatName')?.value || document.getElementById('wizardBoatName')?.value;
        if (boatName) {
            summaryHTML += `
                <div class="charge-detail-row" style="font-size: 14px; margin: 5px 0;">
                    <span>Boat Name:</span>
                    <span>${boatName}</span>
                </div>`;
        }

        // Add boat length
        if (boatLength > 0) {
            summaryHTML += `
                <div class="charge-detail-row" style="font-size: 14px; margin: 5px 0;">
                    <span>Boat Length:</span>
                    <span>${boatLength} feet</span>
                </div>`;
        }

        // Add boat type
        const boatType = document.querySelector('input[name="wizard_boat_type"]:checked')?.value ||
                        document.querySelector('input[name="boat_type"]:checked')?.value || 'sailboat';
        summaryHTML += `
            <div class="charge-detail-row" style="font-size: 14px; margin: 5px 0;">
                <span>Boat Type:</span>
                <span>${boatType === 'powerboat' ? 'Powerboat' : 'Sailboat'}</span>
            </div>`;

        // Add hull type
        const hullType = document.querySelector('input[name="wizard_hull_type"]:checked')?.value ||
                        document.querySelector('input[name="hull_type"]:checked')?.value || 'monohull';
        const hullTypeDisplay = hullType === 'catamaran' ? 'Catamaran' :
                                hullType === 'trimaran' ? 'Trimaran' : 'Monohull';
        summaryHTML += `
            <div class="charge-detail-row" style="font-size: 14px; margin: 5px 0;">
                <span>Hull Type:</span>
                <span>${hullTypeDisplay}</span>
            </div>`;

        // Add twin engines status
        const twinEngines = document.getElementById('wizard_twin_engines')?.checked ||
                           document.getElementById('has_twin_engines')?.checked;
        if (twinEngines) {
            summaryHTML += `
                <div class="charge-detail-row" style="font-size: 14px; margin: 5px 0;">
                    <span>Twin Engines:</span>
                    <span>Yes</span>
                </div>`;
        }

        // Add condition details for cleaning services
        if (serviceKey === 'recurring_cleaning' || serviceKey === 'onetime_cleaning') {
            // Add paint condition
            const paintCondition = document.getElementById('wizardPaintCondition')?.value ||
                                  document.getElementById('paint_condition')?.value || 'good';
            summaryHTML += `
                <div class="charge-detail-row" style="font-size: 14px; margin: 5px 0;">
                    <span>Paint Condition:</span>
                    <span>${paintCondition.charAt(0).toUpperCase() + paintCondition.slice(1)}</span>
                </div>`;

            // Add growth level
            const growthLevel = document.getElementById('wizardGrowthLevel')?.value ||
                               document.getElementById('growth_level')?.value || 'minimal';
            const growthDisplay = growthLevel.split('-').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            summaryHTML += `
                <div class="charge-detail-row" style="font-size: 14px; margin: 5px 0;">
                    <span>Growth Level:</span>
                    <span>${growthDisplay}</span>
                </div>`;
        }

        // Add anode information if any are selected
        if (window.adminApp && window.adminApp.selectedAnodes && window.adminApp.selectedAnodes.size > 0) {
            summaryHTML += '<div style="margin-top: 10px;">';
            summaryHTML += '<h5 style="margin: 10px 0 5px 0; color: #2c3e50;">Anodes Selected</h5>';
            let totalAnodes = 0;
            let anodeDetails = [];
            window.adminApp.selectedAnodes.forEach((quantity, anodeId) => {
                if (quantity > 0) {
                    const anode = window.adminApp.anodes.find(a => a.id === anodeId);
                    if (anode) {
                        anodeDetails.push(`${quantity}x ${anode.name} (${anode.material})`);
                        totalAnodes += quantity;
                    }
                }
            });
            if (anodeDetails.length > 0) {
                summaryHTML += `
                    <div class="charge-detail-row" style="font-size: 14px; margin: 5px 0;">
                        <span>Total Anodes:</span>
                        <span>${totalAnodes} anodes</span>
                    </div>`;
                summaryHTML += `
                    <div class="charge-detail-row" style="font-size: 12px; margin: 5px 0; color: #666;">
                        <span style="display: block;">${anodeDetails.join(', ')}</span>
                    </div>`;
            }
            summaryHTML += '</div>';
        }
        summaryHTML += '</div>';

        // Add pricing breakdown section
        summaryHTML += '<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">';
        summaryHTML += '<h4 style="margin: 0 0 10px 0; color: #2c3e50;">Pricing Breakdown</h4>';
        summaryHTML += breakdown.map(line => `<div class="charge-detail-row" style="font-size: 14px; margin: 5px 0;">${line}</div>`).join('');
        summaryHTML += '</div>';

        // Add total with emphasis
        summaryHTML += `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #3498db;">
                <div class="charge-detail-row" style="font-size: 20px; font-weight: bold;">
                    <span>Total:</span>
                    <span style="color: #27ae60;">$${finalTotal.toFixed(2)}</span>
                </div>
            </div>`;

        summaryHTML += '</div>';
        chargeSummaryContent.innerHTML = summaryHTML;

        // Enable/disable charge button based on selections
        const chargeButton = document.getElementById('chargeButton');
        if (chargeButton) {
            chargeButton.disabled = !window.selectedCustomer || !window.selectedCustomer.payment_method || !serviceKey;
        }

        // Disabled auto-scroll to prevent unwanted scrolling when interacting with wizard
        // const chargeSummarySection = document.querySelector('.charge-summary');
        // if (chargeSummarySection) {
        //     const rect = chargeSummarySection.getBoundingClientRect();
        //     const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        //     if (!isVisible) {
        //         chargeSummarySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        //     }
        // }
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

// Customer search functionality for wizard
let searchTimeout = null;
window.searchCustomerByName = async function(query) {
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    const resultsDiv = document.getElementById('customerSearchResults');

    // Hide results if query is empty
    if (!query || query.length < 2) {
        resultsDiv.style.display = 'none';
        return;
    }

    // Debounce the search
    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`);
            const customers = await response.json();

            if (customers && customers.length > 0) {
                resultsDiv.innerHTML = customers.map(customer => `
                    <div onclick="window.selectWizardCustomer('${customer.id}')"
                         style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;"
                         onmouseover="this.style.backgroundColor='#f0f0f0'"
                         onmouseout="this.style.backgroundColor='white'">
                        <div style="font-weight: 500;">${customer.name || 'Unnamed'}</div>
                        <div style="font-size: 12px; color: #666;">${customer.email}</div>
                        ${customer.boat_name ? `<div style="font-size: 12px; color: #666;">Boat: ${customer.boat_name}</div>` : ''}
                    </div>
                `).join('');
                resultsDiv.style.display = 'block';
            } else {
                resultsDiv.innerHTML = '<div style="padding: 10px; color: #666;">No customers found</div>';
                resultsDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Error searching customers:', error);
            resultsDiv.style.display = 'none';
        }
    }, 300);
};

// Select a customer from search results
window.selectWizardCustomer = async function(customerId) {
    try {
        const response = await fetch(`/api/customers/${customerId}`);
        const customer = await response.json();

        if (customer) {
            // Fill in customer fields
            document.getElementById('wizardCustomerName').value = customer.name || '';
            document.getElementById('wizardCustomerEmail').value = customer.email || '';
            document.getElementById('wizardCustomerPhone').value = customer.phone || '';

            // Hide search results
            document.getElementById('customerSearchResults').style.display = 'none';

            // Store customer data for later use
            window.selectedWizardCustomer = customer;

            // If customer has boat info, fill that in too
            if (customer.boat_length) {
                const boatLengthInput = document.getElementById('wizardBoatLength') || document.getElementById('boat_length');
                if (boatLengthInput) {
                    boatLengthInput.value = customer.boat_length;
                }
            }
            if (customer.boat_name) {
                const boatNameInput = document.getElementById('wizardBoatName') || document.getElementById('boat_name');
                if (boatNameInput) {
                    boatNameInput.value = customer.boat_name;
                }
            }
            if (customer.boat_make) {
                const boatMakeInput = document.getElementById('wizardBoatMake') || document.getElementById('boat_make');
                if (boatMakeInput) {
                    boatMakeInput.value = customer.boat_make;
                }
            }
            if (customer.boat_model) {
                const boatModelInput = document.getElementById('wizardBoatModel') || document.getElementById('boat_model');
                if (boatModelInput) {
                    boatModelInput.value = customer.boat_model;
                }
            }

            // Update pricing
            if (window.calculateCost) window.calculateCost();
            if (window.updateChargeSummary) window.updateChargeSummary();
        }
    } catch (error) {
        console.error('Error fetching customer details:', error);
    }
};

// Hide search results when clicking outside
document.addEventListener('click', function(e) {
    const searchResults = document.getElementById('customerSearchResults');
    const nameInput = document.getElementById('wizardCustomerName');

    if (searchResults && nameInput && !nameInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

// All functions already assigned to window above

// Export for use in other modules
export {
    selectWizardPaintCondition,
    renderConsolidatedForm,
    updateGrowthDisplay,
    navigateWizard,
    updateWizardDisplay
};