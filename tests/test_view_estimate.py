#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time

def test_view_estimate_button():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Show browser for debugging
        page = browser.new_page()
        
        # Navigate to the local server
        page.goto("http://localhost:8082")
        
        print("=== Testing View Estimate Button ===")
        
        # Select a per-foot service (One-time Cleaning)
        page.click('[data-service-key="onetime_cleaning"]')
        print("✓ Selected One-time Cleaning service")
        
        # Navigate through all steps
        steps = [
            ("Next (Boat Length)", "Clicked to Boat Length step"),
            ("Next (Boat Type)", "Clicked to Boat Type step"),
            ("Next (Hull Type)", "Clicked to Hull Type step"),
            ("Next (Engine Config)", "Clicked to Engine Config step"),
            ("Next (Paint Age)", "Clicked to Paint Age step"),
            ("Next (Last Cleaned)", "Clicked to Last Cleaned step"),
            ("Next (Anodes)", "Clicked to Anodes step"),
            ("View Estimate", "Clicked View Estimate")
        ]
        
        for expected_text, message in steps:
            # Get button text before clicking
            button_text = page.locator('#nextButton').text_content()
            print(f"\nButton text: '{button_text}'")
            
            # Click the button
            page.click('#nextButton')
            print(f"✓ {message}")
            
            # Wait a bit for transition
            page.wait_for_timeout(500)
            
            # Check what's visible now
            visible_step = None
            for i in range(9):  # 0-8
                if page.locator(f'#step-{i}').is_visible():
                    visible_step = i
                    break
            
            print(f"  Current step: {visible_step}")
            
            # If we're on the results step, check if cost is displayed
            if visible_step == 8:
                cost_display = page.locator('#totalCostDisplay').text_content()
                print(f"  Total cost displayed: {cost_display}")
                
                # Check if cost breakdown is populated
                breakdown = page.locator('#costBreakdown').text_content()
                if breakdown:
                    print(f"  Cost breakdown: {breakdown[:100]}...")
                else:
                    print("  ⚠️  No cost breakdown displayed!")
        
        # Now test clicking "Start Over" (what View Estimate becomes on results page)
        print("\n=== Testing Second Click ===")
        button_text = page.locator('#nextButton').text_content()
        print(f"Button text on results page: '{button_text}'")
        
        page.click('#nextButton')
        print("✓ Clicked button on results page")
        
        # Check where we are now
        visible_step = None
        for i in range(9):
            if page.locator(f'#step-{i}').is_visible():
                visible_step = i
                break
        
        print(f"After second click, current step: {visible_step}")
        
        # Keep browser open for manual inspection
        print("\n⚠️  Browser will close in 5 seconds...")
        time.sleep(5)
        
        browser.close()

if __name__ == "__main__":
    test_view_estimate_button()