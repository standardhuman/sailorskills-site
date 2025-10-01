#!/usr/bin/env python3
"""
Quick smoke test for local development server
"""

from playwright.sync_api import sync_playwright
import sys

def test_local_server():
    """Test that the local server is responding and basic functionality works"""

    print("🧪 Testing BOATY Local Development Server")
    print("=" * 60)

    with sync_playwright() as p:
        try:
            # Launch browser
            print("\n1. Launching browser...")
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            page = context.new_page()

            # Test 1: Homepage loads
            print("2. Testing homepage (http://localhost:5000)...")
            response = page.goto('http://localhost:5000', timeout=10000)

            if response.status == 200:
                print("   ✅ Homepage loaded successfully (200 OK)")
            else:
                print(f"   ❌ Homepage returned {response.status}")
                return False

            # Test 2: Check for main elements
            print("3. Checking for main UI elements...")

            # Check for BOATY title
            title = page.title()
            if "B.O.A.T.Y." in title or "BOATY" in title:
                print(f"   ✅ Page title found: {title}")
            else:
                print(f"   ⚠️  Unexpected title: {title}")

            # Check for workflow steps
            step1 = page.locator('[data-step="1"]').first
            if step1.is_visible():
                print("   ✅ Step 1 (Add Source Videos) visible")
            else:
                print("   ❌ Step 1 not found")
                return False

            # Check for dropzone
            dropzone = page.locator('#dropzone')
            if dropzone.count() > 0:
                print("   ✅ Dropzone element found")
            else:
                print("   ⚠️  Dropzone not found")

            # Check for settings button
            settings_btn = page.locator('[data-target="#settingsModal"]')
            if settings_btn.count() > 0:
                print("   ✅ Settings button found")
            else:
                print("   ⚠️  Settings button not found")

            # Test 3: Check that JavaScript loaded
            print("4. Testing JavaScript execution...")

            # Check for main.js loaded (window should have functions defined)
            js_loaded = page.evaluate("typeof loadSourceVideos === 'function'")
            if js_loaded:
                print("   ✅ Main JavaScript loaded")
            else:
                print("   ❌ Main JavaScript not loaded properly")
                return False

            # Test 4: Test API endpoint
            print("5. Testing API endpoints...")

            api_response = page.goto('http://localhost:5000/api/source-videos')
            if api_response.status == 200:
                print("   ✅ API endpoint /api/source-videos responding")
            else:
                print(f"   ❌ API endpoint returned {api_response.status}")
                return False

            # Test 5: Console errors
            print("6. Checking for JavaScript errors...")

            errors = []
            page.on('console', lambda msg: errors.append(msg) if msg.type == 'error' else None)

            # Reload page to catch any console errors
            page.goto('http://localhost:5000')
            page.wait_for_load_state('networkidle', timeout=5000)

            if len(errors) == 0:
                print("   ✅ No JavaScript console errors")
            else:
                print(f"   ⚠️  Found {len(errors)} console error(s):")
                for error in errors[:3]:  # Show first 3 errors
                    print(f"      - {error.text}")

            browser.close()

            print("\n" + "=" * 60)
            print("✅ All smoke tests passed!")
            print("=" * 60)
            return True

        except Exception as e:
            print(f"\n❌ Test failed with error: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    try:
        success = test_local_server()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)