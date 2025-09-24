// Supabase configuration
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Update the handleOrderSubmission function
async function handleOrderSubmissionWithSupabase() {
    const submitButton = document.getElementById('submit-order');
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    
    // Collect all form data (same as before)
    const formData = collectFormData();
    
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
            throw new Error('Failed to create payment intent');
        }

        const { clientSecret, orderId, orderNumber } = await response.json();

        // Confirm payment with Stripe
        const { error } = await stripe.confirmCardPayment(clientSecret, {
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

        if (error) {
            throw error;
        }

        // Success! Show confirmation
        showOrderConfirmation(orderNumber);
        
    } catch (error) {
        console.error('Payment error:', error);
        alert(`Error: ${error.message}`);
        submitButton.disabled = false;
        submitButton.textContent = 'Complete Order';
    }
}

// Show order confirmation
function showOrderConfirmation(orderNumber) {
    const checkoutSection = document.getElementById('checkout-section');
    checkoutSection.innerHTML = `
        <div class="confirmation-message">
            <h2>✅ Order Confirmed!</h2>
            <p>Thank you for your order.</p>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p>We'll contact you within 24 hours to schedule your service.</p>
            <p>You'll receive a confirmation email shortly.</p>
            <button onclick="location.reload()" class="submit-button">Start New Estimate</button>
        </div>
    `;
}

// Helper function to collect form data
function collectFormData() {
    return {
        // Boat info
        boatName: document.getElementById('boat-name').value,
        boatLength: document.getElementById('boat-length-checkout').value,
        boatMake: document.getElementById('boat-make').value,
        boatModel: document.getElementById('boat-model').value,
        
        // Marina info
        marinaName: document.getElementById('marina-name').value,
        dock: document.getElementById('dock').value,
        slipNumber: document.getElementById('slip-number').value,
        
        // Service info
        serviceInterval: selectedServiceInterval,
        service: orderData.service,
        estimate: orderData.estimate,
        serviceDetails: orderData.serviceDetails,
        
        // Customer info
        customerName: document.getElementById('customer-name').value,
        customerEmail: document.getElementById('customer-email').value,
        customerPhone: document.getElementById('customer-phone').value,
        
        // Billing address
        billingAddress: document.getElementById('billing-address').value,
        billingCity: document.getElementById('billing-city').value,
        billingState: document.getElementById('billing-state').value,
        billingZip: document.getElementById('billing-zip').value,
        customerBirthday: document.getElementById('customer-birthday').value
    };
}