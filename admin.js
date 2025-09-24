// Admin Application Module
export class AdminApp {
    constructor() {
        this.selectedCustomer = null;
        this.customers = [];
        this.currentServiceKey = null;
        this.modalSelectedCustomerId = null;

        this.init();
    }

    init() {
        console.log('Initializing Admin App');

        // Set up event listeners
        this.setupEventListeners();

        // Initialize service buttons if available
        if (window.populateServiceButtons && window.serviceData) {
            window.populateServiceButtons();
            this.attachServiceButtonHandlers();
        } else {
            // Retry if script.js hasn't loaded yet
            setTimeout(() => this.init(), 100);
        }
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

    attachServiceButtonHandlers() {
        // Override service selection to enable charge button
        if (window.selectServiceDirect) {
            const originalSelect = window.selectServiceDirect;
            window.selectServiceDirect = (serviceKey) => {
                this.currentServiceKey = serviceKey;
                originalSelect(serviceKey);
                this.updateChargeSummary();
            };
        }
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
        const chargeDetails = document.getElementById('chargeDetails');
        const chargeButton = document.getElementById('chargeButton');

        // Get service info
        const serviceName = window.serviceData && window.currentServiceKey ?
            window.serviceData[window.currentServiceKey]?.name : '';

        // Get price
        const totalElement = document.getElementById('totalCostDisplay');
        const price = totalElement ?
            parseFloat(totalElement.textContent.replace('$', '').replace(',', '')) : 0;

        // Update charge details
        if (this.currentServiceKey) {
            let detailsHTML = `<div>Service: ${serviceName || this.currentServiceKey}</div>`;
            detailsHTML += `<div>Price: $${price.toFixed(2)}</div>`;

            if (this.selectedCustomer) {
                detailsHTML += `<div>Customer: ${this.selectedCustomer.name || this.selectedCustomer.email}</div>`;
                if (this.selectedCustomer.payment_method) {
                    detailsHTML += `<div>Payment: Card ending in ${this.selectedCustomer.payment_method.card.last4}</div>`;
                } else {
                    detailsHTML += `<div>Payment: No card on file</div>`;
                }
            } else {
                detailsHTML += `<div>Customer: Not selected</div>`;
            }

            chargeDetails.innerHTML = detailsHTML;
        } else {
            chargeDetails.innerHTML = 'Select a service to see details';
        }

        // Enable button if service is selected (customer can be selected later)
        chargeButton.disabled = !this.currentServiceKey;

        // Update button text
        if (this.selectedCustomer && this.selectedCustomer.payment_method) {
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

        // If no customer selected, show modal
        if (!this.selectedCustomer) {
            this.openCustomerModal();
            return;
        }

        // If customer has no payment method
        if (!this.selectedCustomer.payment_method) {
            alert('Please add a payment method for this customer');
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
            this.populateModalCustomers();
        }
    }

    closeCustomerModal() {
        const modal = document.getElementById('customerSelectionModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    populateModalCustomers() {
        const listEl = document.getElementById('modalCustomerList');
        if (listEl && this.customers) {
            listEl.innerHTML = this.customers.map(customer => `
                <div class="customer-item" onclick="adminApp.selectModalCustomer('${customer.id}')">
                    <div>${customer.name || 'Unnamed'} - ${customer.email}</div>
                    <div>${customer.payment_method ? '✓ Card on file' : '⚠ No card'}</div>
                </div>
            `).join('');
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