"""
Example configuration for Boatzincs Scraper
Copy this to config.py and update with your values
"""
import os
from pathlib import Path

# Supabase configuration
SUPABASE_URL = 'https://your-project.supabase.co'
SUPABASE_KEY = 'your-service-role-key-here'

# Boatzincs configuration
BOATZINCS_BASE_URL = 'https://boatzincs.com'
BOATZINCS_USERNAME = 'your-email@example.com'
BOATZINCS_PASSWORD = 'your-password'

# Scraping configuration
HEADLESS_MODE = True  # Set to False to see browser
PAGE_LOAD_TIMEOUT = 30000  # milliseconds
RATE_LIMIT_DELAY = 2  # seconds between requests
MAX_RETRIES = 3
BATCH_SIZE = 50  # Number of products to process before saving

# File paths
DATA_DIR = Path(__file__).parent / 'data'
IMAGES_DIR = DATA_DIR / 'images'
LOGS_DIR = DATA_DIR / 'logs'
CACHE_DIR = DATA_DIR / 'cache'

# Category mappings - DO NOT MODIFY
CATEGORIES = {
    'zinc': {
        'url': '/categories/zinc-anodes.html',
        'subcategories': [
            'shaft-anodes/standard',
            'shaft-anodes/metric',
            'hull-anodes',
            'engine-anodes',
            'rudder-trim-tab-anodes',
            'propeller-anodes',
            'collar-anodes',
            'sterndrive-anodes',
            'outboard-anodes',
            'bow-thruster-anodes',
            'saildrive-anodes'
        ]
    },
    'aluminum': {
        'url': '/categories/aluminum-anodes.html',
        'subcategories': [
            'shaft-anodes',
            'hull-anodes',
            'engine-anodes',
            'rudder-trim-tab-anodes',
            'propeller-anodes',
            'sterndrive-anodes',
            'outboard-anodes'
        ]
    },
    'magnesium': {
        'url': '/categories/magnesium-anodes.html',
        'subcategories': [
            'engine-anodes',
            'hull-anodes',
            'rudder-anodes'
        ]
    }
}

# Product selectors (CSS) - DO NOT MODIFY
SELECTORS = {
    'product_grid': '.productGrid',
    'product_card': '.productGrid-item',
    'product_link': '.productCard-link',
    'product_image': '.productCard-image img',
    'product_title': '.productCard-title',
    'list_price': '.price--rrp',
    'sale_price': '.price--selling',
    'stock_status': '.productCard-stock',
    'pagination': '.pagination',
    'next_page': '.pagination-item--next a',
    'detail_sku': '.productView-sku',
    'detail_description': '.productView-description',
    'detail_specs': '.productView-info',
    'detail_stock': '.productView-stock',
    'detail_images': '.productView-images img'
}

# Logging configuration
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_LEVEL = 'INFO'  # DEBUG, INFO, WARNING, ERROR

# Export settings
EXPORT_FORMAT = 'json'  # json, csv, or both
EXPORT_DIR = DATA_DIR / 'exports'