"""
Boatzincs.com Product Scraper
Manually triggered scraper for anode catalog
"""
import asyncio
import json
import logging
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin, urlparse

from playwright.async_api import async_playwright, Page, Browser
from supabase import create_client, Client
from tqdm import tqdm
import config

# Set up logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.FileHandler(config.LOGS_DIR / f'scraper_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class BoatzincsScraper:
    def __init__(self):
        """Initialize the scraper with Supabase connection"""
        self.supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.sync_log_id: Optional[str] = None
        self.stats = {
            'items_processed': 0,
            'items_added': 0,
            'items_updated': 0,
            'items_failed': 0
        }

    async def init_browser(self):
        """Initialize Playwright browser"""
        logger.info("Starting browser...")
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=config.HEADLESS_MODE,
            args=['--disable-blink-features=AutomationControlled']
        )

        context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        self.page = await context.new_page()
        self.page.set_default_timeout(config.PAGE_LOAD_TIMEOUT)

    async def close_browser(self):
        """Close browser connection"""
        if self.page:
            await self.page.close()
        if self.browser:
            await self.browser.close()

    def start_sync_log(self, sync_type: str, triggered_by: str = 'manual'):
        """Create a new sync log entry"""
        try:
            result = self.supabase.table('anode_sync_logs').insert({
                'sync_type': sync_type,
                'status': 'started',
                'triggered_by': triggered_by,
                'trigger_method': 'manual'
            }).execute()
            self.sync_log_id = result.data[0]['id']
            logger.info(f"Started sync log: {self.sync_log_id}")
        except Exception as e:
            logger.error(f"Failed to create sync log: {e}")

    def update_sync_log(self, status: str, error_message: str = None):
        """Update the sync log with current status"""
        if not self.sync_log_id:
            return

        try:
            update_data = {
                'status': status,
                'items_processed': self.stats['items_processed'],
                'items_added': self.stats['items_added'],
                'items_updated': self.stats['items_updated'],
                'items_failed': self.stats['items_failed']
            }

            if status in ['completed', 'failed']:
                update_data['completed_at'] = datetime.now().isoformat()

            if error_message:
                update_data['error_message'] = error_message

            self.supabase.table('anode_sync_logs').update(update_data).eq('id', self.sync_log_id).execute()
        except Exception as e:
            logger.error(f"Failed to update sync log: {e}")

    async def scrape_product_list(self, category_url: str) -> List[Dict]:
        """Scrape products from a category page"""
        products = []
        page_num = 1

        while True:
            try:
                # Build URL with pagination
                url = f"{config.BOATZINCS_BASE_URL}{category_url}"
                if page_num > 1:
                    url += f"?page={page_num}"

                logger.info(f"Scraping page {page_num}: {url}")
                await self.page.goto(url, wait_until='networkidle')
                await asyncio.sleep(config.RATE_LIMIT_DELAY)

                # Wait for products to load
                try:
                    await self.page.wait_for_selector(config.SELECTORS['product_card'], timeout=5000)
                except:
                    logger.info(f"No products found on page {page_num}")
                    break

                # Extract product data
                product_elements = await self.page.query_selector_all(config.SELECTORS['product_card'])

                for element in product_elements:
                    try:
                        # Get product URL
                        link_element = await element.query_selector('a')
                        product_url = await link_element.get_attribute('href') if link_element else None

                        if not product_url:
                            continue

                        # Get basic product info
                        title_element = await element.query_selector('.productCard-title')
                        title = await title_element.inner_text() if title_element else ''

                        # Extract prices
                        list_price_element = await element.query_selector('.price--rrp')
                        sale_price_element = await element.query_selector('.price--selling')

                        list_price_text = await list_price_element.inner_text() if list_price_element else ''
                        sale_price_text = await sale_price_element.inner_text() if sale_price_element else ''

                        # Clean prices
                        list_price = self.clean_price(list_price_text)
                        sale_price = self.clean_price(sale_price_text)

                        # Get image URL
                        img_element = await element.query_selector('img')
                        image_url = await img_element.get_attribute('src') if img_element else None

                        # Extract SKU from URL or data attributes
                        sku = self.extract_sku_from_url(product_url)

                        product = {
                            'name': title.strip(),
                            'product_url': urljoin(config.BOATZINCS_BASE_URL, product_url),
                            'boatzincs_id': sku,
                            'list_price': list_price or sale_price,
                            'sale_price': sale_price if sale_price != list_price else None,
                            'is_on_sale': bool(sale_price and sale_price != list_price),
                            'image_url': urljoin(config.BOATZINCS_BASE_URL, image_url) if image_url else None
                        }

                        products.append(product)

                    except Exception as e:
                        logger.error(f"Error extracting product: {e}")
                        self.stats['items_failed'] += 1

                # Check for next page
                next_button = await self.page.query_selector(config.SELECTORS['next_page'])
                if not next_button or not await next_button.is_enabled():
                    logger.info(f"No more pages for {category_url}")
                    break

                page_num += 1

            except Exception as e:
                logger.error(f"Error scraping page {page_num} of {category_url}: {e}")
                break

        logger.info(f"Found {len(products)} products in {category_url}")
        return products

    async def scrape_product_details(self, product_url: str) -> Dict:
        """Scrape detailed information from a product page"""
        try:
            logger.debug(f"Scraping details from: {product_url}")
            await self.page.goto(product_url, wait_until='networkidle')
            await asyncio.sleep(config.RATE_LIMIT_DELAY)

            details = {}

            # Get SKU
            sku_element = await self.page.query_selector('.productView-sku')
            if sku_element:
                sku_text = await sku_element.inner_text()
                details['sku'] = sku_text.replace('SKU:', '').strip()

            # Get description
            desc_element = await self.page.query_selector('.productView-description')
            if desc_element:
                details['description'] = await desc_element.inner_text()

            # Get specifications
            spec_elements = await self.page.query_selector_all('.productView-info dt, .productView-info dd')
            specs = {}
            for i in range(0, len(spec_elements), 2):
                if i + 1 < len(spec_elements):
                    key = await spec_elements[i].inner_text()
                    value = await spec_elements[i + 1].inner_text()
                    specs[key.strip(':')] = value

            if specs:
                details['dimensions'] = specs.get('Dimensions', '')
                details['weight'] = specs.get('Weight', '')
                details['manufacturer'] = specs.get('Brand', specs.get('Manufacturer', ''))
                details['part_number'] = specs.get('Part Number', '')

            # Get stock status
            stock_element = await self.page.query_selector('.productView-stock')
            if stock_element:
                stock_text = await stock_element.inner_text()
                details['stock_status'] = self.parse_stock_status(stock_text)

            # Get all images
            image_elements = await self.page.query_selector_all('.productView-images img')
            images = []
            for img in image_elements:
                img_url = await img.get_attribute('src')
                if img_url:
                    images.append(urljoin(config.BOATZINCS_BASE_URL, img_url))

            if images:
                details['image_url'] = images[0]
                details['thumbnail_url'] = images[0]  # Could be different size

            return details

        except Exception as e:
            logger.error(f"Error scraping product details from {product_url}: {e}")
            return {}

    def clean_price(self, price_text: str) -> Optional[float]:
        """Extract numeric price from text"""
        if not price_text:
            return None

        # Remove currency symbols and text
        price_text = re.sub(r'[^\d.,]', '', price_text)
        price_text = price_text.replace(',', '')

        try:
            return float(price_text)
        except ValueError:
            return None

    def extract_sku_from_url(self, url: str) -> str:
        """Extract SKU/ID from product URL"""
        # Try to extract from URL path
        path_parts = urlparse(url).path.split('/')
        if path_parts:
            # Usually the last part or second to last
            potential_sku = path_parts[-1] or path_parts[-2]
            # Remove .html extension
            potential_sku = potential_sku.replace('.html', '')
            return potential_sku
        return ''

    def parse_stock_status(self, stock_text: str) -> str:
        """Parse stock status from text"""
        stock_text = stock_text.lower()
        if 'in stock' in stock_text:
            return 'in_stock'
        elif 'out of stock' in stock_text:
            return 'out_of_stock'
        elif 'limited' in stock_text:
            return 'limited'
        elif 'discontinued' in stock_text:
            return 'discontinued'
        return 'unknown'

    def determine_category(self, url: str, material: str) -> tuple[str, str]:
        """Determine category and subcategory from URL"""
        url_lower = url.lower()

        # Main categories
        if 'shaft' in url_lower:
            category = 'shaft'
            if 'metric' in url_lower:
                subcategory = 'shaft_metric'
            else:
                subcategory = 'shaft_standard'
        elif 'hull' in url_lower:
            category = 'hull'
            subcategory = 'hull'
        elif 'engine' in url_lower:
            category = 'engine'
            subcategory = 'engine'
        elif 'propeller' in url_lower:
            category = 'propeller'
            subcategory = 'propeller'
        elif 'rudder' in url_lower or 'trim' in url_lower:
            category = 'rudder'
            subcategory = 'rudder_trim_tab'
        elif 'collar' in url_lower:
            category = 'other'
            subcategory = 'collar'
        elif 'sterndrive' in url_lower:
            category = 'other'
            subcategory = 'sterndrive'
        elif 'outboard' in url_lower:
            category = 'other'
            subcategory = 'outboard'
        elif 'bow' in url_lower:
            category = 'other'
            subcategory = 'bow_thruster'
        elif 'saildrive' in url_lower:
            category = 'other'
            subcategory = 'saildrive'
        else:
            category = 'other'
            subcategory = 'general'

        return category, subcategory

    async def save_products(self, products: List[Dict], material: str, category_url: str):
        """Save products to Supabase"""
        category, subcategory = self.determine_category(category_url, material)

        for product in tqdm(products, desc="Saving to database"):
            try:
                # Check if product exists
                existing = self.supabase.table('anodes_catalog').select('id, list_price').eq(
                    'boatzincs_id', product['boatzincs_id']
                ).execute()

                # Add category info
                product['material'] = material
                product['category'] = category
                product['subcategory'] = subcategory
                product['last_scraped'] = datetime.now().isoformat()

                if existing.data:
                    # Update existing product
                    product_id = existing.data[0]['id']
                    old_price = existing.data[0]['list_price']

                    self.supabase.table('anodes_catalog').update(product).eq('id', product_id).execute()
                    self.stats['items_updated'] += 1

                    # Record price change if different
                    if product['list_price'] and float(product['list_price']) != float(old_price):
                        self.supabase.table('anode_price_history').insert({
                            'anode_id': product_id,
                            'list_price': product['list_price'],
                            'sale_price': product.get('sale_price')
                        }).execute()
                        logger.info(f"Price changed for {product['name']}: ${old_price} -> ${product['list_price']}")

                else:
                    # Insert new product
                    result = self.supabase.table('anodes_catalog').insert(product).execute()
                    self.stats['items_added'] += 1

                    # Add initial price history
                    if result.data:
                        self.supabase.table('anode_price_history').insert({
                            'anode_id': result.data[0]['id'],
                            'list_price': product['list_price'],
                            'sale_price': product.get('sale_price')
                        }).execute()

                self.stats['items_processed'] += 1

            except Exception as e:
                logger.error(f"Failed to save product {product.get('name', 'Unknown')}: {e}")
                self.stats['items_failed'] += 1

    async def scrape_full_catalog(self, triggered_by: str = 'manual'):
        """Scrape the entire Boatzincs catalog"""
        self.start_sync_log('full_catalog', triggered_by)

        try:
            await self.init_browser()
            self.update_sync_log('in_progress')

            for material, material_config in config.CATEGORIES.items():
                logger.info(f"\n{'='*50}")
                logger.info(f"Scraping {material.upper()} anodes")
                logger.info(f"{'='*50}")

                for subcategory in material_config['subcategories']:
                    category_url = f"/categories/{material}-anodes/{subcategory}.html"
                    logger.info(f"\nScraping: {category_url}")

                    # Get product list
                    products = await self.scrape_product_list(category_url)

                    # Get details for each product (optional, can be slow)
                    if len(products) < 20:  # Only get details for small categories
                        for product in tqdm(products, desc="Getting product details"):
                            details = await self.scrape_product_details(product['product_url'])
                            product.update(details)

                    # Save to database
                    await self.save_products(products, material, category_url)

            self.update_sync_log('completed')
            logger.info(f"\n{'='*50}")
            logger.info("Scraping completed successfully!")
            logger.info(f"Processed: {self.stats['items_processed']}")
            logger.info(f"Added: {self.stats['items_added']}")
            logger.info(f"Updated: {self.stats['items_updated']}")
            logger.info(f"Failed: {self.stats['items_failed']}")
            logger.info(f"{'='*50}")

        except Exception as e:
            logger.error(f"Fatal error during scraping: {e}")
            self.update_sync_log('failed', str(e))
            raise
        finally:
            await self.close_browser()

    async def update_prices_only(self, triggered_by: str = 'manual'):
        """Quick price update for existing products"""
        self.start_sync_log('price_update', triggered_by)

        try:
            await self.init_browser()
            self.update_sync_log('in_progress')

            # Get all active products
            products = self.supabase.table('anodes_catalog').select('*').eq('is_active', True).execute()

            for product in tqdm(products.data, desc="Updating prices"):
                try:
                    await self.page.goto(product['product_url'], wait_until='networkidle')
                    await asyncio.sleep(config.RATE_LIMIT_DELAY)

                    # Get current prices
                    list_price_element = await self.page.query_selector('.price--rrp')
                    sale_price_element = await self.page.query_selector('.price--selling')

                    list_price_text = await list_price_element.inner_text() if list_price_element else ''
                    sale_price_text = await sale_price_element.inner_text() if sale_price_element else ''

                    new_list_price = self.clean_price(list_price_text)
                    new_sale_price = self.clean_price(sale_price_text)

                    # Update if changed
                    if new_list_price and new_list_price != product['list_price']:
                        self.supabase.table('anodes_catalog').update({
                            'list_price': new_list_price,
                            'sale_price': new_sale_price,
                            'is_on_sale': bool(new_sale_price and new_sale_price != new_list_price),
                            'last_scraped': datetime.now().isoformat()
                        }).eq('id', product['id']).execute()

                        # Record price history
                        self.supabase.table('anode_price_history').insert({
                            'anode_id': product['id'],
                            'list_price': new_list_price,
                            'sale_price': new_sale_price
                        }).execute()

                        self.stats['items_updated'] += 1
                        logger.info(f"Price updated for {product['name']}: ${product['list_price']} -> ${new_list_price}")

                    self.stats['items_processed'] += 1

                except Exception as e:
                    logger.error(f"Failed to update price for {product['name']}: {e}")
                    self.stats['items_failed'] += 1

            self.update_sync_log('completed')
            logger.info(f"Price update completed. Updated {self.stats['items_updated']} products")

        except Exception as e:
            logger.error(f"Fatal error during price update: {e}")
            self.update_sync_log('failed', str(e))
            raise
        finally:
            await self.close_browser()


async def main():
    """Main entry point for manual scraping"""
    import sys

    scraper = BoatzincsScraper()

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == 'full':
            logger.info("Starting full catalog scrape...")
            await scraper.scrape_full_catalog()
        elif command == 'prices':
            logger.info("Starting price update...")
            await scraper.update_prices_only()
        else:
            print(f"Unknown command: {command}")
            print("Usage: python boatzincs_scraper.py [full|prices]")
    else:
        print("Boatzincs Scraper - Manual Trigger")
        print("Usage: python boatzincs_scraper.py [full|prices]")
        print("  full   - Scrape entire catalog")
        print("  prices - Update prices only")


if __name__ == "__main__":
    asyncio.run(main())