from playwright.sync_api import sync_playwright

def test_service_descriptions():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Navigate to the local server
        page.goto("http://localhost:8082")
        
        # Wait for the service buttons to load
        page.wait_for_selector('.service-option')
        
        # Test each service's description
        services = {
            'recurring_cleaning': 'Regular hull cleaning keeps your boat performing at its best. Service includes cleaning and zinc anode inspection. Available at 1, 2, or 3-month intervals.',
            'onetime_cleaning': 'Complete hull cleaning and zinc anode inspection. Perfect for pre-haul out, pre-survey, or when your regular diver is unavailable.',
            'item_recovery': 'Professional recovery of dropped items like phones, keys, tools, or dinghies. Quick response to minimize water damage.',
            'underwater_inspection': 'Thorough underwater inspection with detailed photo/video documentation. Ideal for insurance claims, pre-purchase surveys, or damage assessment.'
        }
        
        for service_key, expected_description in services.items():
            # Click the service button
            page.click(f'[data-service-key="{service_key}"]')
            
            # Check if the button has the selected class
            selected_button = page.locator(f'[data-service-key="{service_key}"]')
            assert selected_button.evaluate("el => el.classList.contains('selected')")
            
            # Check the description text
            description_element = page.locator('#servicePriceExplainer')
            actual_description = description_element.text_content()
            assert actual_description == expected_description, f"Expected: {expected_description}, Got: {actual_description}"
            
            print(f"✓ {service_key} description correct")
        
        print("\nAll service descriptions are displaying correctly!")
        
        browser.close()

if __name__ == "__main__":
    test_service_descriptions()