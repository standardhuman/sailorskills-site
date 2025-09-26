"""
Test script to debug Boatzincs scraper
"""
import asyncio
from playwright.async_api import async_playwright

async def test_scrape():
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(
        headless=False,
        args=['--disable-blink-features=AutomationControlled']
    )

    context = await browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    page = await context.new_page()

    try:
        print("Loading page...")
        await page.goto("https://boatzincs.com/categories/zinc-anodes/shaft-anodes/standard.html",
                        wait_until='domcontentloaded', timeout=30000)

        # Wait for products to potentially load via JavaScript
        await page.wait_for_timeout(5000)

        print("Page loaded, looking for products...")

        # Check for product cards with correct selector
        products = await page.query_selector_all('.product')
        print(f"Found {len(products)} products")

        if products:
            print("\n--- First product details ---")
            first_product = products[0]

            # Get product name
            title_element = await first_product.query_selector('.card-title a')
            if title_element:
                title = await title_element.inner_text()
                print(f"Title: {title}")

            # Get link
            link_element = await first_product.query_selector('.card-title a')
            if link_element:
                href = await link_element.get_attribute('href')
                print(f"Link: {href}")

            # Get prices
            price_element = await first_product.query_selector('.price')
            if price_element:
                price_html = await price_element.inner_html()
                price_text = await price_element.inner_text()
                print(f"Price HTML: {price_html}")
                print(f"Price text: {price_text}")

            # Get all price related elements
            price_sections = await first_product.query_selector_all('[class*="price"]')
            for ps in price_sections:
                class_name = await ps.get_attribute('class')
                text = await ps.inner_text()
                print(f"Price element ({class_name}): {text[:100] if len(text) > 100 else text}")

            # Get image
            img_element = await first_product.query_selector('img')
            if img_element:
                src = await img_element.get_attribute('src')
                alt = await img_element.get_attribute('alt')
                print(f"Image src: {src}")
                print(f"Image alt: {alt}")

            # Get data attributes
            data_name = await first_product.get_attribute('data-name')
            data_id = await first_product.get_attribute('data-entity-id')
            print(f"Data-name: {data_name}")
            print(f"Data-id: {data_id}")

        # Check page HTML structure
        print("\n--- Checking HTML structure ---")

        # Check what's actually on the page
        all_divs = await page.query_selector_all('div')
        print(f"Total divs on page: {len(all_divs)}")

        # Try to find products with different selectors
        possible_selectors = [
            '.productGrid-item',
            '.product-item',
            '.product',
            '[data-product]',
            '.card',
            '.item',
            'article',
            '[itemtype*="Product"]'
        ]

        for selector in possible_selectors:
            elements = await page.query_selector_all(selector)
            if elements:
                print(f"Found {len(elements)} elements with selector: {selector}")
                # Get sample HTML from first element
                sample_html = await elements[0].inner_html()
                print(f"Sample HTML ({selector}): {sample_html[:300]}...")

        # Check page title and URL
        title = await page.title()
        url = page.url
        print(f"\nPage title: {title}")
        print(f"Final URL: {url}")

        # Screenshot for debugging
        await page.screenshot(path="debug_scraper.png")
        print("Screenshot saved as debug_scraper.png")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await browser.close()
        await playwright.stop()

if __name__ == "__main__":
    asyncio.run(test_scrape())