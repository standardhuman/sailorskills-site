#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time

def test_view_estimate_debug():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Show browser
        page = browser.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"[CONSOLE] {msg.text}"))
        
        # Navigate to the local server
        page.goto("http://localhost:8082")
        
        print("=== Testing View Estimate Button with Debug ===")
        
        # Select a per-foot service (One-time Cleaning)
        page.click('[data-service-key="onetime_cleaning"]')
        print("✓ Selected One-time Cleaning service")
        
        # Navigate quickly to step 7
        for i in range(7):
            page.click('#nextButton')
            page.wait_for_timeout(100)
        
        print("\nNow on Anodes step (step 7)")
        
        # Check current state
        button_text = page.locator('#nextButton').text_content()
        print(f"Button text: '{button_text}'")
        
        # Click View Estimate
        print("\n=== Clicking View Estimate ===")
        page.click('#nextButton')
        
        # Wait for any transitions
        page.wait_for_timeout(1000)
        
        # Check what step we're on
        visible_step = None
        for i in range(9):
            if page.locator(f'#step-{i}').is_visible():
                visible_step = i
                break
        
        print(f"After clicking View Estimate, visible step: {visible_step}")
        
        # Check if results are displayed
        if visible_step == 8:
            cost_display = page.locator('#totalCostDisplay').text_content()
            print(f"Total cost displayed: {cost_display}")
        
        print("\n⚠️  Browser will stay open for 10 seconds to check console...")
        time.sleep(10)
        
        browser.close()

if __name__ == "__main__":
    test_view_estimate_debug()