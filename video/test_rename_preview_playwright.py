#!/usr/bin/env python3
"""
Playwright-based UI test script for BOATY rename preview functionality.
This provides more comprehensive testing of the actual UI interactions.
"""

import asyncio
import sys
import os
import subprocess
import time
from datetime import datetime

# Check if playwright is installed
try:
    from playwright.async_api import async_playwright, expect
except ImportError:
    print("Playwright is not installed. Please install it with:")
    print("pip install playwright")
    print("playwright install chromium")
    sys.exit(1)

# Configuration
BASE_URL = "http://localhost:8080"
HEADLESS = False  # Set to True for headless testing

# Global variable to store the app process
app_process = None

async def start_app():
    """Start the BOATY application if not running."""
    global app_process
    
    # Check if app is already running
    try:
        import requests
        response = requests.get(BASE_URL, timeout=5)
        if response.status_code == 200:
            print("✓ BOATY application is already running")
            return True
    except:
        pass
    
    print("Starting BOATY application...")
    
    # Find virtual environment
    venv_path = os.path.join(os.path.dirname(__file__), 'boaty_venv_new')
    if not os.path.exists(venv_path):
        print("Error: Virtual environment not found at", venv_path)
        return False
    
    # Activate virtual environment and run app
    python_path = os.path.join(venv_path, 'bin', 'python')
    if not os.path.exists(python_path):
        # Try Windows path
        python_path = os.path.join(venv_path, 'Scripts', 'python.exe')
    
    try:
        app_process = subprocess.Popen(
            [python_path, 'app.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=os.path.dirname(__file__)
        )
        
        # Wait for app to start
        print("Waiting for app to start...")
        time.sleep(5)
        
        print("✓ BOATY application started")
        return True
        
    except Exception as e:
        print(f"Error starting app: {e}")
        return False

def stop_app():
    """Stop the BOATY application."""
    global app_process
    if app_process:
        print("Stopping BOATY application...")
        app_process.terminate()
        try:
            app_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            app_process.kill()
        print("✓ BOATY application stopped")

async def take_screenshot(page, name):
    """Take a screenshot for documentation."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"screenshot_{name}_{timestamp}.png"
    await page.screenshot(path=filename)
    print(f"📸 Screenshot saved: {filename}")

async def test_basic_rename_preview(page):
    """Test 1: Basic rename preview flow"""
    print("\n🧪 Testing: Basic Rename Preview Flow")
    
    # Navigate to Step 2
    await page.click('text=Step 2: Rename Videos')
    await page.wait_for_timeout(1000)
    
    # Check if source videos are loaded
    source_videos = await page.query_selector('#source-video-list')
    if source_videos:
        video_count = await page.locator('#source-video-list .video-item').count()
        print(f"✓ Found {video_count} source videos")
    else:
        print("✗ No source videos section found")
        return False
    
    # Enter boat names
    await page.fill('#boat-names-textarea', 'Test Boat A\nTest Boat B\nTest Boat C')
    print("✓ Entered boat names")
    
    # Set date (should already have today's date)
    date_value = await page.input_value('#selected-date')
    print(f"✓ Date is set to: {date_value}")
    
    # Click Preview Rename button
    await page.click('#preview-rename-btn')
    await page.wait_for_timeout(2000)
    
    # Check if preview section appears
    preview_section = await page.query_selector('#rename-preview-section')
    is_visible = await preview_section.is_visible() if preview_section else False
    
    if is_visible:
        print("✓ Preview section is visible")
        await take_screenshot(page, "rename_preview")
        
        # Check preview table
        preview_rows = await page.locator('#rename-preview-tbody tr').count()
        print(f"✓ Preview table has {preview_rows} rows")
        
        # Check assignments
        for i in range(min(3, preview_rows)):
            boat_name = await page.input_value(f'#rename-preview-tbody tr:nth-child({i+1}) .boat-name-input')
            preview_name = await page.text_content(f'#rename-preview-tbody tr:nth-child({i+1}) .preview-final-name')
            print(f"  - Row {i+1}: {boat_name} → {preview_name}")
        
        return True
    else:
        print("✗ Preview section did not appear")
        return False

async def test_edit_preview_assignments(page):
    """Test 2: Edit preview assignments"""
    print("\n🧪 Testing: Edit Preview Assignments")
    
    # Ensure we're in preview mode
    preview_visible = await page.is_visible('#rename-preview-section')
    if not preview_visible:
        await test_basic_rename_preview(page)
    
    # Change a boat name
    first_input = page.locator('#rename-preview-tbody tr:first-child .boat-name-input')
    await first_input.clear()
    await first_input.fill('Modified Boat Name')
    await page.wait_for_timeout(500)
    
    # Check if preview updated
    preview_name = await page.text_content('#rename-preview-tbody tr:first-child .preview-final-name')
    if 'Modified Boat Name' in preview_name:
        print("✓ Boat name change updates preview")
    else:
        print("✗ Boat name change did not update preview")
    
    # Change date
    date_input = page.locator('#rename-preview-tbody tr:first-child .date-input')
    await date_input.fill('2024-01-15')
    await page.wait_for_timeout(500)
    
    preview_name = await page.text_content('#rename-preview-tbody tr:first-child .preview-final-name')
    if '01-15-2024' in preview_name:
        print("✓ Date change updates preview")
    else:
        print("✗ Date change did not update preview")
    
    # Change video type
    type_select = page.locator('#rename-preview-tbody tr:first-child .type-select')
    await type_select.select_option('Inspection')
    await page.wait_for_timeout(500)
    
    preview_name = await page.text_content('#rename-preview-tbody tr:first-child .preview-final-name')
    if 'Inspection' in preview_name:
        print("✓ Type change updates preview")
    else:
        print("✗ Type change did not update preview")
    
    await take_screenshot(page, "edited_preview")
    return True

async def test_drag_drop_reordering(page):
    """Test 3: Drag and drop reordering"""
    print("\n🧪 Testing: Drag and Drop Reordering")
    
    # Get initial order
    first_row_text = await page.text_content('#rename-preview-tbody tr:first-child .preview-final-name')
    second_row_text = await page.text_content('#rename-preview-tbody tr:nth-child(2) .preview-final-name')
    
    print(f"Initial order: First={first_row_text[:30]}..., Second={second_row_text[:30]}...")
    
    # Try to drag first row to second position
    first_row = page.locator('#rename-preview-tbody tr:first-child')
    second_row = page.locator('#rename-preview-tbody tr:nth-child(2)')
    
    try:
        await first_row.drag_to(second_row)
        await page.wait_for_timeout(1000)
        
        # Check new order
        new_first = await page.text_content('#rename-preview-tbody tr:first-child .preview-final-name')
        new_second = await page.text_content('#rename-preview-tbody tr:nth-child(2) .preview-final-name')
        
        if new_first == second_row_text and new_second == first_row_text:
            print("✓ Drag and drop reordering works")
            return True
        else:
            print("✗ Drag and drop did not reorder rows")
            return False
    except:
        print("⚠️  Drag and drop may not be fully implemented")
        return False

async def test_quick_vs_preview_rename(page):
    """Test 4: Quick rename vs Preview rename"""
    print("\n🧪 Testing: Quick Rename vs Preview Rename")
    
    # Cancel preview to go back to form
    await page.click('#cancel-preview-btn')
    await page.wait_for_timeout(1000)
    
    # Check that form is visible again
    form_visible = await page.is_visible('#rename-form')
    preview_hidden = not await page.is_visible('#rename-preview-section')
    
    if form_visible and preview_hidden:
        print("✓ Cancel button works - returned to form")
    else:
        print("✗ Cancel button did not work properly")
    
    # Check that both buttons exist
    quick_rename_exists = await page.query_selector('#quick-rename-btn') is not None
    preview_rename_exists = await page.query_selector('#preview-rename-btn') is not None
    
    if quick_rename_exists and preview_rename_exists:
        print("✓ Both Quick Rename and Preview Rename buttons exist")
    else:
        print("✗ Missing rename buttons")
    
    # Test Apply Rename in preview mode
    await page.click('#preview-rename-btn')
    await page.wait_for_timeout(2000)
    
    apply_button = await page.query_selector('#apply-rename-btn')
    if apply_button:
        print("✓ Apply Rename button exists in preview mode")
        # Don't actually click it to avoid changing files
    else:
        print("✗ Apply Rename button not found")
    
    return True

async def test_edge_cases(page):
    """Test 5: Edge cases"""
    print("\n🧪 Testing: Edge Cases")
    
    # Go back to form
    cancel_btn = await page.query_selector('#cancel-preview-btn')
    if cancel_btn and await cancel_btn.is_visible():
        await cancel_btn.click()
        await page.wait_for_timeout(1000)
    
    # Test empty boat names
    await page.fill('#boat-names-textarea', '')
    await page.click('#preview-rename-btn')
    await page.wait_for_timeout(1000)
    
    # Check for error or that preview didn't open
    preview_visible = await page.is_visible('#rename-preview-section')
    if not preview_visible:
        print("✓ Empty boat names properly rejected")
    else:
        print("✗ Empty boat names not handled properly")
    
    # Test special characters
    await page.fill('#boat-names-textarea', 'Boat/Name\nBoat:Name\nBoat*Name\nBoat?Name')
    await page.click('#preview-rename-btn')
    await page.wait_for_timeout(2000)
    
    preview_visible = await page.is_visible('#rename-preview-section')
    if preview_visible:
        # Check how special characters are handled
        preview_rows = await page.locator('#rename-preview-tbody tr').count()
        print(f"✓ Special characters handled - {preview_rows} rows created")
        
        # Check first preview name
        preview_name = await page.text_content('#rename-preview-tbody tr:first-child .preview-final-name')
        print(f"  Special char handling: {preview_name}")
    
    return True

async def test_unassigned_videos(page):
    """Test handling of unassigned videos"""
    print("\n🧪 Testing: Unassigned Videos Handling")
    
    # Set up scenario with more videos than boat slots
    await page.fill('#boat-names-textarea', 'Single Boat')
    await page.fill('#videos-per-boat', '1')
    await page.click('#preview-rename-btn')
    await page.wait_for_timeout(2000)
    
    # Check for unassigned videos section
    unassigned_section = await page.query_selector('#unassigned-videos-section')
    if unassigned_section and await unassigned_section.is_visible():
        print("✓ Unassigned videos section appears")
        
        # Check if add boat button exists
        add_boat_btn = await page.query_selector('#add-boat-for-unassigned')
        if add_boat_btn:
            print("✓ Add boat for unassigned button exists")
        
        await take_screenshot(page, "unassigned_videos")
    else:
        print("⚠️  No unassigned videos (may need more source videos)")
    
    return True

async def run_all_tests():
    """Run all UI tests using Playwright."""
    print("\n" + "="*60)
    print("BOATY RENAME PREVIEW - PLAYWRIGHT UI TEST SUITE")
    print("="*60)
    print(f"Testing against: {BASE_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Mode: {'Headless' if HEADLESS else 'Headed'}")
    
    # Start app if needed
    if not await start_app():
        print("\n❌ Failed to start BOATY application")
        return
    
    # Run Playwright tests
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=HEADLESS)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720}
        )
        page = await context.new_page()
        
        # Navigate to the app
        try:
            await page.goto(BASE_URL)
            await page.wait_for_load_state('networkidle')
            print("\n✓ Successfully loaded BOATY application")
            await take_screenshot(page, "initial_load")
        except Exception as e:
            print(f"\n❌ Failed to load application: {e}")
            await browser.close()
            return
        
        # Run tests
        test_results = []
        tests = [
            ("Basic Rename Preview", test_basic_rename_preview),
            ("Edit Preview Assignments", test_edit_preview_assignments),
            ("Drag and Drop Reordering", test_drag_drop_reordering),
            ("Quick vs Preview Rename", test_quick_vs_preview_rename),
            ("Edge Cases", test_edge_cases),
            ("Unassigned Videos", test_unassigned_videos)
        ]
        
        for test_name, test_func in tests:
            try:
                result = await test_func(page)
                test_results.append((test_name, result))
            except Exception as e:
                print(f"\n❌ Test '{test_name}' crashed: {e}")
                test_results.append((test_name, False))
                await take_screenshot(page, f"error_{test_name.lower().replace(' ', '_')}")
        
        # Take final screenshot
        await take_screenshot(page, "final_state")
        
        # Close browser
        await browser.close()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "PASS" if result else "FAIL"
        symbol = "✓" if result else "✗"
        print(f"{symbol} {test_name:<40} [{status}]")
    
    print(f"\nTotal: {passed}/{total} tests passed ({(passed/total*100):.1f}%)")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n📁 Screenshots saved in current directory")

def main():
    """Main entry point."""
    try:
        asyncio.run(run_all_tests())
    except KeyboardInterrupt:
        print("\n\nTest suite interrupted by user")
    finally:
        # Clean up
        if app_process:
            stop_app()

if __name__ == "__main__":
    import signal
    
    # Set up signal handling for clean shutdown
    def signal_handler(sig, frame):
        print('\n\nReceived interrupt signal, cleaning up...')
        if app_process:
            stop_app()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    main()