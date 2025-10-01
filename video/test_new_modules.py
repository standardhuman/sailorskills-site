#!/usr/bin/env python3
"""
Test script to verify new JavaScript modules load correctly
"""

import time
from playwright.sync_api import sync_playwright

def test_new_modules():
    print("Testing new JavaScript modules...")

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to test page
        print("Loading test page...")
        page.goto('http://localhost:5000/test_modules.html')

        # Wait for tests to complete
        time.sleep(2)

        # Get test results from console
        console_messages = []
        page.on('console', lambda msg: console_messages.append(msg.text))

        # Get results from page
        results_html = page.inner_html('#results')

        # Check for test summary
        summary = page.locator('h3').inner_text()
        print(f"\n{summary}")

        # Check individual test results
        test_divs = page.locator('#results > div').all()

        passed = 0
        failed = 0

        for div in test_divs:
            text = div.inner_text()
            if '✅ PASS' in text:
                passed += 1
                print(f"  ✅ {text.split(' - ')[1].split()[0]}")
            elif '❌ FAIL' in text:
                failed += 1
                print(f"  ❌ {text.split(' - ')[1]}")

        browser.close()

        print(f"\nResult: {passed} passed, {failed} failed")

        if failed > 0:
            print("\n❌ Some tests failed. Check the output above.")
            return False
        else:
            print("\n✅ All module tests passed!")
            return True

if __name__ == '__main__':
    try:
        success = test_new_modules()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error running tests: {e}")
        exit(1)