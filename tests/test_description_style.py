#!/usr/bin/env python3
from playwright.sync_api import sync_playwright

def test_description_style():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Navigate to the local server
        page.goto("http://localhost:8082")
        
        # Wait for the service buttons to load
        page.wait_for_selector('.service-option')
        
        # Get the description element
        description = page.locator('#servicePriceExplainer')
        
        # Get initial styles
        initial_styles = description.evaluate("""el => {
            const style = window.getComputedStyle(el);
            return {
                fontSize: style.fontSize,
                color: style.color,
                lineHeight: style.lineHeight,
                marginTop: style.marginTop
            };
        }""")
        
        print("=== Service Description Styling ===")
        print(f"Font size: {initial_styles['fontSize']}")
        print(f"Color: {initial_styles['color']}")
        print(f"Line height: {initial_styles['lineHeight']}")
        print(f"Margin top: {initial_styles['marginTop']}")
        
        # Click on a service to see the description
        page.click('[data-service-key="recurring_cleaning"]')
        
        # Get the description text
        desc_text = description.text_content()
        print(f"\nDescription text: {desc_text}")
        
        # Take screenshots before and after selecting
        page.screenshot(path="description_style_with_selection.png")
        print("\n✓ Screenshot saved as description_style_with_selection.png")
        
        # Verify the font size is 16px (1em)
        if initial_styles['fontSize'] == '16px':
            print("\n✓ Font size correctly set to 16px (1em)")
        else:
            print(f"\n✗ Font size is {initial_styles['fontSize']}, expected 16px")
        
        # Check if color is darker than the original #6d7b89
        # rgb(74, 85, 104) is #4a5568
        if initial_styles['color'] == 'rgb(74, 85, 104)':
            print("✓ Color correctly set to #4a5568 (darker gray)")
        else:
            print(f"✗ Color is {initial_styles['color']}, expected rgb(74, 85, 104)")
        
        browser.close()

if __name__ == "__main__":
    test_description_style()