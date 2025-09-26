#!/usr/bin/env python3
from playwright.sync_api import sync_playwright

def test_view_estimate_final():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Navigate to the local server
        page.goto("http://localhost:8082")
        
        print("=== Final Test of View Estimate Button ===")
        
        # Test 1: Per-foot service (One-time Cleaning)
        print("\n1. Testing per-foot service...")
        page.click('[data-service-key="onetime_cleaning"]')
        
        # Navigate through all steps
        for i in range(7):
            page.click('#nextButton')
            page.wait_for_timeout(100)
        
        # Click View Estimate
        page.click('#nextButton')
        page.wait_for_timeout(500)
        
        # Check if we're on results page
        if page.locator('#step-8').is_visible():
            cost = page.locator('#totalCostDisplay').text_content()
            print(f"✓ Successfully reached results page")
            print(f"  Cost displayed: {cost}")
            
            # Test Start Over button
            button_text = page.locator('#nextButton').text_content()
            print(f"  Button now shows: '{button_text}'")
            
            page.click('#nextButton')
            page.wait_for_timeout(500)
            
            if page.locator('#step-0').is_visible():
                print("✓ Start Over button works correctly")
            else:
                print("✗ Start Over button failed")
        else:
            print("✗ Failed to reach results page")
        
        # Test 2: Flat rate service (Item Recovery)
        print("\n2. Testing flat rate service...")
        page.click('[data-service-key="item_recovery"]')
        
        # Should jump to anodes step
        page.click('#nextButton')
        page.wait_for_timeout(100)
        
        # Should show View Estimate
        button_text = page.locator('#nextButton').text_content()
        print(f"  Button shows: '{button_text}'")
        
        # Click View Estimate
        page.click('#nextButton')
        page.wait_for_timeout(500)
        
        if page.locator('#step-8').is_visible():
            cost = page.locator('#totalCostDisplay').text_content()
            print(f"✓ Flat rate service reached results page")
            print(f"  Cost displayed: {cost}")
        else:
            print("✗ Flat rate service failed to reach results")
        
        print("\n✓ All tests completed!")
        
        browser.close()

if __name__ == "__main__":
    test_view_estimate_final()