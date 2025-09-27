// Wizard functionality for admin page
// Handles service selection wizard and multi-step forms

// Global wizard state
window.wizardCurrentStep = 0;
window.wizardSteps = [];

// Paint condition selection for wizard
window.selectWizardPaintCondition = function(value) {
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
    const paintInput = document.getElementById('paintCondition');
    if (paintInput) {
        paintInput.value = value;
    }

    // Update any visible buttons in the form
    document.querySelectorAll('.option-button[data-value="' + value + '"]').forEach(btn => {
        if (btn.classList.contains('paint-' + value)) {
            btn.classList.add('selected');
        }
    });
};

// Main function to render consolidated service form
window.renderConsolidatedForm = function(isCleaningService, serviceKey) {
    console.log('renderConsolidatedForm called for', serviceKey);

    const wizardContainer = document.getElementById('wizardContainer');
    const wizardContent = document.getElementById('wizardContent');
    const simpleServiceButtons = document.getElementById('simpleServiceButtons');

    if (!wizardContainer || !wizardContent) {
        console.error('Wizard elements not found');
        return;
    }

    // Show wizard container
    wizardContainer.style.display = 'block';
    if (simpleServiceButtons) {
        simpleServiceButtons.style.display = 'none';
    }

    // Clear previous content
    wizardContent.innerHTML = '';

    // Build form based on service type
    if (isCleaningService) {
        // Cleaning services form
        const cleaningForm = `
            <div class="service-form cleaning-form">
                <h3>Boat Details</h3>

                <div class="input-group">
                    <label for="boatLength">Boat Length (feet) *</label>
                    <input type="number" id="boatLength" name="boatLength" min="20" max="100" required
                           placeholder="Enter boat length" onchange="updatePricing()">
                </div>

                <div class="input-group">
                    <label for="boatBeam">Boat Beam/Width (feet)</label>
                    <input type="number" id="boatBeam" name="boatBeam" min="8" max="30"
                           placeholder="Enter boat beam" onchange="updatePricing()">
                </div>

                <div class="config-group">
                    <label>Hull Material</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="hullMaterial" value="fiberglass" checked onchange="updatePricing()">
                            <span>Fiberglass</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="hullMaterial" value="aluminum" onchange="updatePricing()">
                            <span>Aluminum</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="hullMaterial" value="steel" onchange="updatePricing()">
                            <span>Steel</span>
                        </label>
                    </div>
                </div>

                ${serviceKey === 'recurring_cleaning' ? `
                <div class="config-group">
                    <label>Service Frequency</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="frequency" value="weekly" onchange="updatePricing()">
                            <span>Weekly</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="frequency" value="biweekly" checked onchange="updatePricing()">
                            <span>Bi-Weekly</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="frequency" value="monthly" onchange="updatePricing()">
                            <span>Monthly</span>
                        </label>
                    </div>
                </div>` : ''}

                <div class="config-group">
                    <label>Bottom Paint Condition</label>
                    <div class="option-button-group">
                        <button type="button" class="option-button paint-excellent" data-value="excellent" onclick="selectWizardPaintCondition('excellent')">Excellent</button>
                        <button type="button" class="option-button paint-good selected" data-value="good" onclick="selectWizardPaintCondition('good')">Good</button>
                        <button type="button" class="option-button paint-fair" data-value="fair" onclick="selectWizardPaintCondition('fair')">Fair</button>
                        <button type="button" class="option-button paint-poor" data-value="poor" onclick="selectWizardPaintCondition('poor')">Poor</button>
                        <button type="button" class="option-button paint-missing" data-value="missing" onclick="selectWizardPaintCondition('missing')">Missing</button>
                    </div>
                    <input type="hidden" id="paintCondition" name="paintCondition" value="good">
                </div>

                <div class="config-group">
                    <label>Growth Level</label>
                    <div class="growth-slider-container">
                        <input type="range" class="growth-slider" id="growthLevel" name="growthLevel"
                               min="0" max="3" value="1" onchange="updateGrowthDisplay(this.value); updatePricing()">
                        <div class="growth-slider-labels">
                            <span>Minimal<br>(Film/Slime)</span>
                            <span>Moderate<br>(Soft Growth)</span>
                            <span>Heavy<br>(Hard Growth)</span>
                            <span>Severe<br>(Thick Barnacles)</span>
                        </div>
                        <div class="growth-slider-value" id="growthDisplay">Moderate Growth</div>
                    </div>
                </div>

                ${serviceKey === 'onetime_cleaning' ? `
                <div class="config-group">
                    <label>Waterline Cleaning</label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="waterlineOnly" onchange="updatePricing()">
                        <span>Waterline Only (Reduced Price)</span>
                    </label>
                </div>` : ''}
            </div>
        `;

        wizardContent.innerHTML = cleaningForm;
    } else {
        // Non-cleaning services forms
        let formContent = '<div class="service-form">';

        if (serviceKey === 'underwater_inspection') {
            formContent += `
                <h3>Inspection Details</h3>

                <div class="input-group">
                    <label for="boatLength">Boat Length (feet) *</label>
                    <input type="number" id="boatLength" name="boatLength" min="20" max="100" required
                           placeholder="Enter boat length" onchange="updatePricing()">
                </div>

                <div class="config-group">
                    <label>Inspection Type</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="inspectionType" value="basic" checked onchange="updatePricing()">
                            <span>Basic Visual</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="inspectionType" value="detailed" onchange="updatePricing()">
                            <span>Detailed with Report</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="inspectionType" value="insurance" onchange="updatePricing()">
                            <span>Insurance/Survey</span>
                        </label>
                    </div>
                </div>

                <div class="config-group">
                    <label>Additional Services</label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="videoRecording" onchange="updatePricing()">
                        <span>Video Recording (+$50)</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="hullThickness" onchange="updatePricing()">
                        <span>Hull Thickness Measurements (+$150)</span>
                    </label>
                </div>
            `;
        } else if (serviceKey === 'item_recovery') {
            formContent += `
                <h3>Recovery Details</h3>

                <div class="config-group">
                    <label>Search Duration</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="searchDuration" value="30min" checked onchange="updatePricing()">
                            <span>Up to 30 minutes</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="searchDuration" value="1hour" onchange="updatePricing()">
                            <span>Up to 1 hour</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="searchDuration" value="2hour" onchange="updatePricing()">
                            <span>Up to 2 hours</span>
                        </label>
                    </div>
                </div>

                <div class="input-group">
                    <label for="itemDescription">Item Description</label>
                    <textarea id="itemDescription" name="itemDescription" rows="3"
                              placeholder="Describe the item and approximate location where it was lost"></textarea>
                </div>
            `;
        } else if (serviceKey === 'propeller_service') {
            formContent += `
                <h3>Propeller Service Details</h3>

                <div class="config-group">
                    <label>Number of Propellers</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="propCount" value="1" checked onchange="updatePricing()">
                            <span>Single</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="propCount" value="2" onchange="updatePricing()">
                            <span>Twin</span>
                        </label>
                    </div>
                </div>

                <div class="config-group">
                    <label>Propeller Type</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="propType" value="fixed" checked onchange="updatePricing()">
                            <span>Fixed</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="propType" value="folding" onchange="updatePricing()">
                            <span>Folding/Feathering</span>
                        </label>
                    </div>
                </div>

                <div class="config-group">
                    <label>Services Needed</label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="propCleaning" checked onchange="updatePricing()">
                        <span>Propeller Cleaning</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="shaftCleaning" checked onchange="updatePricing()">
                        <span>Shaft Cleaning</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="zincsInspection" onchange="updatePricing()">
                        <span>Zincs Inspection</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="cutterCleaning" onchange="updatePricing()">
                        <span>Line Cutter Cleaning</span>
                    </label>
                </div>
            `;
        }

        formContent += '</div>';
        wizardContent.innerHTML = formContent;
    }

    // Initialize paint condition if present
    if (document.getElementById('paintCondition')) {
        selectWizardPaintCondition('good');
    }

    // Update pricing display
    updatePricing();
};

// Growth level display update
window.updateGrowthDisplay = function(value) {
    const labels = ['Minimal Growth', 'Moderate Growth', 'Heavy Growth', 'Severe Growth'];
    const display = document.getElementById('growthDisplay');
    if (display) {
        display.textContent = labels[parseInt(value)];
    }
};

// Navigate wizard steps (if multi-step wizard is used)
window.navigateWizard = function(direction) {
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

// Update wizard display for multi-step forms
window.updateWizardDisplay = function() {
    const steps = document.querySelectorAll('.wizard-step');
    steps.forEach((step, index) => {
        if (index === window.wizardCurrentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // Update navigation buttons
    const prevBtn = document.querySelector('.wizard-nav-btn.prev');
    const nextBtn = document.querySelector('.wizard-nav-btn.next');

    if (prevBtn) {
        prevBtn.disabled = window.wizardCurrentStep === 0;
    }

    if (nextBtn) {
        nextBtn.textContent = window.wizardCurrentStep === window.wizardSteps.length - 1 ? 'Finish' : 'Next';
    }
};

// Export for use in other modules
export {
    selectWizardPaintCondition,
    renderConsolidatedForm,
    updateGrowthDisplay,
    navigateWizard,
    updateWizardDisplay
};