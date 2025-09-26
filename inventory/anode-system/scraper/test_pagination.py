"""
Test pagination for boatzincs scraper
"""
import asyncio
from playwright.async_api import async_playwright

async def test_pagination():
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    page = await browser.new_page()

    try:
        url = "https://boatzincs.com/categories/zinc-anodes/shaft-anodes/standard.html"
        print(f"Testing pagination for: {url}")

        all_products = []
        page_num = 1

        while page_num <= 5:  # Safety limit
            if page_num > 1:
                url = f"https://boatzincs.com/categories/zinc-anodes/shaft-anodes/standard.html?page={page_num}"

            print(f"\nPage {page_num}: {url}")
            await page.goto(url, wait_until='networkidle')

            # Count products on this page
            products = await page.query_selector_all('.product')
            print(f"  Found {len(products)} products")

            # Get product names
            for product in products[:3]:  # Show first 3
                name_elem = await product.query_selector('.card-title')
                if name_elem:
                    name = await name_elem.inner_text()
                    print(f"    - {name}")

            all_products.extend(products)

            # Check for next page
            pagination = await page.query_selector('.pagination')
            if pagination:
                # Look for next page link
                next_link = await page.query_selector(f'.pagination a[href*="page={page_num + 1}"]')
                if not next_link:
                    # Try "Next" button
                    next_link = await page.query_selector('.pagination-item--next:not(.pagination-item--disabled) a')

                if next_link:
                    print(f"  Next page available")
                else:
                    print(f"  No more pages")
                    break
            else:
                print("  No pagination found")
                break

            page_num += 1

        print(f"\nTotal products found: {len(all_products)}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await browser.close()
        await playwright.stop()

if __name__ == "__main__":
    asyncio.run(test_pagination())