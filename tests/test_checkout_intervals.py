#!/usr/bin/env python3
from playwright.sync_api import sync_playwright

def test_checkout_intervals():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Navigate to the local server
        page.goto("http://localhost:8082")
        
        print("=== Testing Checkout Interval Selection ===")
        
        # Test 1: Recurring Cleaning Service
        print("\n1. Testing Recurring Cleaning Service...")
        page.click('[data-service-key="recurring_cleaning"]')
        
        # Navigate through steps quickly
        for i in range(7):
            page.click('#nextButton')
            page.wait_for_timeout(100)
        
        # View estimate
        page.click('#nextButton')
        page.wait_for_timeout(500)
        
        # Look for checkout button
        checkout_button = page.locator('#checkout-button')
        if checkout_button.is_visible():
            print("✓ Checkout button found")
            checkout_button.click()
            page.wait_for_timeout(500)
            
            # Check if interval section is visible
            interval_section = page.locator('#service-interval-section')
            if interval_section.is_visible():
                print("✓ Service interval section is visible for recurring service")
                
                # Check interval options
                interval_options = page.locator('.interval-option').count()
                print(f"  Found {interval_options} interval options")
            else:
                print("✗ Service interval section NOT visible for recurring service")
        
        # Go back to calculator
        page.click('#back-to-calculator')
        page.wait_for_timeout(500)
        
        # Start over
        page.click('#nextButton')  # Start Over button
        page.wait_for_timeout(500)
        
        # Test 2: One-time Cleaning Service
        print("\n2. Testing One-time Cleaning Service...")
        page.click('[data-service-key="onetime_cleaning"]')
        
        # Navigate through steps
        for i in range(7):
            page.click('#nextButton')
            page.wait_for_timeout(100)
        
        # View estimate
        page.click('#nextButton')
        page.wait_for_timeout(500)
        
        # Click checkout
        page.click('#checkout-button')
        page.wait_for_timeout(500)
        
        # Check if interval section is hidden
        interval_section = page.locator('#service-interval-section')
        if interval_section.is_visible():
            print("✗ Service interval section is visible for one-time service (should be hidden)")
        else:
            print("✓ Service interval section is hidden for one-time service")
        
        # Go back
        page.click('#back-to-calculator')
        page.wait_for_timeout(500)
        
        # Start over
        page.click('#nextButton')
        page.wait_for_timeout(500)
        
        # Test 3: Flat rate service (Item Recovery)
        print("\n3. Testing Flat Rate Service (Item Recovery)...")
        page.click('[data-service-key="item_recovery"]')
        
        # Should jump to anodes
        page.click('#nextButton')
        page.wait_for_timeout(100)
        
        # View estimate
        page.click('#nextButton')
        page.wait_for_timeout(500)
        
        # Click checkout
        page.click('#checkout-button')
        page.wait_for_timeout(500)
        
        # Check if interval section is hidden
        interval_section = page.locator('#service-interval-section')
        if interval_section.is_visible():
            print("✗ Service interval section is visible for flat rate service (should be hidden)")
        else:
            print("✓ Service interval section is hidden for flat rate service")
        
        print("\n✓ All checkout interval tests completed!")
        
        browser.close()

if __name__ == "__main__":
    test_checkout_intervals()