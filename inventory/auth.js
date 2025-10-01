// Simple Authentication for Inventory System
// This provides basic password protection for the inventory management interface

class InventoryAuth {
    constructor() {
        this.isAuthenticated = false;
        this.sessionKey = 'inventory_auth_session';
        this.passwordHash = null; // Will be set from environment or default

        // Check for existing session
        this.checkSession();
    }

    // Check if user has valid session
    checkSession() {
        const session = sessionStorage.getItem(this.sessionKey);
        if (session) {
            const sessionData = JSON.parse(session);
            const now = new Date().getTime();

            // Session expires after 8 hours
            if (sessionData.expires && sessionData.expires > now) {
                this.isAuthenticated = true;
                return true;
            } else {
                // Session expired
                sessionStorage.removeItem(this.sessionKey);
            }
        }

        return false;
    }

    // Simple hash function (SHA-256)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Authenticate user with password
    async authenticate(password) {
        // Hash the entered password
        const hashedPassword = await this.hashPassword(password);

        // Get the correct password hash from environment or use default
        // In production, this should come from a secure backend
        const correctHash = import.meta.env.VITE_INVENTORY_PASSWORD_HASH ||
                           'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'; // "123" hashed

        if (hashedPassword === correctHash) {
            this.isAuthenticated = true;

            // Set session (expires in 8 hours)
            const sessionData = {
                authenticated: true,
                expires: new Date().getTime() + (8 * 60 * 60 * 1000)
            };
            sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));

            return true;
        }

        return false;
    }

    // Logout user
    logout() {
        this.isAuthenticated = false;
        sessionStorage.removeItem(this.sessionKey);
        window.location.reload();
    }

    // Require authentication - show login prompt if not authenticated
    async require() {
        if (this.isAuthenticated) {
            return true;
        }

        // Show login modal
        return await this.showLoginPrompt();
    }

    // Show login prompt
    async showLoginPrompt() {
        return new Promise((resolve) => {
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'auth-modal';
            modal.innerHTML = `
                <div class="auth-modal-content">
                    <div class="auth-header">
                        <h2>🔒 Inventory Access</h2>
                        <p>Please enter password to continue</p>
                    </div>
                    <form id="auth-form" class="auth-form">
                        <div class="form-group">
                            <input
                                type="password"
                                id="auth-password"
                                class="auth-input"
                                placeholder="Enter password"
                                autocomplete="current-password"
                                required
                            >
                        </div>
                        <div class="auth-error" id="auth-error" style="display: none;">
                            ❌ Incorrect password. Please try again.
                        </div>
                        <button type="submit" class="auth-btn">Unlock</button>
                    </form>
                    <div class="auth-footer">
                        <small>Session will last 8 hours</small>
                    </div>
                </div>
            `;

            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .auth-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    backdrop-filter: blur(10px);
                }
                .auth-modal-content {
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    max-width: 400px;
                    width: 90%;
                }
                .auth-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .auth-header h2 {
                    margin: 0 0 10px 0;
                    color: #2c3e50;
                    font-size: 28px;
                }
                .auth-header p {
                    margin: 0;
                    color: #7f8c8d;
                    font-size: 14px;
                }
                .auth-form {
                    margin-bottom: 20px;
                }
                .auth-input {
                    width: 100%;
                    padding: 15px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.3s;
                    box-sizing: border-box;
                }
                .auth-input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .auth-btn {
                    width: 100%;
                    padding: 15px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    margin-top: 15px;
                }
                .auth-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                }
                .auth-btn:active {
                    transform: translateY(0);
                }
                .auth-footer {
                    text-align: center;
                    color: #95a5a6;
                    font-size: 12px;
                }
                .auth-error {
                    padding: 10px;
                    background: #ffe6e6;
                    border: 1px solid #ffcccc;
                    border-radius: 6px;
                    color: #d63031;
                    font-size: 14px;
                    margin-top: 10px;
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(modal);

            // Focus password input
            setTimeout(() => {
                document.getElementById('auth-password').focus();
            }, 100);

            // Handle form submission
            const form = document.getElementById('auth-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const password = document.getElementById('auth-password').value;
                const errorDiv = document.getElementById('auth-error');

                const success = await this.authenticate(password);

                if (success) {
                    modal.remove();
                    style.remove();
                    resolve(true);
                } else {
                    errorDiv.style.display = 'block';
                    document.getElementById('auth-password').value = '';
                    document.getElementById('auth-password').focus();
                }
            });
        });
    }
}

// Export for use in other modules
window.InventoryAuth = InventoryAuth;

// Create global auth instance
window.inventoryAuth = new InventoryAuth();

// Automatically require authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    await window.inventoryAuth.require();
});

console.log('🔒 Authentication module loaded');
