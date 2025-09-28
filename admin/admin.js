// Admin Application Module
export class AdminApp {
    constructor() {
        this.selectedCustomer = null;
        this.customers = [];
        this.currentServiceKey = null;
        this.modalSelectedCustomerId = null;
        this.selectedAnodes = {};
        this.anodeDetails = null;

        this.init();
    }

    init() {
        console.log('Initializing Admin App');

        // Set up event listeners
        this.setupEventListeners();

        // Initialize service buttons
        // DISABLED: Using HTML buttons with selectServiceDirect instead
        // if (window.serviceData) {
        //     this.populateAdminServiceButtons();
        // } else {
        //     // Retry if script.js hasn't loaded yet
        //     setTimeout(() => this.init(), 100);
        // }
    }

    setupEventListeners() {
        // Customer search enter key
        const searchInput = document.getElementById('customerSearch');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchCustomers();
                }
            });
        }

        // Modal customer search
        const modalSearch = document.getElementById('modalCustomerSearch');
        if (modalSearch) {
            modalSearch.addEventListener('input', (e) => {
                this.filterModalCustomers(e.target.value);
            });
        }
    }

    scrollToServiceForm() {
        // Find the service form container or wizard container
        let targetElement = document.getElementById('wizardContainer');

        // If wizard container isn't visible, try the service form container
        if (!targetElement || targetElement.style.display === 'none') {
            targetElement = document.querySelector('.service-form-container');
        }

        // If we still don't have a target, try the charge summary
        if (!targetElement || targetElement.style.display === 'none') {
            targetElement = document.querySelector('.charge-summary');
        }

        // If we found a target element, scroll to it
        if (targetElement && targetElement.style.display !== 'none') {
            // Get the service buttons container to ensure we scroll past it
            const buttonsContainer = document.getElementById('simpleServiceButtons') ||
                                    document.querySelector('.simple-service-buttons');

            // Calculate how far we need to scroll to hide the buttons completely
            if (buttonsContainer) {
                const buttonsRect = buttonsContainer.getBoundingClientRect();
                const buttonsBottom = buttonsRect.bottom + window.pageYOffset;

                // Add a small margin (20px) to ensure buttons are fully off screen
                const scrollTarget = buttonsBottom + 20;

                // Smooth scroll to push buttons off screen
                window.scrollTo({
                    top: scrollTarget,
                    behavior: 'smooth'
                });
            } else {
                // Fallback to original behavior if we can't find buttons
                const headerHeight = 60;
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerHeight;

                window.scrollTo({
                    top: Math.max(0, offsetPosition),
                    behavior: 'smooth'
                });
            }
        }
    }

    populateAdminServiceButtons() {
        const buttonsContainer = document.getElementById('simpleServiceButtons');
        if (!buttonsContainer) {
            console.error('Service buttons container not found');
            return;
        }

        // Clear existing buttons
        buttonsContainer.innerHTML = '';

        // Define service order and styling with high-contrast gradients
        const services = [
            {
                key: 'recurring_cleaning',
                label: '🔄 Recurring Cleaning',
                gradient: 'linear-gradient(135deg, #4A148C 0%, #6A1B9A 100%)'  // Very dark purple
            },
            {
                key: 'onetime_cleaning',
                label: '🧽 One-Time Cleaning',
                gradient: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)'  // Very dark blue
            },
            {
                key: 'item_recovery',
                label: '🔍 Item Recovery',
                gradient: 'linear-gradient(135deg, #AD1457 0%, #C2185B 100%)'  // Dark pink
            },
            {
                key: 'underwater_inspection',
                label: '🤿 Underwater Inspection',
                gradient: 'linear-gradient(135deg, #00695C 0%, #00897B 100%)'  // Dark teal
            },
            {
                key: 'propeller_service',
                label: '⚙️ Propeller Service',
                gradient: 'linear-gradient(135deg, #E65100 0%, #F57C00 100%)'  // Dark orange
            },
            {
                key: 'anodes_only',
                label: '⚡ Anodes Only',
                gradient: 'linear-gradient(135deg, #B71C1C 0%, #D32F2F 100%)'  // Dark red
            }
        ];

        services.forEach(({ key, label, gradient }) => {
            if (!window.serviceData[key]) return;

            const button = document.createElement('button');
            button.className = 'simple-service-btn';
            button.textContent = label;

            // Apply high-contrast gradient background
            button.style.cssText = `
                padding: 12px 20px;
                background: ${gradient};
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
                transition: all 0.3s;
                text-shadow: 0 1px 3px rgba(0,0,0,0.4);
                font-weight: 600;
            `;

            button.onclick = () => this.selectAdminService(key);
            buttonsContainer.appendChild(button);
        });
    }

    selectService(serviceKey) {
        // Alias for selectAdminService for compatibility
        return this.selectAdminService(serviceKey);
    }

    selectAdminService(serviceKey) {
        console.log('Selecting service:', serviceKey);

        // Store the service key
        this.currentServiceKey = serviceKey;
        window.currentServiceKey = serviceKey;
        window.selectedServiceKey = serviceKey;

        // Get service data
        const service = window.serviceData[serviceKey];
        if (!service) return;

        // Scroll to wizard after a brief delay to ensure it's rendered
        setTimeout(() => {
            const wizardContainer = document.getElementById('wizardContainer');
            if (wizardContainer && wizardContainer.style.display !== 'none') {
                // Try to find the first input field in the wizard
                const firstInput = wizardContainer.querySelector('input, select, textarea');
                const targetElement = firstInput || wizardContainer;

                // Scroll to position the first input at the top of the viewport
                const headerHeight = 60;
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerHeight - 10; // Small padding from header

                window.scrollTo({
                    top: Math.max(0, offsetPosition),
                    behavior: 'smooth'
                });
            }
        }, 200);

        // Check if renderConsolidatedForm should handle this service
        // (for services with anode picker functionality)
        if (window.renderConsolidatedForm &&
            (serviceKey === 'recurring_cleaning' ||
             serviceKey === 'onetime_cleaning' ||
             serviceKey === 'anodes_only')) {
            console.log('Service will be handled by renderConsolidatedForm');
            // Don't show our own wizard - let renderConsolidatedForm handle it
            return;
        }

        // Special handling for Anodes Only service - open anode selector directly
        if (serviceKey === 'anodes_only') {
            // Hide service buttons
            document.getElementById('simpleServiceButtons').style.display = 'none';

            // Show wizard container
            const wizardContainer = document.getElementById('wizardContainer');
            wizardContainer.style.display = 'block';

            // Open anode selector directly
            this.openAnodeWizardForAnodesOnly();
        } else if (service.type === 'per_foot') {
            // For per-foot services, show the wizard
            // Hide service buttons
            document.getElementById('simpleServiceButtons').style.display = 'none';

            // Show wizard
            const wizardContainer = document.getElementById('wizardContainer');
            wizardContainer.style.display = 'block';

            // Only initialize wizard if it hasn't been rendered already
            // (renderConsolidatedForm may have already rendered it)
            const wizardContent = document.getElementById('wizardContent');
            if (!wizardContent || !wizardContent.innerHTML.trim()) {
                // Initialize the wizard for admin
                this.initializeWizard(serviceKey);
            }
        } else {
            // For flat rate services, set the price directly
            // Set the price in the hidden display element
            const price = service.rate || 0;
            const displayEl = document.getElementById('totalCostDisplay');
            if (displayEl) {
                displayEl.textContent = `$${price.toFixed(2)}`;
            }
        }

        // Update charge summary after a slight delay to ensure calculations are done
        setTimeout(() => this.updateChargeSummary(), 100);
    }

    initializeWizard(serviceKey) {
        const wizardContent = document.getElementById('wizardContent');
        if (!wizardContent) return;

        // Special handling for propeller service
        if (serviceKey === 'propeller_service') {
            wizardContent.innerHTML = `
                <div class="admin-wizard">
                    <h3>${window.serviceData[serviceKey].name}</h3>
                    <div class="wizard-field">
                        <label>Number of Propellers</label>
                        <input type="number" id="propellerCount" min="1" max="4" value="1"
                               oninput="adminApp.updatePropellerService()">
                        <div style="margin-top: 10px; color: #666; font-size: 14px;">
                            Service rate: $349 per propeller
                        </div>
                    </div>
                    <div class="wizard-field">
                        <label>
                            <input type="checkbox" id="propellerRemoval" checked
                                   onchange="adminApp.updatePropellerService()">
                            <span>Removal Service</span>
                        </label>
                    </div>
                    <div class="wizard-field">
                        <label>
                            <input type="checkbox" id="propellerInstall"
                                   onchange="adminApp.updatePropellerService()">
                            <span>Installation Service</span>
                        </label>
                    </div>
                    <div class="wizard-actions">
                        <button class="btn-secondary" onclick="adminApp.backToServices()">← Back</button>
                    </div>
                </div>
            `;
            // Initialize propeller service calculation
            this.updatePropellerService();
            return;
        }

        // Create simplified wizard for admin
        wizardContent.innerHTML = `
            <div class="admin-wizard">
                <h3>${window.serviceData[serviceKey].name}</h3>

                <div class="wizard-field">
                    <label>Boat Length (feet)</label>
                    <input type="number" id="adminBoatLength" min="10" max="200" value="30"
                           oninput="adminApp.updateFromWizard()">
                </div>

                <div class="wizard-field">
                    <label>Hull Type</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="adminHullType" value="monohull" checked
                                   onchange="adminApp.updateFromWizard()">
                            <span>Monohull</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="adminHullType" value="catamaran"
                                   onchange="adminApp.updateFromWizard()">
                            <span>Catamaran (+25% surcharge)</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="adminHullType" value="trimaran"
                                   onchange="adminApp.updateFromWizard()">
                            <span>Trimaran (+50% surcharge)</span>
                        </label>
                    </div>
                </div>

                ${serviceKey.includes('cleaning') ? `
                <div class="wizard-field">
                    <label>Paint Condition</label>
                    <div class="button-group">
                        <button class="condition-btn active" data-value="excellent"
                                onclick="adminApp.setPaintCondition('excellent')">Excellent</button>
                        <button class="condition-btn" data-value="good"
                                onclick="adminApp.setPaintCondition('good')">Good</button>
                        <button class="condition-btn" data-value="fair"
                                onclick="adminApp.setPaintCondition('fair')">Fair</button>
                        <button class="condition-btn" data-value="poor"
                                onclick="adminApp.setPaintCondition('poor')">Poor</button>
                    </div>
                </div>

                <div class="wizard-field">
                    <label>Growth Level: <span id="growthLabel">Minimal</span> - <span id="growthPercent">0%</span> surcharge</label>
                    <input type="range" id="adminGrowthLevel" min="0" max="100" value="0"
                           oninput="adminApp.updateGrowthDisplay(this.value); adminApp.updateFromWizard()">
                    <div class="slider-labels">
                        <span class="slider-label" style="left: 5%">Minimal<br><small>0%</small></span>
                        <span class="slider-label" style="left: 30%">Moderate<br><small>25%</small></span>
                        <span class="slider-label" style="left: 55%">Heavy<br><small>50%</small></span>
                        <span class="slider-label" style="left: 85%">Severe<br><small>200%</small></span>
                    </div>
                </div>
                ` : ''}

                <div class="wizard-field">
                    <label>
                        <input type="checkbox" id="adminPowerboat" onchange="adminApp.updateFromWizard()">
                        <span>Powerboat (not sailing vessel) (+25% surcharge)</span>
                    </label>
                </div>

                <div class="wizard-field">
                    <label>
                        <input type="checkbox" id="adminTwinEngines" onchange="adminApp.updateFromWizard()">
                        <span>Twin engines (+10% surcharge)</span>
                    </label>
                </div>

                <div class="wizard-field">
                    <button class="btn-primary anode-button" onclick="adminApp.openAnodeWizard()">
                        ⚓ Add Anodes to Service
                    </button>
                </div>

                <div class="wizard-actions">
                    <button onclick="adminApp.closeWizard()" class="btn-secondary">← Back to Services</button>
                </div>
            </div>
        `;

        // Set initial values
        document.getElementById('boatLength').value = '30';
        if (document.getElementById('actualPaintCondition')) {
            document.getElementById('actualPaintCondition').value = 'excellent';
        }
        if (document.getElementById('actualGrowthLevel')) {
            document.getElementById('actualGrowthLevel').value = '0';
        }
        document.getElementById('additionalHulls').value = '0';

        // Calculate initial price
        setTimeout(() => {
            this.calculateAdminPrice();
            this.updateChargeSummary();
        }, 100);
    }

    setPaintCondition(condition) {
        document.querySelectorAll('.condition-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        document.getElementById('actualPaintCondition').value = condition;
        this.updateFromWizard();
    }

    updateGrowthDisplay(value) {
        const sliderValue = parseInt(value);

        // Calculate surcharge percentage and label based on slider position
        let surchargePercent = 0;
        let label = 'Minimal';

        if (sliderValue <= 20) {
            surchargePercent = 0;
            label = 'Minimal';
        } else if (sliderValue <= 35) {
            surchargePercent = Math.round((sliderValue - 20) * 25 / 15);
            label = 'Moderate';
        } else if (sliderValue <= 60) {
            surchargePercent = 25 + Math.round((sliderValue - 35) * 25 / 25);
            label = 'Heavy';
        } else {
            surchargePercent = 50 + Math.round((sliderValue - 60) * 150 / 40);
            label = 'Severe';
        }

        // Update display
        document.getElementById('growthPercent').textContent = surchargePercent + '%';
        const labelEl = document.getElementById('growthLabel');
        if (labelEl) {
            labelEl.textContent = label;
        }

        // Store the slider value for surcharge calculation
        let actualGrowthEl = document.getElementById('actualGrowthLevel');
        if (!actualGrowthEl) {
            // Create it if it doesn't exist
            actualGrowthEl = document.createElement('input');
            actualGrowthEl.type = 'hidden';
            actualGrowthEl.id = 'actualGrowthLevel';
            document.body.appendChild(actualGrowthEl);
        }
        actualGrowthEl.value = value;

        // updateFromWizard is called from the oninput handler
    }

    updatePropellerService() {
        const count = parseInt(document.getElementById('propellerCount')?.value) || 1;
        const removal = document.getElementById('propellerRemoval')?.checked;
        const install = document.getElementById('propellerInstall')?.checked;

        let totalServices = 0;
        if (removal) totalServices += count;
        if (install) totalServices += count;

        const price = totalServices * 349;

        // Update display
        const displayEl = document.getElementById('totalCostDisplay');
        if (displayEl) {
            displayEl.textContent = `$${price.toFixed(2)}`;
        }

        // Store details for charge summary
        this.propellerDetails = {
            count: count,
            removal: removal,
            install: install,
            totalServices: totalServices,
            price: price
        };

        this.updateChargeSummary();
    }

    backToServices() {
        // Hide wizard and show service buttons
        const wizardContainer = document.getElementById('wizardContainer');
        if (wizardContainer) {
            wizardContainer.style.display = 'none';
        }

        const simpleButtons = document.getElementById('simpleServiceButtons');
        if (simpleButtons) {
            simpleButtons.style.display = 'flex';
        }

        const serviceHeading = document.querySelector('.service-selector h2');
        if (serviceHeading) {
            serviceHeading.style.display = 'block';
        }

        // Clear current service
        this.currentServiceKey = null;
        this.propellerDetails = null;
        this.updateChargeSummary();
    }

    updateFromWizard() {
        // Debounce updates to prevent lag on slider changes
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }

        this.updateTimeout = setTimeout(() => {
            this._performWizardUpdate();
        }, 100);
    }

    _performWizardUpdate() {
        // Update boat length
        const boatLength = document.getElementById('adminBoatLength')?.value || 30;
        document.getElementById('boatLength').value = boatLength;

        // Update hull type
        const hullType = document.querySelector('input[name="adminHullType"]:checked')?.value || 'monohull';

        // Set hull type in hidden fields (script.js uses these)
        // For monohull, additionalHulls = 0
        // For catamaran, additionalHulls = 1 (2 total hulls)
        // For trimaran, additionalHulls = 2 (3 total hulls)
        let additionalHulls = 0;
        if (hullType === 'catamaran') additionalHulls = 1;
        if (hullType === 'trimaran') additionalHulls = 2;

        // Store hull type for price calculation
        const hullInput = document.getElementById('additionalHulls');
        if (hullInput) {
            hullInput.value = additionalHulls;
        }

        // Update twin engines
        const hasTwinEngines = document.getElementById('adminTwinEngines')?.checked;
        const twinEnginesInput = document.getElementById('has_twin_engines');
        if (twinEnginesInput) {
            twinEnginesInput.checked = hasTwinEngines;
        }

        // Calculate the cost manually for admin page
        this.calculateAdminPrice();
        this.updateChargeSummary();
    }

    calculateAdminPrice() {
        if (!this.currentServiceKey || !window.serviceData[this.currentServiceKey]) return;

        const service = window.serviceData[this.currentServiceKey];

        // Only calculate for per-foot services
        if (service.type !== 'per_foot') return;

        const boatLength = parseFloat(document.getElementById('boatLength').value) || 30;
        const baseRate = service.rate || 0;

        // Calculate base cost
        let cost = boatLength * baseRate;
        let baseCost = cost;

        // Track surcharges for display
        this.surchargeDetails = {
            base: baseCost,
            hull: 0,
            paint: 0,
            growth: 0,
            engines: 0,
            powerboat: 0
        };

        // Apply hull surcharge
        const additionalHulls = parseInt(document.getElementById('additionalHulls')?.value) || 0;
        let hullMultiplier = 1;
        if (additionalHulls === 1) {
            hullMultiplier = 1.25; // Catamaran +25%
            this.surchargeDetails.hull = 25;
        }
        if (additionalHulls === 2) {
            hullMultiplier = 1.50; // Trimaran +50%
            this.surchargeDetails.hull = 50;
        }
        cost *= hullMultiplier;

        // Paint condition - captured for service logs but no surcharge
        if (this.currentServiceKey.includes('cleaning')) {
            const paintCondition = document.getElementById('actualPaintCondition')?.value || 'excellent';
            // Paint condition is recorded but doesn't affect price
            this.surchargeDetails.paint = 0;

            // Apply growth level surcharge based on slider value (0-100 scale)
            // The slider value represents visual growth, not a direct percentage
            const sliderValue = parseInt(document.getElementById('actualGrowthLevel')?.value) || 0;
            let growthSurcharge = 0;
            let growthLabel = 'Minimal';

            if (sliderValue <= 20) {
                // Minimal: 0% surcharge
                growthSurcharge = 0;
                growthLabel = 'Minimal';
            } else if (sliderValue <= 35) {
                // Moderate: 0-25% surcharge (scaled)
                growthSurcharge = ((sliderValue - 20) * 25 / 15) / 100;
                growthLabel = 'Moderate';
            } else if (sliderValue <= 60) {
                // Heavy: 25-50% surcharge (scaled)
                growthSurcharge = (25 + ((sliderValue - 35) * 25 / 25)) / 100;
                growthLabel = 'Heavy';
            } else {
                // Severe: 50-200% surcharge (scaled)
                growthSurcharge = (50 + ((sliderValue - 60) * 150 / 40)) / 100;
                growthLabel = 'Severe';
            }

            this.surchargeDetails.growth = growthSurcharge * 100;
            this.surchargeDetails.growthLabel = growthLabel;
            cost *= (1 + growthSurcharge);
        }

        // Apply powerboat surcharge
        const isPowerboat = document.getElementById('adminPowerboat')?.checked;
        if (isPowerboat) {
            cost *= 1.25; // +25%
            this.surchargeDetails.powerboat = 25;
        }

        // Apply twin engines surcharge
        const hasTwinEngines = document.getElementById('has_twin_engines')?.checked;
        if (hasTwinEngines) {
            cost *= 1.10; // +10%
            this.surchargeDetails.engines = 10;
        }

        // Update the display - set both value and textContent
        const displayEl = document.getElementById('totalCostDisplay');
        if (displayEl) {
            displayEl.value = cost.toFixed(2); // For input elements
            displayEl.textContent = `$${cost.toFixed(2)}`; // For display elements
        }

        // Also update the totalCost hidden input
        const totalCostEl = document.getElementById('totalCost');
        if (totalCostEl) {
            totalCostEl.value = cost.toFixed(2);
        }
    }

    closeWizard() {
        document.getElementById('simpleServiceButtons').style.display = 'flex';
        document.getElementById('wizardContainer').style.display = 'none';
        this.currentServiceKey = null;
        window.currentServiceKey = null;
        window.selectedServiceKey = null;
        this.updateChargeSummary();
    }

    openAnodeWizardForAnodesOnly() {
        // Load anode selector interface for Anodes Only service
        document.getElementById('wizardContent').innerHTML = `
            <div class="admin-wizard">
                <h3>⚓ Select Anodes</h3>

                <div class="anode-selector">
                    <div class="wizard-field">
                        <input type="text" id="anodeSearch" class="search-input"
                               placeholder="Search by size or type..."
                               oninput="adminApp.filterAnodes(this.value)">
                    </div>

                    <div class="anode-categories">
                        <button class="category-btn active" onclick="adminApp.filterByCategory('all')">All</button>
                        <button class="category-btn" onclick="adminApp.filterByCategory('shaft')">Shaft</button>
                        <button class="category-btn" onclick="adminApp.filterByCategory('propeller')">Prop</button>
                        <button class="category-btn" onclick="adminApp.filterByCategory('hull')">Hull</button>
                        <button class="category-btn" onclick="adminApp.filterByCategory('engine')">Engine</button>
                    </div>

                    <div id="materialFilter" class="material-filter">
                        <button class="material-btn active" onclick="adminApp.filterByMaterial('all')">All</button>
                        <button class="material-btn" onclick="adminApp.filterByMaterial('zinc')">Zinc</button>
                        <button class="material-btn" onclick="adminApp.filterByMaterial('magnesium')">Mag</button>
                        <button class="material-btn" onclick="adminApp.filterByMaterial('aluminum')">Alum</button>
                    </div>

                    <div id="shaftSubfilter" class="shaft-subfilter" style="display: none;">
                        <button class="subfilter-btn active" onclick="adminApp.filterShaftType('all')">All</button>
                        <button class="subfilter-btn" onclick="adminApp.filterShaftType('standard')">Standard</button>
                        <button class="subfilter-btn" onclick="adminApp.filterShaftType('metric')">Metric</button>
                    </div>

                    <div id="anodeGrid" class="anode-grid" style="max-height: 400px; overflow-y: auto;">
                        <!-- Anodes will be populated here -->
                    </div>
                </div>

                <div class="selected-anodes">
                    <h4>Selected Anodes: <span id="selectedCount">0</span></h4>
                    <div id="selectedAnodesList"></div>
                    <div class="anode-total">
                        <strong>Anodes Subtotal: $<span id="anodeSubtotal">0.00</span></strong>
                        <br><small>Labor: $15 per anode</small>
                    </div>
                </div>

                <div class="wizard-actions">
                    <button onclick="adminApp.closeAnodesOnlyWizard()" class="btn-secondary">← Back to Services</button>
                    <button onclick="adminApp.confirmAnodesOnlySelection()" class="btn-primary">✓ Confirm Selection</button>
                </div>
            </div>
        `;

        // Load anode catalog
        this.loadAnodeCatalog();

        // Scroll to the anode picker after a brief delay for rendering
        setTimeout(() => {
            this.scrollToAnodePicker();
        }, 100);
    }

    closeAnodesOnlyWizard() {
        // Go back to service selection
        document.getElementById('simpleServiceButtons').style.display = 'flex';
        document.getElementById('wizardContainer').style.display = 'none';
        this.currentServiceKey = null;
        window.currentServiceKey = null;
        window.selectedServiceKey = null;
        this.updateChargeSummary();
    }

    confirmAnodesOnlySelection() {
        // Store selected anodes and calculate pricing
        const selectedAnodes = this.getSelectedAnodes();

        // Set base price for anodes only service (minimum $150)
        const basePrice = 150;
        const anodesCost = selectedAnodes.totalPrice;
        const laborCost = selectedAnodes.count * 15;
        const totalPrice = Math.max(basePrice, anodesCost + laborCost);

        // Store anode details for charge summary
        this.anodeDetails = selectedAnodes;

        // Update the display price
        const displayEl = document.getElementById('totalCostDisplay');
        if (displayEl) {
            displayEl.textContent = `$${totalPrice.toFixed(2)}`;
        }

        // Keep the service selected but close the wizard
        document.getElementById('wizardContainer').style.display = 'none';
        document.getElementById('simpleServiceButtons').style.display = 'flex';

        // Update charge summary
        this.updateChargeSummary();
        alert('Anodes selected! Check the charge summary below.');
    }

    openAnodeWizard() {
        // Save current wizard state
        this.savedWizardState = document.getElementById('wizardContent').innerHTML;

        // Load anode selector interface
        document.getElementById('wizardContent').innerHTML = `
            <div class="admin-wizard">
                <h3>⚓ Select Anodes to Add</h3>

                <div class="anode-selector">
                    <div class="wizard-field">
                        <input type="text" id="anodeSearch" class="search-input"
                               placeholder="Search by size or type..."
                               oninput="adminApp.filterAnodes(this.value)">
                    </div>

                    <div class="anode-categories">
                        <button class="category-btn active" onclick="adminApp.filterByCategory('all')">All</button>
                        <button class="category-btn" onclick="adminApp.filterByCategory('shaft')">Shaft</button>
                        <button class="category-btn" onclick="adminApp.filterByCategory('propeller')">Prop</button>
                        <button class="category-btn" onclick="adminApp.filterByCategory('hull')">Hull</button>
                        <button class="category-btn" onclick="adminApp.filterByCategory('engine')">Engine</button>
                    </div>

                    <div id="materialFilter" class="material-filter">
                        <button class="material-btn active" onclick="adminApp.filterByMaterial('all')">All</button>
                        <button class="material-btn" onclick="adminApp.filterByMaterial('zinc')">Zinc</button>
                        <button class="material-btn" onclick="adminApp.filterByMaterial('magnesium')">Mag</button>
                        <button class="material-btn" onclick="adminApp.filterByMaterial('aluminum')">Alum</button>
                    </div>

                    <div id="shaftSubfilter" class="shaft-subfilter" style="display: none;">
                        <button class="subfilter-btn active" onclick="adminApp.filterShaftType('all')">All</button>
                        <button class="subfilter-btn" onclick="adminApp.filterShaftType('standard')">Standard</button>
                        <button class="subfilter-btn" onclick="adminApp.filterShaftType('metric')">Metric</button>
                    </div>

                    <div id="anodeGrid" class="anode-grid" style="max-height: 400px; overflow-y: auto;">
                        <!-- Anodes will be populated here -->
                    </div>
                </div>

                <div class="selected-anodes">
                    <h4>Selected Anodes: <span id="selectedCount">0</span></h4>
                    <div id="selectedAnodesList"></div>
                    <div class="anode-total">
                        <strong>Anodes Subtotal: $<span id="anodeSubtotal">0.00</span></strong>
                        <br><small>Labor: $15 per anode</small>
                    </div>
                </div>

                <div class="wizard-actions">
                    <button onclick="adminApp.closeAnodeWizard()" class="btn-secondary">← Back to Service</button>
                    <button onclick="adminApp.confirmAnodeSelection()" class="btn-primary">✓ Add Selected Anodes</button>
                </div>
            </div>
        `;

        // Load anode catalog
        this.loadAnodeCatalog();

        // Scroll to the anode picker after a brief delay for rendering
        setTimeout(() => {
            this.scrollToAnodePicker();
        }, 100);
    }

    scrollToAnodePicker() {
        const anodeSelector = document.querySelector('.anode-selector');
        if (anodeSelector) {
            // Calculate position to fill the screen with the anode picker
            const rect = anodeSelector.getBoundingClientRect();
            const scrollTarget = rect.top + window.pageYOffset - 10; // 10px margin from top

            window.scrollTo({
                top: scrollTarget,
                behavior: 'smooth'
            });
        }
    }

    closeAnodeWizard() {
        // Restore previous wizard state
        if (this.savedWizardState) {
            document.getElementById('wizardContent').innerHTML = this.savedWizardState;
            this.updateFromWizard();
        }
    }

    confirmAnodeSelection() {
        // Store selected anodes count and calculate pricing
        const selectedAnodes = this.getSelectedAnodes();
        document.getElementById('anodesToInstall').value = selectedAnodes.count;

        // Store anode details for charge summary
        this.anodeDetails = selectedAnodes;

        // Restore wizard and update pricing
        if (this.savedWizardState) {
            document.getElementById('wizardContent').innerHTML = this.savedWizardState;
            this.updateFromWizard();
        }
    }

    async loadAnodeCatalog() {
        try {
            // Try loading from multiple possible locations
            let response = await fetch('/full-boatzincs-catalog.json');
            if (!response.ok) {
                response = await fetch('/anode-catalog.json');
            }

            const data = await response.json();
            this.anodeCatalog = data.anodes || data;
            this.selectedAnodes = {};
            this.displayAnodes();
        } catch (error) {
            console.error('Failed to load anode catalog:', error);
            document.getElementById('anodeGrid').innerHTML = '<p>Failed to load anode catalog</p>';
        }
    }

    displayAnodes(category = 'all', searchTerm = '') {
        if (!this.anodeCatalog) return;

        const grid = document.getElementById('anodeGrid');
        let filtered = this.anodeCatalog;

        // Filter out polishing strips and free items
        filtered = filtered.filter(anode => {
            const name = (anode.name || '').toLowerCase();
            const sku = (anode.sku || '').toLowerCase();
            // Filter out polishing strips, zinc strips, and free promotional items
            return !name.includes('polishing') &&
                   !sku.includes('polishing-strip') &&
                   !sku.includes('shaft-polishing-strip') &&
                   !name.includes('free!!!') &&
                   !(name.includes('strip') && name.includes('3-foot'));
        });

        // Filter by category
        if (category !== 'all') {
            filtered = filtered.filter(anode => {
                const cat = (anode.category || '').toLowerCase();
                // Map button categories to actual catalog categories
                if (category === 'shaft') {
                    return cat.includes('shaft_anodes');
                } else if (category === 'prop' || category === 'propeller') {
                    return cat.includes('propeller');
                } else if (category === 'hull') {
                    return cat.includes('hull_anodes');
                } else if (category === 'engine') {
                    return cat.includes('engine') || cat.includes('outboard');
                } else {
                    return cat.includes(category);
                }
            });
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(anode =>
                anode.name.toLowerCase().includes(term) ||
                (anode.sku || '').toLowerCase().includes(term)
            );
        }

        // Display anodes
        grid.innerHTML = filtered.map(anode => {
            const anodeId = anode.boatzincs_id || anode.sku;
            const quantity = this.selectedAnodes[anodeId]?.quantity || 0;
            const price = typeof anode.list_price === 'string' ?
                parseFloat(anode.list_price.replace('$', '')) :
                anode.list_price;

            // Use simplified name
            const simplifiedName = this.simplifyAnodeName(anode);

            // Store anode data for button clicks
            const dataAttr = btoa(JSON.stringify({ id: anodeId, price, name: anode.name }));

            return `
                <div class="anode-item compact">
                    <div class="anode-name">${simplifiedName}</div>
                    <div class="anode-price">$${price.toFixed(2)}</div>
                    <div class="anode-controls">
                        <button data-anode="${dataAttr}" data-change="-1" onclick="adminApp.handleAnodeClick(this)">−</button>
                        <span class="quantity">${quantity}</span>
                        <button data-anode="${dataAttr}" data-change="1" onclick="adminApp.handleAnodeClick(this)">+</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    filterAnodes(searchTerm) {
        const activeCategory = document.querySelector('.category-btn.active')?.textContent.toLowerCase() || 'all';
        this.displayAnodes(activeCategory, searchTerm);
    }

    simplifyAnodeName(anode) {
        let name = anode.name || '';

        // Remove brand names
        name = name.replace(/Camp |Martyr |Performance Metals |Tecnoseal |Reliance /gi, '');

        // Remove model numbers like X-3A, X-2, etc.
        name = name.replace(/\bX-\d+[A-Z]?\b/gi, '');

        // Remove the word "Anode" and "Zinc"
        name = name.replace(/\bAnode\b|\bZinc\b/gi, '');

        // Clean up shaft descriptions
        name = name.replace(/Shaft\s+(-\s+)?/gi, 'Shaft ');

        // Clean up extra spaces and dashes
        name = name.replace(/\s+/g, ' ').replace(/\s+-\s+/g, ' ').trim();
        name = name.replace(/^-\s*/, '').replace(/\s*-$/, '');

        // Capitalize first letter
        if (name.length > 0) {
            name = name.charAt(0).toUpperCase() + name.slice(1);
        }

        return name;
    }

    filterByMaterial(material) {
        this.currentMaterial = material;

        // Update button states
        document.querySelectorAll('.material-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase().includes(material) ||
                (material === 'all' && btn.textContent === 'All')) {
                btn.classList.add('active');
            }
        });

        // Re-display anodes with material filter applied
        const searchTerm = document.getElementById('anodeSearch')?.value || '';
        this.displayAnodes(this.currentCategory || 'all', searchTerm);
    }

    filterByCategory(category) {
        // Update active button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase().includes(category.toLowerCase()) ||
                (category === 'all' && btn.textContent === 'All') ||
                (category === 'engine' && btn.textContent.includes('Engine'))) {
                btn.classList.add('active');
            }
        });

        // Show/hide shaft subfilter
        const shaftSubfilter = document.getElementById('shaftSubfilter');
        if (shaftSubfilter) {
            if (category === 'shaft') {
                shaftSubfilter.style.display = 'flex';
                // Reset shaft subfilter to "All Shaft"
                document.querySelectorAll('.subfilter-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.textContent.includes('All Shaft')) {
                        btn.classList.add('active');
                    }
                });
            } else {
                shaftSubfilter.style.display = 'none';
            }
        }

        // Store current category for shaft subfiltering
        this.currentCategory = category;

        const searchTerm = document.getElementById('anodeSearch')?.value || '';
        this.displayAnodes(category, searchTerm);
    }

    filterShaftType(type) {
        // Update active subfilter button
        document.querySelectorAll('.subfilter-btn').forEach(btn => {
            btn.classList.remove('active');
            if ((type === 'all' && btn.textContent.includes('All')) ||
                (type === 'standard' && btn.textContent.includes('Standard')) ||
                (type === 'metric' && btn.textContent.includes('Metric'))) {
                btn.classList.add('active');
            }
        });

        // Filter anodes based on shaft type
        const searchTerm = document.getElementById('anodeSearch')?.value || '';

        if (type === 'all') {
            this.displayAnodes('shaft', searchTerm);
        } else {
            // Custom filtering for standard vs metric
            this.displayAnodesWithShaftType(type, searchTerm);
        }
    }

    displayAnodesWithShaftType(shaftType, searchTerm = '') {
        if (!this.anodeCatalog) return;

        const grid = document.getElementById('anodeGrid');
        let filtered = this.anodeCatalog;

        // Filter out polishing strips and free items
        filtered = filtered.filter(anode => {
            const name = (anode.name || '').toLowerCase();
            const sku = (anode.sku || '').toLowerCase();
            // Filter out polishing strips, zinc strips, and free promotional items
            return !name.includes('polishing') &&
                   !sku.includes('polishing-strip') &&
                   !sku.includes('shaft-polishing-strip') &&
                   !name.includes('free!!!') &&
                   !(name.includes('strip') && name.includes('3-foot'));
        });

        // Filter by shaft category first
        filtered = filtered.filter(anode => {
            const cat = (anode.category || '').toLowerCase();
            return cat.includes('shaft');
        });

        // Then filter by standard (inch) vs metric (mm)
        filtered = filtered.filter(anode => {
            const name = anode.name || '';
            const desc = anode.description || '';
            const combined = (name + ' ' + desc).toLowerCase();

            if (shaftType === 'standard') {
                // Standard sizes use inches (fractions or decimals with ")
                return combined.match(/\d+\/\d+"|[\d.]+"\s|inch/i) &&
                       !combined.match(/\d+mm|metric/i);
            } else if (shaftType === 'metric') {
                // Metric sizes use mm
                return combined.match(/\d+mm|metric/i) &&
                       !combined.match(/\d+\/\d+"|[\d.]+"\s/);
            }
            return false;
        });

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(anode =>
                anode.name.toLowerCase().includes(term) ||
                (anode.sku || '').toLowerCase().includes(term)
            );
        }

        // Display anodes
        grid.innerHTML = filtered.map(anode => {
            const anodeId = anode.boatzincs_id || anode.sku;
            const quantity = this.selectedAnodes[anodeId]?.quantity || 0;
            const price = typeof anode.list_price === 'string' ?
                parseFloat(anode.list_price.replace('$', '')) :
                anode.list_price;

            // Use simplified name
            const simplifiedName = this.simplifyAnodeName(anode);

            // Store anode data for button clicks
            const dataAttr = btoa(JSON.stringify({ id: anodeId, price, name: anode.name }));

            return `
                <div class="anode-item compact">
                    <div class="anode-name">${simplifiedName}</div>
                    <div class="anode-price">$${price.toFixed(2)}</div>
                    <div class="anode-controls">
                        <button data-anode="${dataAttr}" data-change="-1" onclick="adminApp.handleAnodeClick(this)">−</button>
                        <span class="quantity">${quantity}</span>
                        <button data-anode="${dataAttr}" data-change="1" onclick="adminApp.handleAnodeClick(this)">+</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    handleAnodeClick(button) {
        const anodeData = JSON.parse(atob(button.dataset.anode));
        const change = parseInt(button.dataset.change);
        this.updateAnodeQuantity(anodeData.id, change, anodeData.price, anodeData.name);
    }

    updateAnodeQuantity(sku, change, price, name) {
        if (!this.selectedAnodes) {
            this.selectedAnodes = {};
        }

        if (!this.selectedAnodes[sku]) {
            this.selectedAnodes[sku] = { quantity: 0, price, name };
        }

        this.selectedAnodes[sku].quantity = Math.max(0, this.selectedAnodes[sku].quantity + change);

        if (this.selectedAnodes[sku].quantity === 0) {
            delete this.selectedAnodes[sku];
        }

        // Update display
        this.updateAnodeSelection();

        // Refresh the current view
        const searchTerm = document.getElementById('anodeSearch')?.value || '';
        const activeCategory = document.querySelector('.category-btn.active')?.textContent.toLowerCase() || 'all';

        // Check if we're in shaft subfilter mode
        const shaftSubfilter = document.getElementById('shaftSubfilter');
        if (shaftSubfilter && shaftSubfilter.style.display !== 'none') {
            const activeSubfilter = document.querySelector('.subfilter-btn.active');
            if (activeSubfilter) {
                const subfilterText = activeSubfilter.textContent.toLowerCase();
                if (subfilterText.includes('standard')) {
                    this.displayAnodesWithShaftType('standard', searchTerm);
                } else if (subfilterText.includes('metric')) {
                    this.displayAnodesWithShaftType('metric', searchTerm);
                } else {
                    this.displayAnodes('shaft', searchTerm);
                }
            } else {
                this.displayAnodes(activeCategory, searchTerm);
            }
        } else {
            this.displayAnodes(activeCategory, searchTerm);
        }
    }

    updateAnodeSelection() {
        const list = document.getElementById('selectedAnodesList');
        const countEl = document.getElementById('selectedCount');
        const subtotalEl = document.getElementById('anodeSubtotal');

        // If elements don't exist, we're not in anode selection mode
        if (!list || !countEl || !subtotalEl) return;

        let totalCount = 0;
        let totalPrice = 0;

        const items = Object.entries(this.selectedAnodes || {}).filter(([_, data]) => data.quantity > 0);

        if (items.length === 0) {
            list.innerHTML = '<div style="color: #999;">No anodes selected</div>';
        } else {
            list.innerHTML = items.map(([sku, data]) => {
                totalCount += data.quantity;
                totalPrice += data.quantity * data.price;
                return `
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                        <span>${data.quantity}× ${data.name}</span>
                        <span>$${(data.quantity * data.price).toFixed(2)}</span>
                    </div>
                `;
            }).join('');
        }

        countEl.textContent = totalCount;
        subtotalEl.textContent = totalPrice.toFixed(2);

        // Update charge summary if in service mode
        if (this.currentServiceKey) {
            this.updateChargeSummary();
        }
    }

    getSelectedAnodes() {
        let totalCount = 0;
        let totalPrice = 0;
        const items = [];

        Object.entries(this.selectedAnodes || {}).forEach(([sku, data]) => {
            if (data.quantity > 0) {
                totalCount += data.quantity;
                totalPrice += data.quantity * data.price;
                items.push({
                    sku,
                    name: data.name,
                    quantity: data.quantity,
                    price: data.price,
                    subtotal: data.quantity * data.price
                });
            }
        });

        return {
            count: totalCount,
            totalPrice,
            items
        };
    }

    confirmWizardSelection() {
        // Wizard selection confirmed, keep the service selected
        this.calculateAdminPrice();
        this.updateChargeSummary();
        alert('Price calculated! Check the charge summary below.');
    }

    // Customer Management
    async loadRecentCustomers() {
        const listEl = document.getElementById('customerList');
        listEl.innerHTML = '<div class="no-customers">Loading customers...</div>';

        try {
            const response = await fetch('http://localhost:3001/api/stripe-customers?limit=10');
            const data = await response.json();
            this.customers = data.customers || [];
            this.displayCustomers();
        } catch (error) {
            console.error('Error loading customers:', error);
            listEl.innerHTML = '<div class="no-customers">Error loading customers</div>';
        }
    }

    async searchCustomers() {
        const query = document.getElementById('customerSearch').value.trim();
        if (!query) {
            this.loadRecentCustomers();
            return;
        }

        const listEl = document.getElementById('customerList');
        listEl.innerHTML = '<div class="no-customers">Searching...</div>';

        try {
            const response = await fetch(`http://localhost:3001/api/stripe-customers?search=${encodeURIComponent(query)}`);
            const data = await response.json();
            this.customers = data.customers || [];
            this.displayCustomers();
        } catch (error) {
            console.error('Error searching customers:', error);
            listEl.innerHTML = '<div class="no-customers">Error searching</div>';
        }
    }

    displayCustomers() {
        const listEl = document.getElementById('customerList');

        if (!this.customers || this.customers.length === 0) {
            listEl.innerHTML = '<div class="no-customers">No customers found</div>';
            return;
        }

        listEl.innerHTML = this.customers.map(customer => `
            <div class="customer-item" onclick="adminApp.selectCustomer('${customer.id}')">
                <div class="customer-name">${customer.name || 'Unnamed Customer'}</div>
                <div class="customer-email">${customer.email}</div>
                <span class="customer-payment ${customer.payment_method ? 'has-card' : 'no-card'}">
                    ${customer.payment_method ? '✓ Card on file' : 'No card on file'}
                </span>
            </div>
        `).join('');
    }

    selectCustomer(customerId) {
        this.selectedCustomer = this.customers.find(c => c.id === customerId);

        if (!this.selectedCustomer) return;

        // Update UI
        document.querySelectorAll('.customer-item').forEach(el => {
            el.classList.remove('selected');
        });

        const selectedEl = document.querySelector(`[onclick*="${customerId}"]`);
        if (selectedEl) {
            selectedEl.classList.add('selected');
        }

        // Show selected customer info
        const selectedDisplay = document.getElementById('selectedCustomer');
        selectedDisplay.innerHTML = `
            <div class="selected-info">
                Selected: ${this.selectedCustomer.name || 'Unnamed'} (${this.selectedCustomer.email})
                ${this.selectedCustomer.payment_method ?
                    ' - Card ending in ' + this.selectedCustomer.payment_method.card.last4 :
                    ' - No card on file'}
            </div>
        `;

        this.updateChargeSummary();
    }

    // Charge Summary
    updateChargeSummary() {
        // For wizard services, delegate to updateWizardPricing for detailed summary
        if (window.updateWizardPricing &&
            (this.currentServiceKey === 'recurring_cleaning' ||
             this.currentServiceKey === 'onetime_cleaning' ||
             this.currentServiceKey === 'anodes_only')) {
            window.updateWizardPricing();
            return;
        }

        const chargeDetails = document.getElementById('chargeDetails');
        const chargeButton = document.getElementById('chargeButton');

        // Get service info
        const service = window.serviceData && this.currentServiceKey ?
            window.serviceData[this.currentServiceKey] : null;
        const serviceName = service?.name || '';

        // Get price - try both totalCostDisplay and totalCost
        const totalElement = document.getElementById('totalCostDisplay') || document.getElementById('totalCost');
        let price = 0;
        if (totalElement) {
            // For input elements, check value first, then textContent
            const priceText = totalElement.value || totalElement.textContent || '0';
            price = parseFloat(priceText.replace('$', '').replace(',', '')) || 0;
        }

        // If price is still 0 and we have a flat rate service, get the rate directly
        if (price === 0 && service) {
            if (service.type === 'flat' && service.rate) {
                price = service.rate;
            }
        }

        // Update charge details - preserve chargeSummaryContent div
        if (this.currentServiceKey) {
            // Find or create chargeSummaryContent
            let summaryContent = document.getElementById('chargeSummaryContent');
            if (!summaryContent) {
                summaryContent = document.createElement('div');
                summaryContent.id = 'chargeSummaryContent';
                chargeDetails.innerHTML = '';
                chargeDetails.appendChild(summaryContent);
            }

            let detailsHTML = `
                <div class="charge-detail-row">
                    <span>Service:</span>
                    <span>${serviceName || this.currentServiceKey}</span>
                </div>`;

            // Add surcharge details if available
            if (this.surchargeDetails && service?.type === 'per_foot') {
                // Get boat length and rate
                const boatLength = parseFloat(document.getElementById('boatLength')?.value) || 30;
                const rate = service.rate || 0;

                detailsHTML += `
                <div class="charge-detail-row" style="font-size: 12px; color: #666;">
                    <span>Calculation:</span>
                    <span>${boatLength}ft × $${rate.toFixed(2)}/ft = $${this.surchargeDetails.base.toFixed(2)}</span>
                </div>`;

                // Show active surcharges
                const surcharges = [];
                if (this.surchargeDetails.hull > 0) {
                    const hullType = this.surchargeDetails.hull === 25 ? 'Catamaran' : 'Trimaran';
                    surcharges.push(`${hullType} +${this.surchargeDetails.hull}%`);
                }
                // Paint condition no longer adds surcharge
                if (this.surchargeDetails.growth > 0) {
                    const growthLabel = document.getElementById('growthLabel')?.textContent || 'Growth';
                    surcharges.push(`${growthLabel} growth +${this.surchargeDetails.growth.toFixed(0)}%`);
                }
                if (this.surchargeDetails.powerboat > 0) {
                    surcharges.push(`Powerboat +${this.surchargeDetails.powerboat}%`);
                }
                if (this.surchargeDetails.engines > 0) {
                    surcharges.push(`Twin engines +${this.surchargeDetails.engines}%`);
                }

                if (surcharges.length > 0) {
                    detailsHTML += `
                <div class="charge-detail-row" style="font-size: 12px; color: #666;">
                    <span>Surcharges:</span>
                    <span>${surcharges.join(', ')}</span>
                </div>`;
                }

                // Show paint condition (for service logs, no charge)
                if (this.currentServiceKey.includes('cleaning')) {
                    const paintCondition = document.getElementById('actualPaintCondition')?.value || 'excellent';
                    const paintLabel = paintCondition.charAt(0).toUpperCase() + paintCondition.slice(1);
                    detailsHTML += `
                <div class="charge-detail-row" style="font-size: 12px; color: #666;">
                    <span>Paint Condition:</span>
                    <span>${paintLabel}</span>
                </div>`;
                }
            }

            // Add anode details if any are selected
            if (this.anodeDetails && this.anodeDetails.count > 0) {
                // Show individual anode types
                if (this.anodeDetails.items && this.anodeDetails.items.length > 0) {
                    this.anodeDetails.items.forEach(item => {
                        detailsHTML += `
                        <div class="charge-detail-row" style="font-size: 11px; color: #666; padding-left: 10px;">
                            <span>${item.quantity}× ${item.name}</span>
                            <span>$${item.subtotal.toFixed(2)}</span>
                        </div>`;
                    });
                }

                detailsHTML += `
                <div class="charge-detail-row" style="font-size: 12px; color: #666;">
                    <span><strong>Anodes Subtotal (${this.anodeDetails.count} items):</strong></span>
                    <span><strong>$${this.anodeDetails.totalPrice.toFixed(2)}</strong></span>
                </div>`;

                // Add labor for anode installation (15 per anode)
                const laborCost = this.anodeDetails.count * 15;
                detailsHTML += `
                <div class="charge-detail-row" style="font-size: 12px; color: #666;">
                    <span>Anode Labor (${this.anodeDetails.count} × $15):</span>
                    <span>$${laborCost.toFixed(2)}</span>
                </div>`;

                // Update total price to include anodes
                price += this.anodeDetails.totalPrice + laborCost;
            }

            // Add propeller service details if applicable
            if (this.propellerDetails && this.currentServiceKey === 'propeller_service') {
                const details = this.propellerDetails;
                detailsHTML += `
                <div class="charge-detail-row" style="font-size: 12px; color: #666;">
                    <span>Propellers:</span>
                    <span>${details.count}</span>
                </div>`;

                if (details.removal) {
                    detailsHTML += `
                    <div class="charge-detail-row" style="font-size: 12px; color: #666;">
                        <span>Removal (${details.count} × $349):</span>
                        <span>$${(details.count * 349).toFixed(2)}</span>
                    </div>`;
                }

                if (details.install) {
                    detailsHTML += `
                    <div class="charge-detail-row" style="font-size: 12px; color: #666;">
                        <span>Installation (${details.count} × $349):</span>
                        <span>$${(details.count * 349).toFixed(2)}</span>
                    </div>`;
                }

                price = details.price;
            }

            detailsHTML += `
                <div class="charge-detail-row">
                    <span>Total Price:</span>
                    <span style="font-weight: 600; color: #345475;">$${price.toFixed(2)}</span>
                </div>`;

            if (this.selectedCustomer) {
                detailsHTML += `
                <div class="charge-detail-row">
                    <span>Customer:</span>
                    <span>${this.selectedCustomer.name || this.selectedCustomer.email}</span>
                </div>`;
                if (this.selectedCustomer.payment_method) {
                    detailsHTML += `
                <div class="charge-detail-row">
                    <span>Payment:</span>
                    <span>Card ending in ${this.selectedCustomer.payment_method.card.last4}</span>
                </div>`;
                } else {
                    detailsHTML += `
                <div class="charge-detail-row">
                    <span>Payment:</span>
                    <span style="color: #e74c3c;">No card on file</span>
                </div>`;
                }
            } else {
                detailsHTML += `
                <div class="charge-detail-row">
                    <span>Customer:</span>
                    <span style="color: #999;">Not selected (will prompt)</span>
                </div>`;
            }

            detailsHTML += `
                <div class="charge-detail-row" style="border-top: 2px solid #345475; padding-top: 10px; margin-top: 10px;">
                    <span><strong>Amount to Charge:</strong></span>
                    <span><strong>$${price.toFixed(2)}</strong></span>
                </div>`;

            // Don't overwrite the chargeSummaryContent div - write to it instead
            summaryContent.innerHTML = detailsHTML;
        } else {
            // Clear charge details when no service
            let summaryContent = document.getElementById('chargeSummaryContent');
            if (!summaryContent) {
                summaryContent = document.createElement('div');
                summaryContent.id = 'chargeSummaryContent';
                chargeDetails.innerHTML = '';
                chargeDetails.appendChild(summaryContent);
            }
            summaryContent.innerHTML = '<div style="text-align: center; color: #7f8c8d;">Select a customer and configure service details</div>';
        }

        // Keep button enabled - it will open customer dialog if needed
        chargeButton.disabled = false;

        // Update button text
        if (price > 0) {
            chargeButton.textContent = `💳 Charge $${price.toFixed(2)}`;
        } else {
            chargeButton.textContent = `💳 Charge Customer`;
        }
    }

    // Charging
    async chargeCustomer() {
        // Check if service is configured
        if (!this.currentServiceKey) {
            alert('Please select a service first');
            return;
        }

        // First, check if we have customer info from the wizard
        const wizardName = document.getElementById('wizardCustomerName')?.value;
        const wizardEmail = document.getElementById('wizardCustomerEmail')?.value;
        const wizardPhone = document.getElementById('wizardCustomerPhone')?.value;

        // If we have wizard customer data, use that
        if (wizardName || wizardEmail) {
            // Check if we have a selected customer from the autocomplete
            if (window.selectedWizardCustomer) {
                this.selectedCustomer = window.selectedWizardCustomer;
            } else if (wizardName && wizardEmail) {
                // We have manual customer info - we'll need to create or find this customer
                // For now, show the modal with this info pre-filled
                this.openCustomerModalWithData({
                    name: wizardName,
                    email: wizardEmail,
                    phone: wizardPhone
                });
                return;
            } else {
                // Missing required info - show modal to complete it
                this.openCustomerModalWithData({
                    name: wizardName,
                    email: wizardEmail,
                    phone: wizardPhone
                });
                return;
            }
        }

        // If no customer selected and no wizard data, show modal
        if (!this.selectedCustomer) {
            this.openCustomerModal();
            return;
        }

        // If customer has no payment method
        if (!this.selectedCustomer.payment_method) {
            if (confirm('This customer needs a payment method. Would you like to add one now?')) {
                this.showPaymentMethodForm(this.selectedCustomer.stripe_customer_id);
            }
            return;
        }

        // Proceed with charge
        const button = document.getElementById('chargeButton');
        button.disabled = true;
        button.textContent = 'Processing...';

        try {
            // Get price
            const totalElement = document.getElementById('totalCostDisplay');
            const price = totalElement ?
                parseFloat(totalElement.textContent.replace('$', '').replace(',', '')) : 0;

            const response = await fetch('http://localhost:3001/api/charge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: this.selectedCustomer.stripe_customer_id,
                    amount: Math.round(price * 100),
                    description: `Service: ${this.currentServiceKey}`,
                    metadata: {
                        service_key: this.currentServiceKey,
                        service_date: new Date().toISOString()
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                alert(`✅ Payment successful! Charge ID: ${result.chargeId}`);
                // Reset
                this.selectedCustomer = null;
                this.currentServiceKey = null;
                window.currentServiceKey = null;
                this.updateChargeSummary();
            } else {
                alert(`❌ Payment failed: ${result.error}`);
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            alert('Failed to process payment');
        } finally {
            button.disabled = false;
            button.textContent = '💳 Charge Customer';
        }
    }

    // Customer Selection Modal
    openCustomerModal() {
        const modal = document.getElementById('customerSelectionModal');
        if (modal) {
            modal.style.display = 'block';
            // Clear fields when opening fresh
            document.getElementById('modalCustomerName').value = '';
            document.getElementById('modalCustomerEmail').value = '';
            document.getElementById('modalCustomerPhone').value = '';
            document.getElementById('modalBoatName').value = '';
            document.getElementById('modalBoatLength').value = '';
            document.getElementById('modalBoatMake').value = '';
            document.getElementById('modalBoatModel').value = '';
        }
    }

    openCustomerModalWithData(customerData) {
        const modal = document.getElementById('customerSelectionModal');
        if (modal) {
            modal.style.display = 'block';
            // Pre-fill with provided data
            if (customerData.name) document.getElementById('modalCustomerName').value = customerData.name;
            if (customerData.email) document.getElementById('modalCustomerEmail').value = customerData.email;
            if (customerData.phone) document.getElementById('modalCustomerPhone').value = customerData.phone;

            // Also try to get boat info from wizard if available
            const boatLength = document.getElementById('wizardBoatLength')?.value || document.getElementById('boat_length')?.value;
            const boatName = document.getElementById('wizardBoatName')?.value || document.getElementById('boat_name')?.value;
            const boatMake = document.getElementById('wizardBoatMake')?.value || document.getElementById('boat_make')?.value;
            const boatModel = document.getElementById('wizardBoatModel')?.value || document.getElementById('boat_model')?.value;

            if (boatLength) document.getElementById('modalBoatLength').value = boatLength;
            if (boatName) document.getElementById('modalBoatName').value = boatName;
            if (boatMake) document.getElementById('modalBoatMake').value = boatMake;
            if (boatModel) document.getElementById('modalBoatModel').value = boatModel;
        }
    }

    closeCustomerModal() {
        const modal = document.getElementById('customerSelectionModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async confirmCustomerInfo() {
        const name = document.getElementById('modalCustomerName').value;
        const email = document.getElementById('modalCustomerEmail').value;
        const phone = document.getElementById('modalCustomerPhone').value;
        const boatName = document.getElementById('modalBoatName').value;
        const boatLength = document.getElementById('modalBoatLength').value;
        const boatMake = document.getElementById('modalBoatMake').value;
        const boatModel = document.getElementById('modalBoatModel').value;

        if (!name || !email) {
            alert('Please provide at least name and email');
            return;
        }

        // Check if this is an existing customer selected from search
        if (window.modalSelectedCustomer) {
            this.selectedCustomer = window.modalSelectedCustomer;
            this.closeCustomerModal();
            // Continue with charge
            this.chargeCustomer();
            return;
        }

        // Otherwise, we need to create or find this customer
        try {
            // First, try to find customer by email
            const searchResponse = await fetch(`http://localhost:3001/api/stripe-customers?search=${encodeURIComponent(email)}`);
            const customers = await searchResponse.json();

            let customer = customers.find(c => c.email === email);

            if (!customer) {
                // Create new customer
                const createResponse = await fetch('http://localhost:3001/api/stripe-customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        boat_name: boatName,
                        boat_length: boatLength ? parseInt(boatLength) : null,
                        boat_make: boatMake,
                        boat_model: boatModel
                    })
                });

                customer = await createResponse.json();
            }

            if (customer) {
                this.selectedCustomer = customer;

                // Update wizard fields with customer data
                if (document.getElementById('wizardCustomerName')) {
                    document.getElementById('wizardCustomerName').value = customer.name || '';
                    document.getElementById('wizardCustomerEmail').value = customer.email || '';
                    document.getElementById('wizardCustomerPhone').value = customer.phone || '';
                    window.selectedWizardCustomer = customer;
                }

                this.closeCustomerModal();

                // Check if customer needs payment method
                if (!customer.payment_method) {
                    if (confirm('This customer needs a payment method. Would you like to add one now?')) {
                        this.showPaymentMethodForm(customer.stripe_customer_id);
                    }
                } else {
                    // Continue with charge
                    this.chargeCustomer();
                }
            }
        } catch (error) {
            console.error('Error processing customer info:', error);
            alert('Error processing customer information');
        }
    }

    selectModalCustomer(customerId) {
        this.modalSelectedCustomerId = customerId;
        // Highlight selected
        document.querySelectorAll('#modalCustomerList .customer-item').forEach(el => {
            el.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
    }

    filterModalCustomers(searchTerm) {
        const items = document.querySelectorAll('#modalCustomerList .customer-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm.toLowerCase()) ? 'block' : 'none';
        });
    }

    showTab(tab) {
        const existingTab = document.getElementById('existingCustomerTab');
        const manualTab = document.getElementById('manualEntryTab');
        const buttons = document.querySelectorAll('.tab-button');

        if (tab === 'existing') {
            existingTab.style.display = 'block';
            manualTab.style.display = 'none';
            buttons[0].classList.add('active');
            buttons[1].classList.remove('active');
        } else {
            existingTab.style.display = 'none';
            manualTab.style.display = 'block';
            buttons[0].classList.remove('active');
            buttons[1].classList.add('active');
        }
    }

    async proceedWithSelectedCustomer() {
        if (!this.modalSelectedCustomerId) {
            alert('Please select a customer');
            return;
        }

        this.selectedCustomer = this.customers.find(c => c.id === this.modalSelectedCustomerId);
        if (!this.selectedCustomer) {
            alert('Customer not found');
            return;
        }

        // Check payment method
        if (!this.selectedCustomer.payment_method) {
            if (confirm('This customer has no payment method on file. Add one now?')) {
                // Would open payment method form
                alert('Payment method form would open here');
                return;
            } else {
                return;
            }
        }

        this.closeCustomerModal();
        this.updateChargeSummary();
        // Try charging again
        this.chargeCustomer();
    }

    async proceedWithManualCustomer() {
        const name = document.getElementById('manualCustomerName')?.value;
        const email = document.getElementById('manualCustomerEmail')?.value;
        const phone = document.getElementById('manualCustomerPhone')?.value;
        const boatName = document.getElementById('manualBoatName')?.value;

        if (!name || !email) {
            alert('Please enter at least name and email');
            return;
        }

        // In production, would create customer via API
        alert(`Would create customer: ${name} (${email})`);

        // For demo, create temp customer
        const tempCustomer = {
            id: 'temp_' + Date.now(),
            name: name,
            email: email,
            phone: phone,
            boat_name: boatName
        };

        this.customers.push(tempCustomer);
        this.selectedCustomer = tempCustomer;
        this.closeCustomerModal();
        this.updateChargeSummary();
    }

    // Quote Generation Functions
    generateQuote() {
        console.log('Generate quote clicked');

        // Check if we have pricing data
        const totalCost = this.calculateTotalCost();
        if (!totalCost || totalCost <= 0) {
            alert('Please select a service and configure options first');
            return;
        }

        // Check if we have a customer selected
        if (this.selectedCustomer) {
            // We have customer info, proceed directly to quote generation
            this.proceedWithQuote();
        } else {
            // Show modal to collect customer information
            this.openQuoteModal();
        }
    }

    openQuoteModal() {
        const modal = document.getElementById('quoteCustomerModal');
        if (!modal) {
            console.error('Quote modal not found');
            return;
        }

        // Clear previous values
        document.getElementById('quoteCustName').value = '';
        document.getElementById('quoteCustEmail').value = '';
        document.getElementById('quoteCustPhone').value = '';
        document.getElementById('quoteBoatName').value = '';
        document.getElementById('quoteBoatMake').value = '';
        document.getElementById('quoteMarina').value = '';
        document.getElementById('quoteSlip').value = '';
        document.getElementById('quoteSendEmail').checked = true;
        document.getElementById('quoteGeneratePDF').checked = true;
        document.getElementById('quoteValidDays').value = '30';

        // Show modal
        modal.style.display = 'block';
    }

    closeQuoteModal() {
        const modal = document.getElementById('quoteCustomerModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async proceedWithQuote() {
        console.log('Proceeding with quote generation');

        // Gather customer info from modal or existing customer
        let customerInfo;

        if (this.selectedCustomer) {
            // Use existing customer info
            customerInfo = {
                name: this.selectedCustomer.name,
                email: this.selectedCustomer.email,
                phone: this.selectedCustomer.phone,
                boatName: this.selectedCustomer.boat_name || '',
                boatMake: this.selectedCustomer.boat_make || '',
                marina: this.selectedCustomer.marina || '',
                slip: this.selectedCustomer.slip || ''
            };
        } else {
            // Get info from modal
            const name = document.getElementById('quoteCustName')?.value;
            const email = document.getElementById('quoteCustEmail')?.value;
            const phone = document.getElementById('quoteCustPhone')?.value;
            const boatName = document.getElementById('quoteBoatName')?.value;
            const boatMake = document.getElementById('quoteBoatMake')?.value;
            const marina = document.getElementById('quoteMarina')?.value;
            const slip = document.getElementById('quoteSlip')?.value;

            // Validate required fields
            if (!name || !email || !phone || !boatName) {
                alert('Please fill in all required fields');
                return;
            }

            customerInfo = {
                name, email, phone, boatName, boatMake, marina, slip
            };
        }

        // Get quote options
        const sendEmail = document.getElementById('quoteSendEmail')?.checked ?? true;
        const generatePDF = document.getElementById('quoteGeneratePDF')?.checked ?? true;
        const validDays = parseInt(document.getElementById('quoteValidDays')?.value || '30');

        // Generate quote number
        const quoteNumber = this.generateQuoteNumber();
        const quoteDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + validDays);

        // Build quote data
        const quoteData = {
            quoteNumber,
            quoteDate: quoteDate.toISOString(),
            expiryDate: expiryDate.toISOString(),
            validDays,
            customer: customerInfo,
            service: this.buildServiceDetails(),
            anodes: this.buildAnodeDetails(),
            pricing: this.buildPricingDetails(),
            options: {
                sendEmail,
                generatePDF
            }
        };

        console.log('Quote data prepared:', quoteData);

        // Close modal if open
        this.closeQuoteModal();

        // Show loading indicator
        const resultDiv = document.getElementById('chargeResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="success-result">
                    <h3>📋 Generating Quote #${quoteNumber}...</h3>
                    <div class="loading-spinner"></div>
                </div>
            `;
            resultDiv.style.display = 'block';
        }

        try {
            // Try to save quote to Supabase
            let quoteSaved = false;
            let onlineUrl = `${window.location.origin}/quote/${quoteNumber}`;

            try {
                const saveResponse = await fetch('/api/quotes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(quoteData)
                });

                if (saveResponse.ok) {
                    const saveResult = await saveResponse.json();
                    console.log('Quote saved to database:', saveResult);
                    quoteSaved = true;
                } else {
                    console.warn('Could not save to database, continuing without persistence');
                }
            } catch (dbError) {
                console.warn('Database not available, continuing without persistence:', dbError);
            }

            // Show success message
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="success-result">
                        <h3>✅ Quote Generated Successfully!</h3>
                        <div class="quote-details">
                            <p><strong>Quote Number:</strong> ${quoteNumber}</p>
                            <p><strong>Customer:</strong> ${customerInfo.name}</p>
                            <p><strong>Boat:</strong> ${customerInfo.boatName}</p>
                            <p><strong>Total:</strong> $${this.calculateTotalCost().toFixed(2)}</p>
                            <p><strong>Valid Until:</strong> ${expiryDate.toLocaleDateString()}</p>
                            ${generatePDF ? `<p>📄 PDF available for download</p>` : ''}
                            ${quoteSaved ? `<p>✅ Quote saved to database</p>` : `<p>⚠️ Quote generated locally (database unavailable)</p>`}
                            ${quoteSaved ? `<p><strong>Online Quote:</strong> <a href="${onlineUrl}" target="_blank">${onlineUrl}</a></p>` : ''}
                        </div>
                        <div class="quote-actions">
                            ${generatePDF ? `<button onclick="adminApp.downloadQuotePDF('${quoteNumber}')" class="btn-primary">📥 Download PDF</button>` : ''}
                            ${quoteSaved ? `<button onclick="adminApp.viewQuoteOnline('${quoteNumber}')" class="btn-secondary">🌐 View Online</button>` : ''}
                            <button onclick="adminApp.createNewQuote()" class="btn-secondary">📋 New Quote</button>
                        </div>
                    </div>
                `;
            }

            // Store quote data for later use
            this.lastQuote = quoteData;

        } catch (error) {
            console.error('Error generating quote:', error);
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="error-result">
                        <h3>❌ Error Generating Quote</h3>
                        <p>${error.message || 'An unexpected error occurred'}</p>
                        <button onclick="adminApp.generateQuote()" class="btn-primary">Try Again</button>
                    </div>
                `;
            }
        }
    }

    generateQuoteNumber() {
        // Generate quote number: QT-YYYYMMDD-XXXX
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        return `QT-${year}${month}${day}-${random}`;
    }

    buildServiceDetails() {
        const service = window.serviceData[this.currentServiceKey];
        if (!service) return null;

        const boatLength = parseFloat(document.getElementById('boatLength')?.value || 0);
        const paintCondition = document.getElementById('actualPaintCondition')?.value || '';
        const growthLevel = document.getElementById('actualGrowthLevel')?.value || '';
        const hasEngines = document.getElementById('has_twin_engines')?.value === 'true';

        return {
            type: this.currentServiceKey,
            name: service.name,
            boatLength,
            paintCondition,
            growthLevel,
            hasTwinEngines: hasEngines,
            additionalHulls: parseInt(document.getElementById('additionalHulls')?.value || 0)
        };
    }

    buildAnodeDetails() {
        const anodeList = [];

        for (const [sku, quantity] of Object.entries(this.selectedAnodes)) {
            if (quantity > 0 && this.anodeDetails && this.anodeDetails[sku]) {
                const anode = this.anodeDetails[sku];
                anodeList.push({
                    sku,
                    name: anode.name,
                    quantity,
                    unitPrice: anode.price,
                    totalPrice: quantity * anode.price
                });
            }
        }

        return anodeList;
    }

    buildPricingDetails() {
        const totalCost = this.calculateTotalCost();
        const service = window.serviceData[this.currentServiceKey];
        const boatLength = parseFloat(document.getElementById('boatLength')?.value || 0);
        const baseRate = service?.pricing?.base || 0;
        const basePrice = boatLength * baseRate;

        // Calculate anode costs
        let anodeCost = 0;
        let anodeLaborCost = 0;
        for (const [sku, quantity] of Object.entries(this.selectedAnodes)) {
            if (quantity > 0 && this.anodeDetails && this.anodeDetails[sku]) {
                anodeCost += quantity * this.anodeDetails[sku].price;
                anodeLaborCost += quantity * 15; // $15 per anode labor
            }
        }

        return {
            basePrice,
            boatLength,
            ratePerFoot: baseRate,
            anodeCost,
            anodeLaborCost,
            totalCost,
            currency: 'USD'
        };
    }


    generatePDF(quoteData) {
        const doc = new window.jspdf.jsPDF();

        // Company header
        doc.setFontSize(24);
        doc.setTextColor(41, 98, 255);
        doc.text('SAILOR SKILLS', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Professional Underwater Services', 105, 27, { align: 'center' });

        // Quote header
        doc.setFontSize(18);
        doc.setTextColor(0);
        doc.text('SERVICE QUOTE', 105, 40, { align: 'center' });

        // Quote number and date
        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.text(`Quote #: ${quoteData.quoteNumber}`, 20, 55);
        doc.text(`Date: ${new Date(quoteData.quoteDate).toLocaleDateString()}`, 20, 62);
        doc.text(`Valid Until: ${new Date(quoteData.expiryDate).toLocaleDateString()}`, 20, 69);

        // Customer info section
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('CUSTOMER INFORMATION', 20, 85);
        doc.setLineWidth(0.5);
        doc.line(20, 87, 190, 87);

        doc.setFontSize(10);
        doc.text(`Name: ${quoteData.customer.name}`, 20, 95);
        doc.text(`Email: ${quoteData.customer.email}`, 20, 102);
        doc.text(`Phone: ${quoteData.customer.phone}`, 20, 109);

        // Boat info
        doc.text(`Boat: ${quoteData.customer.boatName}`, 120, 95);
        if (quoteData.customer.boatMake) {
            doc.text(`Make/Model: ${quoteData.customer.boatMake}`, 120, 102);
        }
        if (quoteData.customer.marina) {
            doc.text(`Marina: ${quoteData.customer.marina}`, 120, 109);
        }
        if (quoteData.customer.slip) {
            doc.text(`Slip: ${quoteData.customer.slip}`, 120, 116);
        }

        // Service details section
        let yPos = 130;
        doc.setFontSize(12);
        doc.text('SERVICE DETAILS', 20, yPos);
        doc.line(20, yPos + 2, 190, yPos + 2);

        yPos += 10;
        doc.setFontSize(10);

        if (quoteData.service) {
            doc.text(`Service Type: ${quoteData.service.name}`, 20, yPos);
            yPos += 7;
            doc.text(`Boat Length: ${quoteData.service.boatLength} ft`, 20, yPos);
            yPos += 7;

            if (quoteData.service.paintCondition) {
                doc.text(`Paint Condition: ${quoteData.service.paintCondition}`, 20, yPos);
                yPos += 7;
            }
            if (quoteData.service.growthLevel) {
                doc.text(`Growth Level: ${quoteData.service.growthLevel}`, 20, yPos);
                yPos += 7;
            }
            if (quoteData.service.hasTwinEngines) {
                doc.text(`Twin Engines: Yes`, 20, yPos);
                yPos += 7;
            }
            if (quoteData.service.additionalHulls > 0) {
                doc.text(`Additional Hulls: ${quoteData.service.additionalHulls}`, 20, yPos);
                yPos += 7;
            }
        }

        // Anodes section if applicable
        if (quoteData.anodes && quoteData.anodes.length > 0) {
            yPos += 10;
            doc.setFontSize(12);
            doc.text('ZINC ANODES', 20, yPos);
            doc.line(20, yPos + 2, 190, yPos + 2);

            yPos += 10;
            doc.setFontSize(10);

            quoteData.anodes.forEach(anode => {
                const lineText = `${anode.quantity}x ${anode.name}`;
                const priceText = `$${anode.totalPrice.toFixed(2)}`;
                doc.text(lineText, 20, yPos);
                doc.text(priceText, 170, yPos, { align: 'right' });
                yPos += 7;
            });
        }

        // Pricing breakdown
        yPos += 10;
        doc.setFontSize(12);
        doc.text('PRICING BREAKDOWN', 20, yPos);
        doc.line(20, yPos + 2, 190, yPos + 2);

        yPos += 10;
        doc.setFontSize(10);

        if (quoteData.pricing) {
            if (quoteData.pricing.basePrice > 0) {
                doc.text(`Service (${quoteData.pricing.boatLength}ft × $${quoteData.pricing.ratePerFoot}/ft):`, 20, yPos);
                doc.text(`$${quoteData.pricing.basePrice.toFixed(2)}`, 170, yPos, { align: 'right' });
                yPos += 7;
            }

            if (quoteData.pricing.anodeCost > 0) {
                doc.text(`Anodes:`, 20, yPos);
                doc.text(`$${quoteData.pricing.anodeCost.toFixed(2)}`, 170, yPos, { align: 'right' });
                yPos += 7;
            }

            if (quoteData.pricing.anodeLaborCost > 0) {
                doc.text(`Anode Installation:`, 20, yPos);
                doc.text(`$${quoteData.pricing.anodeLaborCost.toFixed(2)}`, 170, yPos, { align: 'right' });
                yPos += 7;
            }

            // Total
            yPos += 5;
            doc.setLineWidth(0.5);
            doc.line(120, yPos, 190, yPos);
            yPos += 7;

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`TOTAL:`, 20, yPos);
            doc.text(`$${quoteData.pricing.totalCost.toFixed(2)}`, 170, yPos, { align: 'right' });
            doc.setFont(undefined, 'normal');
        }

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('This quote is valid for the period specified above.', 105, 280, { align: 'center' });
        doc.text('Terms and conditions apply. Payment due upon completion of service.', 105, 285, { align: 'center' });

        return doc;
    }

    downloadQuotePDF(quoteNumber) {
        console.log('Generating PDF for quote:', quoteNumber);

        if (!this.lastQuote) {
            console.error('No quote data available');
            return;
        }

        try {
            const doc = this.generatePDF(this.lastQuote);

            // Generate filename
            const filename = `quote-${quoteNumber}.pdf`;

            // Check if we can use native share API (mobile)
            if (navigator.share && /mobile|android|ios/i.test(navigator.userAgent)) {
                // Convert PDF to blob for sharing
                const pdfBlob = doc.output('blob');
                const file = new File([pdfBlob], filename, { type: 'application/pdf' });

                navigator.share({
                    title: `Quote ${quoteNumber}`,
                    text: `Service quote for ${this.lastQuote.customer.name}`,
                    files: [file]
                }).then(() => {
                    console.log('Quote shared successfully');
                }).catch((error) => {
                    console.log('Share cancelled or failed, downloading instead:', error);
                    // Fallback to download
                    doc.save(filename);
                });
            } else {
                // Desktop - just download
                doc.save(filename);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    }

    viewQuoteOnline(quoteNumber) {
        console.log('View online quote:', quoteNumber);
        const url = `${window.location.origin}/quote/${quoteNumber}`;
        window.open(url, '_blank');
    }

    createNewQuote() {
        // Reset form for new quote
        document.getElementById('chargeResult').style.display = 'none';
        this.selectedCustomer = null;
        this.selectedAnodes = {};
        this.currentServiceKey = null;

        // Reset UI
        document.getElementById('selectedCustomerInfo').textContent = '';
        document.getElementById('simpleServiceButtons').style.display = 'flex';
        document.getElementById('wizardContainer').style.display = 'none';
        this.updateChargeSummary();
    }

    calculateTotalCost() {
        const totalDisplay = document.getElementById('totalCostDisplay');
        if (totalDisplay) {
            const text = totalDisplay.textContent || '$0';
            return parseFloat(text.replace('$', '').replace(',', '')) || 0;
        }
        return 0;
    }
}

// Initialize app
const adminApp = new AdminApp();

// Make it globally available
window.adminApp = adminApp;

// Override updateChargeSummary if it exists as a stub
if (window.updateChargeSummary) {
    console.log('Replacing updateChargeSummary stub with real implementation');
    window.updateChargeSummary = () => adminApp.updateChargeSummary();
}

// Modal customer search functionality
let modalSearchTimeout = null;
window.searchModalCustomer = async function(query) {
    // Clear previous timeout
    if (modalSearchTimeout) {
        clearTimeout(modalSearchTimeout);
    }

    const resultsDiv = document.getElementById('modalCustomerSearchResults');

    // Hide results if query is empty
    if (!query || query.length < 2) {
        resultsDiv.style.display = 'none';
        window.modalSelectedCustomer = null;
        return;
    }

    // Debounce the search
    modalSearchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/stripe-customers?search=${encodeURIComponent(query)}`);
            const customers = await response.json();

            if (customers && customers.length > 0) {
                resultsDiv.innerHTML = customers.map(customer => `
                    <div onclick="window.selectModalCustomer('${customer.id}')"
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
                resultsDiv.innerHTML = '<div style="padding: 10px; color: #666;">No customers found - new customer will be created</div>';
                resultsDiv.style.display = 'block';
                window.modalSelectedCustomer = null;
            }
        } catch (error) {
            console.error('Error searching customers:', error);
            resultsDiv.style.display = 'none';
        }
    }, 300);
};

// Select a customer from modal search results
window.selectModalCustomer = async function(customerId) {
    try {
        const response = await fetch(`http://localhost:3001/api/stripe-customers?customerId=${customerId}`);
        const customer = await response.json();

        if (customer) {
            // Fill in customer fields
            document.getElementById('modalCustomerName').value = customer.name || '';
            document.getElementById('modalCustomerEmail').value = customer.email || '';
            document.getElementById('modalCustomerPhone').value = customer.phone || '';
            document.getElementById('modalBoatName').value = customer.boat_name || '';
            document.getElementById('modalBoatLength').value = customer.boat_length || '';
            document.getElementById('modalBoatMake').value = customer.boat_make || '';
            document.getElementById('modalBoatModel').value = customer.boat_model || '';

            // Hide search results
            document.getElementById('modalCustomerSearchResults').style.display = 'none';

            // Store customer data for later use
            window.modalSelectedCustomer = customer;
        }
    } catch (error) {
        console.error('Error fetching customer details:', error);
    }
};

// Hide modal search results when clicking outside
document.addEventListener('click', function(e) {
    const searchResults = document.getElementById('modalCustomerSearchResults');
    const nameInput = document.getElementById('modalCustomerName');

    if (searchResults && nameInput && !nameInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});