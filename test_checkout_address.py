#!/usr/bin/env python3
from playwright.sync_api import sync_playwright

def test_checkout_address():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Navigate to the local server
        page.goto("http://localhost:8082")
        
        print("=== Testing Checkout with Address Fields ===")
        
        # Select recurring service
        page.click('[data-service-key="recurring_cleaning"]')
        
        # Navigate to results
        for i in range(7):
            page.click('#nextButton')
            page.wait_for_timeout(50)
        page.click('#nextButton')
        page.wait_for_timeout(500)
        
        # Click checkout
        page.click('#checkout-button')
        page.wait_for_timeout(500)
        
        # Check if address fields exist
        address_fields = {
            'billing-address': 'Street Address field',
            'billing-city': 'City field',
            'billing-state': 'State dropdown',
            'billing-zip': 'ZIP Code field',
            'customer-birthday': 'Birthday field (optional)'
        }
        
        print("\n✓ Checking address fields:")
        for field_id, field_name in address_fields.items():
            element = page.locator(f'#{field_id}')
            if element.is_visible():
                print(f"  ✓ {field_name} is visible")
            else:
                print(f"  ✗ {field_name} is NOT visible")
        
        # Fill out the form
        print("\n✓ Filling out form...")
        
        # Boat info
        page.fill('#boat-name', 'Test Boat')
        page.fill('#boat-make', 'Catalina')
        page.fill('#boat-model', '320')
        
        # Marina info
        page.fill('#marina-name', 'Test Marina')
        page.fill('#dock', 'A')
        page.fill('#slip-number', '42')
        
        # Select interval
        page.click('[data-interval="2"]')
        
        # Contact info
        page.fill('#customer-name', 'John Doe')
        page.fill('#customer-email', 'john@example.com')
        page.fill('#customer-phone', '555-1234')
        
        # Billing address
        page.fill('#billing-address', '123 Main Street')
        page.fill('#billing-city', 'San Diego')
        page.select_option('#billing-state', 'CA')
        page.fill('#billing-zip', '92101')
        page.fill('#customer-birthday', '1990-07-15')
        
        print("  ✓ All fields filled")
        
        # Take screenshot
        page.screenshot(path="checkout_with_address.png", full_page=True)
        print("\n✓ Screenshot saved: checkout_with_address.png")
        
        # Check if submit button is still disabled (needs card info)
        submit_button = page.locator('#submit-order')
        is_disabled = submit_button.is_disabled()
        print(f"\nSubmit button disabled (waiting for card): {is_disabled}")
        
        browser.close()

if __name__ == "__main__":
    test_checkout_address()