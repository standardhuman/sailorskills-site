"""
Boatzincs.com Ordering Automation
Handles login, cart management, and order placement
"""
import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from decimal import Decimal

from playwright.async_api import async_playwright, Page, Browser
from supabase import create_client, Client
from cryptography.fernet import Fernet
import config

# Set up logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.FileHandler(config.LOGS_DIR / f'ordering_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class BoatzincsOrdering:
    def __init__(self):
        """Initialize ordering system with Supabase connection"""
        self.supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.is_logged_in = False
        self.cart_items = []

    async def init_browser(self):
        """Initialize Playwright browser for ordering"""
        logger.info("Starting browser for ordering...")
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

    async def login(self, username: str = None, password: str = None) -> bool:
        """Login to Boatzincs.com"""
        try:
            username = username or config.BOATZINCS_USERNAME
            password = password or config.BOATZINCS_PASSWORD

            if not username or not password:
                logger.error("No credentials provided")
                return False

            logger.info(f"Logging in as {username}...")

            # Navigate to login page
            await self.page.goto(f"{config.BOATZINCS_BASE_URL}/login.php", wait_until='networkidle')

            # Fill login form
            await self.page.fill('input[name="login_email"], input[type="email"]', username)
            await self.page.fill('input[name="login_pass"], input[type="password"]', password)

            # Submit form
            await self.page.click('button[type="submit"], input[type="submit"]')

            # Wait for navigation
            await self.page.wait_for_navigation(wait_until='networkidle', timeout=10000)

            # Check if logged in (look for logout link or account menu)
            logout_link = await self.page.query_selector('a[href*="logout"], .account-menu')
            if logout_link:
                logger.info("Successfully logged in")
                self.is_logged_in = True

                # Save session cookie for future use
                cookies = await self.page.context.cookies()
                self.save_session_cookies(cookies)

                return True
            else:
                logger.error("Login failed - no logout link found")
                return False

        except Exception as e:
            logger.error(f"Login error: {e}")
            return False

    def save_session_cookies(self, cookies: List[Dict]):
        """Save session cookies to database for reuse"""
        try:
            # Store cookies as JSON (you might want to encrypt this)
            cookie_data = json.dumps(cookies)

            self.supabase.table('boatzincs_credentials').upsert({
                'username': config.BOATZINCS_USERNAME,
                'session_cookie': cookie_data,
                'cookie_expiry': datetime.now().isoformat(),
                'last_login': datetime.now().isoformat(),
                'is_active': True
            }).execute()

            logger.info("Session cookies saved")
        except Exception as e:
            logger.error(f"Failed to save cookies: {e}")

    async def restore_session(self) -> bool:
        """Try to restore previous session from cookies"""
        try:
            # Get stored cookies
            result = self.supabase.table('boatzincs_credentials').select('*').eq(
                'username', config.BOATZINCS_USERNAME
            ).eq('is_active', True).execute()

            if not result.data:
                return False

            cookie_data = result.data[0]['session_cookie']
            if not cookie_data:
                return False

            # Load cookies
            cookies = json.loads(cookie_data)
            await self.page.context.add_cookies(cookies)

            # Test if session is valid
            await self.page.goto(f"{config.BOATZINCS_BASE_URL}/account.php", wait_until='networkidle')
            logout_link = await self.page.query_selector('a[href*="logout"]')

            if logout_link:
                logger.info("Session restored successfully")
                self.is_logged_in = True
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to restore session: {e}")
            return False

    async def add_to_cart(self, boatzincs_id: str, quantity: int = 1) -> bool:
        """Add a product to cart"""
        try:
            if not self.is_logged_in:
                logger.error("Not logged in")
                return False

            # Get product info from database
            product = self.supabase.table('anodes_catalog').select('*').eq(
                'boatzincs_id', boatzincs_id
            ).single().execute()

            if not product.data:
                logger.error(f"Product {boatzincs_id} not found in database")
                return False

            product_data = product.data
            logger.info(f"Adding {quantity}x {product_data['name']} to cart")

            # Navigate to product page
            await self.page.goto(product_data['product_url'], wait_until='networkidle')

            # Set quantity
            quantity_input = await self.page.query_selector('input[name="qty"], input[type="number"]')
            if quantity_input:
                await quantity_input.fill(str(quantity))

            # Click add to cart button
            add_button = await self.page.query_selector(
                'button[type="submit"][value="add"], .productView-cartButton, #form-action-addToCart'
            )

            if not add_button:
                logger.error("Add to cart button not found")
                return False

            await add_button.click()

            # Wait for cart update (could be AJAX)
            await asyncio.sleep(2)

            # Check if added successfully
            cart_count = await self.get_cart_count()
            if cart_count > 0:
                self.cart_items.append({
                    'boatzincs_id': boatzincs_id,
                    'name': product_data['name'],
                    'quantity': quantity,
                    'unit_price': product_data['list_price']
                })
                logger.info(f"Successfully added to cart. Cart now has {cart_count} items")
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to add {boatzincs_id} to cart: {e}")
            return False

    async def get_cart_count(self) -> int:
        """Get current cart item count"""
        try:
            cart_count_element = await self.page.query_selector(
                '.cart-count, .cartCounter, .navUser-item--cart .countPill'
            )
            if cart_count_element:
                count_text = await cart_count_element.inner_text()
                # Extract number from text
                import re
                numbers = re.findall(r'\d+', count_text)
                return int(numbers[0]) if numbers else 0
            return 0
        except:
            return 0

    async def view_cart(self) -> Dict:
        """View current cart contents"""
        try:
            logger.info("Viewing cart...")
            await self.page.goto(f"{config.BOATZINCS_BASE_URL}/cart.php", wait_until='networkidle')

            cart_items = []
            cart_rows = await self.page.query_selector_all('.cart-item, .cartItem, tr.cart-row')

            for row in cart_rows:
                try:
                    # Get product name
                    name_element = await row.query_selector('.cart-item-name, .productName, a')
                    name = await name_element.inner_text() if name_element else 'Unknown'

                    # Get quantity
                    qty_input = await row.query_selector('input[name*="qty"], input[type="number"]')
                    quantity = await qty_input.get_attribute('value') if qty_input else '1'

                    # Get price
                    price_element = await row.query_selector('.cart-item-price, .price')
                    price_text = await price_element.inner_text() if price_element else '0'

                    cart_items.append({
                        'name': name.strip(),
                        'quantity': int(quantity),
                        'price': price_text
                    })
                except Exception as e:
                    logger.error(f"Error parsing cart item: {e}")

            # Get totals
            subtotal_element = await self.page.query_selector('.cart-subtotal, .subtotal')
            tax_element = await self.page.query_selector('.cart-tax, .tax')
            shipping_element = await self.page.query_selector('.cart-shipping, .shipping')
            total_element = await self.page.query_selector('.cart-total, .grand-total')

            cart_data = {
                'items': cart_items,
                'subtotal': await subtotal_element.inner_text() if subtotal_element else 'N/A',
                'tax': await tax_element.inner_text() if tax_element else 'N/A',
                'shipping': await shipping_element.inner_text() if shipping_element else 'N/A',
                'total': await total_element.inner_text() if total_element else 'N/A'
            }

            logger.info(f"Cart contains {len(cart_items)} items")
            return cart_data

        except Exception as e:
            logger.error(f"Failed to view cart: {e}")
            return {'items': [], 'error': str(e)}

    async def clear_cart(self) -> bool:
        """Clear all items from cart"""
        try:
            logger.info("Clearing cart...")
            await self.page.goto(f"{config.BOATZINCS_BASE_URL}/cart.php", wait_until='networkidle')

            # Look for remove/delete buttons
            remove_buttons = await self.page.query_selector_all(
                '.cart-remove, .removeItem, button[title="Remove"], a[href*="remove"]'
            )

            for button in remove_buttons:
                await button.click()
                await asyncio.sleep(1)  # Wait between removals

            self.cart_items = []
            logger.info("Cart cleared")
            return True

        except Exception as e:
            logger.error(f"Failed to clear cart: {e}")
            return False

    async def checkout(self, dry_run: bool = True) -> Dict:
        """Proceed to checkout (dry_run by default for safety)"""
        try:
            if dry_run:
                logger.info("DRY RUN - Not actually placing order")

            # View cart first
            cart_data = await self.view_cart()

            if not cart_data['items']:
                logger.error("Cart is empty")
                return {'success': False, 'error': 'Cart is empty'}

            # Go to checkout
            await self.page.goto(f"{config.BOATZINCS_BASE_URL}/checkout", wait_until='networkidle')

            # Get checkout form data
            checkout_data = {
                'cart': cart_data,
                'dry_run': dry_run
            }

            if not dry_run:
                # Actually submit order
                logger.warning("LIVE ORDER - Submitting order...")

                # Find and click place order button
                order_button = await self.page.query_selector(
                    'button[type="submit"][value="place_order"], #checkout-app button[type="submit"]'
                )

                if order_button:
                    await order_button.click()
                    await self.page.wait_for_navigation(wait_until='networkidle')

                    # Get order confirmation
                    confirmation = await self.page.query_selector('.order-confirmation, .checkout-success')
                    if confirmation:
                        order_number = await self.extract_order_number()
                        checkout_data['success'] = True
                        checkout_data['order_number'] = order_number
                        logger.info(f"Order placed successfully: {order_number}")
                    else:
                        checkout_data['success'] = False
                        checkout_data['error'] = 'No confirmation received'
            else:
                checkout_data['success'] = True
                checkout_data['message'] = 'Dry run completed - no order placed'

            return checkout_data

        except Exception as e:
            logger.error(f"Checkout failed: {e}")
            return {'success': False, 'error': str(e)}

    async def extract_order_number(self) -> Optional[str]:
        """Extract order number from confirmation page"""
        try:
            # Look for order number in various formats
            selectors = [
                '.order-number',
                '.confirmation-number',
                'h1:has-text("Order")',
                'p:has-text("Order #")'
            ]

            for selector in selectors:
                element = await self.page.query_selector(selector)
                if element:
                    text = await element.inner_text()
                    # Extract number from text
                    import re
                    numbers = re.findall(r'#?(\d+)', text)
                    if numbers:
                        return numbers[0]

            return None
        except:
            return None

    async def create_order_from_inventory_needs(self) -> Dict:
        """Create an order based on inventory reorder points"""
        try:
            # Get items needing reorder
            result = self.supabase.rpc('get_anodes_needing_reorder').execute()
            items_to_order = result.data if result.data else []

            if not items_to_order:
                logger.info("No items need reordering")
                return {'success': True, 'message': 'No items need reordering'}

            logger.info(f"Found {len(items_to_order)} items needing reorder")

            # Create order record
            order_result = self.supabase.table('anode_orders').insert({
                'order_type': 'reorder',
                'status': 'draft',
                'created_at': datetime.now().isoformat()
            }).execute()

            order_id = order_result.data[0]['id']

            # Add items to order
            order_items = []
            total_cost = Decimal('0')

            for item in items_to_order:
                order_items.append({
                    'order_id': order_id,
                    'anode_id': item['id'],
                    'quantity': item['reorder_quantity'],
                    'unit_price': item['list_price'],
                    'line_total': Decimal(str(item['reorder_quantity'])) * Decimal(str(item['list_price']))
                })
                total_cost += order_items[-1]['line_total']

            # Save order items
            self.supabase.table('anode_order_items').insert(order_items).execute()

            # Update order total
            self.supabase.table('anode_orders').update({
                'subtotal': float(total_cost),
                'total_amount': float(total_cost)  # Add tax/shipping later
            }).eq('id', order_id).execute()

            return {
                'success': True,
                'order_id': order_id,
                'items_count': len(order_items),
                'estimated_total': float(total_cost),
                'message': f'Draft order created with {len(order_items)} items'
            }

        except Exception as e:
            logger.error(f"Failed to create order: {e}")
            return {'success': False, 'error': str(e)}

    async def submit_order(self, order_id: str, dry_run: bool = True) -> Dict:
        """Submit a draft order to Boatzincs"""
        try:
            # Get order details
            order = self.supabase.table('anode_orders').select('*').eq('id', order_id).single().execute()
            if not order.data:
                return {'success': False, 'error': 'Order not found'}

            # Get order items
            items = self.supabase.table('anode_order_items').select(
                '*, anode_id(boatzincs_id, name)'
            ).eq('order_id', order_id).execute()

            if not items.data:
                return {'success': False, 'error': 'No items in order'}

            # Initialize browser and login
            await self.init_browser()
            logged_in = await self.restore_session() or await self.login()

            if not logged_in:
                return {'success': False, 'error': 'Failed to login'}

            # Clear cart first
            await self.clear_cart()

            # Add each item to cart
            for item in items.data:
                success = await self.add_to_cart(
                    item['anode_id']['boatzincs_id'],
                    item['quantity']
                )
                if not success:
                    logger.error(f"Failed to add {item['anode_id']['name']} to cart")

            # Proceed to checkout
            checkout_result = await self.checkout(dry_run=dry_run)

            if checkout_result['success'] and not dry_run:
                # Update order status
                self.supabase.table('anode_orders').update({
                    'status': 'submitted',
                    'submitted_at': datetime.now().isoformat(),
                    'boatzincs_order_id': checkout_result.get('order_number')
                }).eq('id', order_id).execute()

            await self.close_browser()
            return checkout_result

        except Exception as e:
            logger.error(f"Failed to submit order: {e}")
            await self.close_browser()
            return {'success': False, 'error': str(e)}


async def main():
    """Main entry point for manual ordering"""
    import sys

    ordering = BoatzincsOrdering()

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == 'test-login':
            await ordering.init_browser()
            success = await ordering.login()
            print(f"Login {'successful' if success else 'failed'}")
            await ordering.close_browser()

        elif command == 'view-cart':
            await ordering.init_browser()
            await ordering.login()
            cart = await ordering.view_cart()
            print("Cart contents:")
            print(json.dumps(cart, indent=2))
            await ordering.close_browser()

        elif command == 'create-order':
            result = await ordering.create_order_from_inventory_needs()
            print(json.dumps(result, indent=2))

        elif command == 'submit-order':
            if len(sys.argv) < 3:
                print("Usage: python ordering.py submit-order <order_id> [--live]")
                return
            order_id = sys.argv[2]
            dry_run = '--live' not in sys.argv
            result = await ordering.submit_order(order_id, dry_run=dry_run)
            print(json.dumps(result, indent=2))

        else:
            print(f"Unknown command: {command}")

    else:
        print("Boatzincs Ordering System - Manual Commands")
        print("Usage: python ordering.py [command]")
        print("Commands:")
        print("  test-login     - Test login to Boatzincs")
        print("  view-cart      - View current cart contents")
        print("  create-order   - Create order from inventory needs")
        print("  submit-order   - Submit a draft order (add --live for real order)")


if __name__ == "__main__":
    asyncio.run(main())