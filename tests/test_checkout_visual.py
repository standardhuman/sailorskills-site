#!/usr/bin/env python3
from playwright.sync_api import sync_playwright

def test_checkout_visual():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Navigate to the local server
        page.goto("http://localhost:8082")
        
        print("=== Visual Test of Checkout Flow ===")
        
        # Test recurring service checkout
        print("\n1. Testing Recurring Service Checkout...")
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
        
        # Take screenshot of recurring checkout
        page.screenshot(path="checkout_recurring.png")
        print("✓ Screenshot saved: checkout_recurring.png")
        
        # Go back and test one-time service
        page.click('#back-to-calculator')
        page.wait_for_timeout(500)
        page.click('#nextButton')  # Start Over
        page.wait_for_timeout(500)
        
        print("\n2. Testing One-time Service Checkout...")
        page.click('[data-service-key="onetime_cleaning"]')
        
        # Navigate to results
        for i in range(7):
            page.click('#nextButton')
            page.wait_for_timeout(50)
        page.click('#nextButton')
        page.wait_for_timeout(500)
        
        # Click checkout
        page.click('#checkout-button')
        page.wait_for_timeout(500)
        
        # Take screenshot of one-time checkout
        page.screenshot(path="checkout_onetime.png")
        print("✓ Screenshot saved: checkout_onetime.png")
        
        print("\n✓ Visual tests completed! Check the screenshots.")
        
        browser.close()

if __name__ == "__main__":
    test_checkout_visual()