#!/usr/bin/env python3
"""Simple visible browser test"""

from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    print("Opening http://localhost:8080...")
    response = page.goto('http://localhost:8080', wait_until='networkidle')

    print(f"Status: {response.status}")
    print(f"URL: {page.url}")
    print(f"Title: {page.title()}")

    # Take screenshot
    page.screenshot(path='test_screenshot.png')
    print("Screenshot saved to test_screenshot.png")

    time.sleep(5)
    browser.close()