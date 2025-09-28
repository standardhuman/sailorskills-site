// Payment and Stripe functionality for admin page
// Handles customer charges, payment methods, and Stripe integration

// Initialize Stripe
const stripe = Stripe('pk_live_pri1IepedMvGQmLCFrV4kVzF'); // Your publishable key
let elements = null;
let cardElement = null;

// Charge the customer
async function chargeCustomer() {
    // Check if a service is configured
    const service = window.currentServiceKey;
    if (!service) {
        alert('Please select a service first');
        return;
    }

    // If no customer selected, show the modal
    if (!window.selectedCustomer) {
        openCustomerSelectionModal();
        return;
    }

    // If customer selected but no payment method
    if (!window.selectedCustomer.payment_method) {
        alert('Please add a payment method for this customer');
        return;
    }

    const button = document.getElementById('chargeButton');
    const originalText = button.innerHTML;
    button.innerHTML = 'Processing... <span class="loading-spinner"></span>';
    button.classList.add('processing');
    button.disabled = true;

    // Get price from the editable amount field if it exists, otherwise calculate total with anodes
    const editableAmountEl = document.getElementById('editableAmount');
    let price;
    if (editableAmountEl) {
        price = parseFloat(editableAmountEl.value) || 0;
    } else {
        // Get base service price
        const totalElement = document.getElementById('totalCostDisplay');
        const servicePrice = totalElement ? parseFloat(totalElement.textContent.replace('$', '').replace(',', '')) : 0;

        // Calculate anode costs if any
        let anodeTotalPrice = 0;
        const anodeItems = Object.values(window.anodeCart || {});
        if (anodeItems.length > 0) {
            const taxRate = parseFloat(document.getElementById('taxRate')?.value || 10.75) / 100;
            const markupRate = parseFloat(document.getElementById('markupRate')?.value || 20) / 100;
            const laborCharge = parseFloat(document.getElementById('laborCharge')?.value || 15);

            const anodeSubtotal = anodeItems.reduce((sum, item) => sum + (item.list_price * item.quantity), 0);
            const totalAnodeCount = anodeItems.reduce((sum, item) => sum + item.quantity, 0);
            const anodeLaborTotal = totalAnodeCount * laborCharge;
            const anodeSubtotalWithLabor = anodeSubtotal + anodeLaborTotal;
            const anodeMarkup = anodeSubtotalWithLabor * markupRate;
            const anodeSubtotalWithMarkup = anodeSubtotalWithLabor + anodeMarkup;
            const anodeTax = anodeSubtotalWithMarkup * taxRate;
            anodeTotalPrice = anodeSubtotalWithMarkup + anodeTax;
        }

        // Total price includes service + anodes
        price = servicePrice + anodeTotalPrice;
    }

    // Get selected service key and details
    const selectedServiceEl = document.querySelector('.service-option.selected');
    const serviceKeyFromElement = selectedServiceEl ? selectedServiceEl.dataset.serviceKey : '';
    const serviceTitleEl = selectedServiceEl ? selectedServiceEl.querySelector('.service-title') : null;
    const serviceName = serviceTitleEl ? serviceTitleEl.textContent : '';
    const boatLength = document.getElementById('boatLength')?.value || '0';
    const boatName = document.getElementById('boatName')?.value || '';

    // Build comprehensive metadata for transaction history
    const metadata = {
        service_key: serviceKeyFromElement || service,
        service_name: serviceName,
        service_date: new Date().toISOString().split('T')[0],
        service_time: new Date().toLocaleTimeString()
    };

    // Add boat name and customer boat metadata if provided
    if (boatName) {
        metadata.boat_name = boatName;
    }

    // Include customer's boat details from their profile
    if (window.selectedCustomer && window.selectedCustomer.boat_name && !boatName) {
        metadata.boat_name = window.selectedCustomer.boat_name;
    }

    // Only include boat details for cleaning services
    const isCleaningService = service === 'onetime_cleaning' || service === 'recurring_cleaning';
    const isFlatRateService = service === 'item_recovery' || service === 'underwater_inspection';

    if (isCleaningService) {
        metadata.boat_length = boatLength;
        metadata.last_paint = document.getElementById('lastPaintedTime')?.value;
        metadata.last_cleaned = document.getElementById('lastCleanedTime')?.value;

        // Add hull type and engine configuration if available
        const hullType = document.querySelector('input[name="hull_type"]:checked')?.value;
        if (hullType) {
            metadata.hull_type = hullType;
            if (hullType === 'catamaran') metadata.additional_hulls = 1;
            if (hullType === 'trimaran') metadata.additional_hulls = 2;
        }

        const hasTwinEngines = document.getElementById('has_twin_engines')?.checked;
        if (hasTwinEngines) {
            metadata.twin_engines = true;
            metadata.engine_type = 'twin';
        } else {
            metadata.engine_type = 'single';
        }

        // Add boat type (sailboat/powerboat)
        const boatType = document.querySelector('input[name="boat_type"]:checked')?.value;
        if (boatType) {
            metadata.boat_type = boatType;
        }

        // Add paint condition and growth level
        const paintCondition = document.getElementById('actualPaintCondition')?.value || document.getElementById('wizardPaintCondition')?.value;
        if (paintCondition) {
            metadata.paint_condition = paintCondition;
        }

        const growthLevel = document.getElementById('actualGrowthLevel')?.value || document.getElementById('wizardGrowthLevel')?.value;
        if (growthLevel) {
            metadata.growth_level = growthLevel;
        }
    }

    // Add anode details to metadata if present
    const anodeItems = Object.values(window.anodeCart || {});
    if (anodeItems.length > 0) {
        const totalAnodeCount = anodeItems.reduce((sum, item) => sum + item.quantity, 0);
        metadata.anodes_included = true;
        metadata.anode_count = totalAnodeCount;
        metadata.anode_details = anodeItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.list_price
        }));
    }

    // Build detailed description for Stripe transaction
    let description = serviceName || service.replace(/_/g, ' ');

    // Add anode information to description
    if (anodeItems.length > 0) {
        const totalAnodeCount = anodeItems.reduce((sum, item) => sum + item.quantity, 0);
        description += ` + ${totalAnodeCount} Anode${totalAnodeCount !== 1 ? 's' : ''}`;
    }

    // Add boat details to description
    if (boatName) {
        description = `${description} - ${boatName}`;
    }
    if (!isFlatRateService && boatLength) {
        description += ` (${boatLength}ft)`;
    }

    // Add service date
    description += ` - ${new Date().toLocaleDateString()}`;

    try {
        const response = await fetch('http://localhost:3001/api/charge-customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerId: window.selectedCustomer.id,
                amount: Math.round(price * 100), // Convert to cents
                description: description,
                metadata: metadata
            })
        });

        const result = await response.json();

        if (result.success) {
            showResult('success',
                `✅ Successfully charged $${price.toFixed(2)} to ${window.selectedCustomer.name || window.selectedCustomer.email}<br>
                 Payment ID: ${result.paymentIntent.id}`);

            // Reset selection after success
            setTimeout(() => {
                window.selectedCustomer = null;
                document.getElementById('selectedCustomer').classList.remove('active');
                document.querySelectorAll('.customer-item').forEach(el => {
                    el.classList.remove('selected');
                });
                updateChargeSummary();
            }, 3000);
        } else {
            showResult('error', `❌ Payment failed: ${result.error}`);
        }
    } catch (error) {
        showResult('error', `❌ Error processing payment: ${error.message}`);
    } finally {
        button.innerHTML = originalText;
        button.classList.remove('processing');
        updateChargeSummary();
    }
}

// Update charge button when amount is edited
function updateChargeButton() {
    const editableAmount = parseFloat(document.getElementById('editableAmount')?.value || 0);
    const chargeButton = document.getElementById('chargeButton');

    if (window.selectedCustomer && window.selectedCustomer.payment_method) {
        chargeButton.disabled = editableAmount === 0;
        chargeButton.textContent = `Charge $${editableAmount.toFixed(2)}`;
    }
}

// Show result message
function showResult(type, message) {
    const resultDiv = document.getElementById('chargeResult');
    if (resultDiv) {
        resultDiv.className = `charge-result ${type}`;
        resultDiv.innerHTML = message;
        resultDiv.style.display = 'block';

        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 5000);
    }
}

// Payment Method Management
async function showPaymentMethodForm(customerId) {
    const customer = window.customers.find(c => c.id === customerId);
    if (!customer) {
        alert('Customer not found');
        return;
    }

    // Set current customer for payment method addition
    window.currentPaymentCustomer = customer;

    // Show customer info in modal
    const infoDiv = document.getElementById('paymentCustomerInfo');
    if (infoDiv) {
        infoDiv.innerHTML = `
            <strong>Customer:</strong> ${customer.name || 'Unnamed'}<br>
            <strong>Email:</strong> ${customer.email}
        `;
    }

    // Create Stripe Elements
    elements = stripe.elements();
    cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#32325d',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                '::placeholder': {
                    color: '#aab7c4'
                }
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            }
        }
    });

    // Mount card element
    cardElement.mount('#card-element');

    // Handle card errors
    cardElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });

    // Show modal
    document.getElementById('paymentMethodModal').style.display = 'block';
}

function closePaymentMethodForm() {
    const modal = document.getElementById('paymentMethodModal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Destroy card element
    if (cardElement) {
        cardElement.destroy();
        cardElement = null;
    }
    elements = null;
    window.currentPaymentCustomer = null;
}

// Handle payment form submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('payment-form');
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();

            if (!window.currentPaymentCustomer) {
                alert('No customer selected');
                return;
            }

            const submitButton = document.getElementById('submit-payment');
            submitButton.disabled = true;
            submitButton.textContent = 'Adding...';

            try {
                // Create a setup intent
                const setupResponse = await fetch('http://localhost:3001/api/create-setup-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        customerId: window.currentPaymentCustomer.stripe_customer_id
                    })
                });

                const setupData = await setupResponse.json();

                if (!setupData.clientSecret) {
                    throw new Error('Failed to create setup intent');
                }

                // Confirm the setup intent with Stripe
                const result = await stripe.confirmCardSetup(
                    setupData.clientSecret,
                    {
                        payment_method: {
                            card: cardElement,
                            billing_details: {
                                name: window.currentPaymentCustomer.name,
                                email: window.currentPaymentCustomer.email
                            }
                        }
                    }
                );

                if (result.error) {
                    throw new Error(result.error.message);
                }

                // Save payment method to database
                const saveResponse = await fetch('http://localhost:3001/api/save-payment-method', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        customerId: window.currentPaymentCustomer.id,
                        paymentMethodId: result.setupIntent.payment_method
                    })
                });

                const saveData = await saveResponse.json();

                if (saveData.success) {
                    alert('Payment method added successfully!');
                    closePaymentMethodForm();

                    // Refresh customer list
                    if (typeof loadRecentCustomers === 'function') {
                        loadRecentCustomers();
                    }
                } else {
                    throw new Error(saveData.error || 'Failed to save payment method');
                }
            } catch (error) {
                alert('Error adding payment method: ' + error.message);
                console.error('Payment method error:', error);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Add Card';
            }
        });
    }
});

// Customer Selection Modal Functions
function openCustomerSelectionModal() {
    const modal = document.getElementById('customerSelectionModal');
    if (modal) {
        modal.style.display = 'block';
        // Populate existing customers list
        const customerList = document.getElementById('modalCustomerList');
        if (customerList && window.customers) {
            customerList.innerHTML = window.customers.map(customer => `
                <div class="customer-item" onclick="selectModalCustomer('${customer.id}')" style="padding: 10px; border: 1px solid #ddd; margin-bottom: 5px; cursor: pointer; border-radius: 5px;">
                    <div style="font-weight: bold;">${customer.name || 'Unnamed Customer'}</div>
                    <div style="font-size: 14px; color: #666;">${customer.email}${customer.boat_name ? ' • Boat: ' + customer.boat_name : ''}</div>
                    <div style="font-size: 12px; color: ${customer.payment_method ? 'green' : 'orange'};">
                        ${customer.payment_method ? '✓ Card on file' : '⚠ No card on file'}
                    </div>
                </div>
            `).join('');
        }
    }
}

function closeCustomerSelectionModal() {
    const modal = document.getElementById('customerSelectionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

let modalSelectedCustomerId = null;

function selectModalCustomer(customerId) {
    modalSelectedCustomerId = customerId;
    // Highlight selected customer
    document.querySelectorAll('#modalCustomerList .customer-item').forEach(el => {
        el.style.background = 'white';
    });
    event.currentTarget.style.background = '#e3f2fd';
}

async function confirmModalCustomerSelection() {
    if (!modalSelectedCustomerId) {
        alert('Please select a customer');
        return;
    }

    // Get the selected customer
    const customer = window.customers.find(c => c.id === modalSelectedCustomerId);
    if (customer) {
        window.selectedCustomer = customer;

        // Update UI
        const selectedDisplay = document.getElementById('selectedCustomer');
        const selectedInfo = document.getElementById('selectedCustomerInfo');

        if (selectedDisplay && selectedInfo) {
            selectedInfo.innerHTML = `${customer.name || 'Unnamed'} - ${customer.email}
                ${customer.payment_method ? '<span style="color: green;">✓ Card on file</span>' : '<span style="color: orange;">⚠ No card</span>'}`;
            selectedDisplay.classList.add('active');
        }

        closeCustomerSelectionModal();

        // Update charge summary
        if (typeof updateChargeSummary === 'function') {
            updateChargeSummary();
        }

        // If no payment method, prompt to add one
        if (!customer.payment_method) {
            if (confirm('This customer has no payment method on file. Would you like to add one now?')) {
                showPaymentMethodForm(customer.id);
            }
        } else {
            // Call chargeCustomer again now that we have a customer selected
            chargeCustomer();
        }
    }
}

// Charge anodes separately
async function chargeAnodes() {
    if (!window.selectedBoat || !window.selectedBoat.customerId) {
        alert('Please select a boat first');
        return;
    }

    const anodeItems = Object.values(window.anodeCart || {});
    if (anodeItems.length === 0) {
        alert('No anodes selected');
        return;
    }

    // Calculate total
    const taxRate = parseFloat(document.getElementById('taxRate').value) / 100;
    const markupRate = parseFloat(document.getElementById('markupRate').value) / 100;
    const laborCharge = parseFloat(document.getElementById('laborCharge').value);

    const subtotal = anodeItems.reduce((sum, item) => sum + (item.list_price * item.quantity), 0);
    const totalCount = anodeItems.reduce((sum, item) => sum + item.quantity, 0);
    const laborTotal = totalCount * laborCharge;
    const subtotalWithLabor = subtotal + laborTotal;
    const markup = subtotalWithLabor * markupRate;
    const subtotalWithMarkup = subtotalWithLabor + markup;
    const tax = subtotalWithMarkup * taxRate;
    const total = subtotalWithMarkup + tax;

    const description = anodeItems.map(item =>
        `${item.name} x${item.quantity}`
    ).join(', ');

    const button = document.querySelector('.charge-anode-btn');
    button.disabled = true;
    button.textContent = 'Processing...';

    try {
        const response = await fetch('http://localhost:3001/api/charge-customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerId: window.selectedBoat.customerId,
                amount: Math.round(total * 100),
                description: `Anode Replacement: ${description}`,
                metadata: {
                    boat_id: window.selectedBoat.id,
                    boat_name: window.selectedBoat.boatName,
                    anode_items: anodeItems,
                    subtotal: subtotal,
                    labor: laborTotal,
                    markup: markup,
                    tax: tax,
                    service_date: document.getElementById('serviceDate').value
                }
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Payment successful!');

            // Clear cart
            window.anodeCart = {};
            updateAnodeCart();

            // Mark boat as serviced
            const boatItem = document.querySelector(`.boat-schedule-item[data-boat-id="${window.selectedBoat.id}"]`);
            if (boatItem) {
                boatItem.classList.add('completed');
                const statusBadge = boatItem.querySelector('.boat-status');
                if (statusBadge) {
                    statusBadge.textContent = 'Completed';
                    statusBadge.style.background = '#95a5a6';
                }
            }
        } else {
            alert('Payment failed: ' + result.error);
        }
    } catch (error) {
        alert('Error processing payment: ' + error.message);
    } finally {
        button.disabled = false;
        button.textContent = '💳 Charge Customer';
    }
}

// Update charge summary
window.updateChargeSummary = function() {
    // Check if updateWizardPricing exists and should handle the update for wizard services
    if (window.updateWizardPricing &&
        (window.currentServiceKey === 'recurring_cleaning' ||
         window.currentServiceKey === 'onetime_cleaning' ||
         window.currentServiceKey === 'anodes_only')) {
        // Let updateWizardPricing handle the detailed summary
        window.updateWizardPricing();
        return;
    }

    const summaryContent = document.getElementById('chargeSummaryContent');
    if (!summaryContent) return;

    const service = window.currentServiceKey;
    const customer = window.selectedCustomer;

    if (!service) {
        summaryContent.innerHTML = '<p>Select a service to see pricing</p>';
        return;
    }

    if (!customer) {
        summaryContent.innerHTML = '<p>Select a customer and service to see pricing</p>';
        return;
    }

    // Basic summary display for other services
    summaryContent.innerHTML = `
        <div class="charge-detail-row">
            <span>Service:</span>
            <span>${service.replace(/_/g, ' ')}</span>
        </div>
        <div class="charge-detail-row">
            <span>Customer:</span>
            <span>${customer.name || customer.email}</span>
        </div>
        <div class="charge-detail-row">
            <span>Total:</span>
            <span>Calculate based on selections</span>
        </div>
    `;

    // Enable/disable charge button based on selections
    const chargeButton = document.getElementById('chargeButton');
    if (chargeButton) {
        chargeButton.disabled = !customer || !customer.payment_method || !service;
    }
};

// Make functions globally available immediately
window.chargeCustomer = chargeCustomer;
window.updateChargeButton = updateChargeButton;
window.updateChargeSummary = updateChargeSummary;
window.showPaymentMethodForm = showPaymentMethodForm;
window.closePaymentMethodForm = closePaymentMethodForm;
window.openCustomerSelectionModal = openCustomerSelectionModal;
window.closeCustomerSelectionModal = closeCustomerSelectionModal;
window.selectModalCustomer = selectModalCustomer;
window.confirmModalCustomerSelection = confirmModalCustomerSelection;
window.chargeAnodes = chargeAnodes;

// Export for use in other modules
export {
    stripe,
    chargeCustomer,
    updateChargeButton,
    showPaymentMethodForm,
    closePaymentMethodForm,
    openCustomerSelectionModal,
    closeCustomerSelectionModal,
    selectModalCustomer,
    confirmModalCustomerSelection,
    chargeAnodes
};