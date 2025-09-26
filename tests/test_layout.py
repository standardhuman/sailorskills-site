#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import sys

def test_service_layout():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        try:
            # Navigate to the local server
            page.goto("http://localhost:8082")
            
            # Wait for the service buttons to load
            page.wait_for_selector('.service-option', timeout=5000)
            
            # Get all service buttons
            service_buttons = page.locator('.service-option').all()
            
            print("=== Service Layout Test ===")
            print(f"\nFound {len(service_buttons)} service buttons")
            
            # Check the order and content
            expected_order = [
                ("One-time Cleaning & Anodes", "$6 per foot"),
                ("Recurring Cleaning & Anodes", "$4.5 per foot"),
                ("Item Recovery", "$150 flat rate"),
                ("Underwater Inspection", "$150 flat rate")
            ]
            
            for i, button in enumerate(service_buttons):
                name = button.locator('.service-name').text_content()
                price = button.locator('.service-price').text_content()
                has_cleaning_class = button.evaluate("el => el.classList.contains('cleaning-service')")
                
                print(f"\nButton {i+1}:")
                print(f"  Name: {name}")
                print(f"  Price: {price}")
                print(f"  Has cleaning-service class: {has_cleaning_class}")
                
                # Verify order
                if i < len(expected_order):
                    expected_name, expected_price = expected_order[i]
                    if name == expected_name and price == expected_price:
                        print(f"  ✓ Correct position and content")
                    else:
                        print(f"  ✗ Expected: {expected_name} - {expected_price}")
            
            # Check grid layout
            grid = page.locator('.service-selection-grid')
            grid_style = grid.evaluate("""el => {
                const style = window.getComputedStyle(el);
                return {
                    display: style.display,
                    gridTemplateColumns: style.gridTemplateColumns,
                    gap: style.gap
                };
            }""")
            
            print(f"\n=== Grid Layout ===")
            print(f"Display: {grid_style['display']}")
            print(f"Grid Template Columns: {grid_style['gridTemplateColumns']}")
            print(f"Gap: {grid_style['gap']}")
            
            # Check if cleaning services span full width
            for i in range(2):  # First two should be cleaning services
                button = service_buttons[i]
                grid_column = button.evaluate("el => window.getComputedStyle(el).gridColumn")
                print(f"\nButton {i+1} grid-column: {grid_column}")
            
            # Take a screenshot
            page.screenshot(path="service_layout.png", full_page=False)
            print("\n✓ Screenshot saved as service_layout.png")
            
            # Test clicking functionality
            print("\n=== Testing Click Functionality ===")
            for i, button in enumerate(service_buttons):
                button.click()
                
                # Check if button is selected
                is_selected = button.evaluate("el => el.classList.contains('selected')")
                
                # Get the description
                description = page.locator('#servicePriceExplainer').text_content()
                
                name = button.locator('.service-name').text_content()
                print(f"\n{name}:")
                print(f"  Selected: {is_selected}")
                print(f"  Description: {description[:50]}..." if len(description) > 50 else f"  Description: {description}")
            
        except Exception as e:
            print(f"\n✗ Test failed: {str(e)}")
            page.screenshot(path="error_screenshot.png")
            print("Error screenshot saved as error_screenshot.png")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    test_service_layout()