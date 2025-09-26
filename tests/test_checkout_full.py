#!/usr/bin/env python3
from playwright.sync_api import sync_playwright

def test_checkout_full():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Navigate to the local server
        page.goto("http://localhost:8082")
        
        print("=== Full Page Checkout Screenshots ===")
        
        # Test recurring service
        print("\n1. Recurring Service Checkout...")
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
        
        # Scroll to interval section
        interval_section = page.locator('#service-interval-section')
        if interval_section.is_visible():
            interval_section.scroll_into_view_if_needed()
            page.wait_for_timeout(500)
            page.screenshot(path="checkout_recurring_interval.png")
            print("✓ Screenshot saved: checkout_recurring_interval.png (with interval section)")
        
        # Go back and test one-time
        page.click('#back-to-calculator')
        page.wait_for_timeout(500)
        page.click('#nextButton')
        page.wait_for_timeout(500)
        
        print("\n2. One-time Service Checkout...")
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
        
        # Scroll to where interval section would be
        contact_section = page.locator('h3:has-text("Contact Information")')
        contact_section.scroll_into_view_if_needed()
        page.wait_for_timeout(500)
        page.screenshot(path="checkout_onetime_no_interval.png")
        print("✓ Screenshot saved: checkout_onetime_no_interval.png (no interval section)")
        
        browser.close()

if __name__ == "__main__":
    test_checkout_full()