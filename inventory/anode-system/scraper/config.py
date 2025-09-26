"""
Complete configuration for Boatzincs Scraper with all subcategories
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(env_path)

# Supabase configuration
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')  # Use service role for full access

# Boatzincs configuration
BOATZINCS_BASE_URL = 'https://boatzincs.com'
BOATZINCS_USERNAME = os.getenv('BOATZINCS_USERNAME', '')
BOATZINCS_PASSWORD = os.getenv('BOATZINCS_PASSWORD', '')

# Scraping configuration
HEADLESS_MODE = os.getenv('SCRAPER_HEADLESS', 'true').lower() == 'true'
PAGE_LOAD_TIMEOUT = 30000  # milliseconds
RATE_LIMIT_DELAY = 2  # seconds between requests
MAX_RETRIES = 3
BATCH_SIZE = 50  # Number of products to process before saving

# File paths
DATA_DIR = Path(__file__).parent / 'data'
IMAGES_DIR = DATA_DIR / 'images'
LOGS_DIR = DATA_DIR / 'logs'
CACHE_DIR = DATA_DIR / 'cache'

# Create directories if they don't exist
for directory in [DATA_DIR, IMAGES_DIR, LOGS_DIR, CACHE_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Complete category mappings with all subcategories
CATEGORIES = {
    'zinc': {
        'url': '/categories/zinc-anodes.html',
        'subcategories': [
            # Shaft Anodes
            'shaft-anodes/standard',
            'shaft-anodes/metric',

            # Hull Anodes
            'hull-anodes/bolt-on',
            'hull-anodes/weld-on',
            'hull-anodes/plates',

            # Rudder & Trim Tab
            'rudder-trim-tab-anodes-two-piece',
            'one-piece-trim-tab-anodes',
            'rudder-trim-tab-anodes/other',

            # Collar Anodes
            'collar-anodes/standard',
            'collar-anodes/metric',
            'collar-anodes/beneteau',
            'collar-anodes/micro-thin',

            # Engine Anodes
            'engine-anodes/caterpillar',
            'engine-anodes/chrysler',
            'engine-anodes/cummins',
            'engine-anodes/crusader',
            'engine-anodes/detroit-diesel',
            'engine-anodes/john-deere',
            'engine-anodes/universal',
            'engine-anodes/westerbeke',
            'engine-anodes/yanmar',

            # Propeller Anodes
            'propeller-anodes/prop-nut-anodes',
            'propeller-anodes/acorn',
            'propeller-anodes/autoprop',
            'propeller-anodes/autostream',
            'propeller-anodes/azimut-radice',
            'propeller-anodes/beneteau',
            'propeller-anodes/gori',
            'propeller-anodes/max-prop',
            'propeller-anodes/michigan',
            'propeller-anodes/radice',
            'propeller-anodes/varifold',
            'propeller-anodes/volvo-folding',

            # Sterndrive Anodes
            'sterndrive-anodes/mercruiser',
            'sterndrive-anodes/omc',
            'sterndrive-anodes/volvo-penta',

            # Outboard Anodes
            'outboard-anodes/honda',
            'outboard-anodes/johnson-evinrude',
            'outboard-anodes/mercury',
            'outboard-anodes/nissan-tohatsu',
            'outboard-anodes/suzuki',
            'outboard-anodes/yamaha',

            # Saildrive Anodes
            'saildrive-anodes/bukh',
            'saildrive-anodes/max-prop',
            'saildrive-anodes/volvo-penta',
            'saildrive-anodes/yanmar',

            # Jet Drive Anodes
            'jet-drive-anodes/hamilton-jet',
            'jet-drive-anodes/ultrajet',

            # Bow Thruster Anodes
            'bow-thruster-anodes/lewmar',
            'bow-thruster-anodes/max-power',
            'bow-thruster-anodes/side-power',
            'bow-thruster-anodes/sleipner',
            'bow-thruster-anodes/vetus',

            # Keel Cooler Anodes
            'keel-cooler-anodes/duramax',
            'keel-cooler-anodes/fernstrum',
            'keel-cooler-anodes/walter',

            # Commercial Anodes
            'commercial-anodes/divers-anodes',
            'commercial-anodes/teardrop-anodes',

            # Other Pleasurecraft Anodes
            'pleasurecraft-anodes/berkley-jet',
            'pleasurecraft-anodes/hardin-marine',
            'pleasurecraft-anodes/jet-boat',
            'pleasurecraft-anodes/sea-doo',
        ]
    },
    'aluminum': {
        'url': '/categories/aluminum-anodes.html',
        'subcategories': [
            'shaft-anodes/standard',
            'shaft-anodes/metric',
            'hull-anodes/bolt-on',
            'hull-anodes/weld-on',
            'rudder-trim-tab-anodes',
            'engine-anodes',
            'propeller-anodes',
            'sterndrive-anodes/mercruiser',
            'sterndrive-anodes/omc',
            'sterndrive-anodes/volvo-penta',
            'outboard-anodes/honda',
            'outboard-anodes/mercury',
            'outboard-anodes/yamaha',
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

# Product selectors (CSS)
SELECTORS = {
    'product_grid': '.productGrid',
    'product_card': '.product',
    'product_link': '.card-title a',
    'product_image': 'img',
    'product_title': '.card-title',
    'list_price': '.price--rrp',
    'sale_price': '.price--withoutTax',
    'our_price': '.our_price .price',
    'stock_status': '.stock-status',
    'pagination': '.pagination',
    'next_page': '.pagination-item--next a',

    # Product detail page
    'detail_sku': '.productView-info-value',
    'detail_description': '.productView-description',
    'detail_specs': '.productView-info',
    'detail_stock': '.productView-stock',
    'detail_images': '.productView-images img'
}

# Logging configuration
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# Export settings
EXPORT_FORMAT = 'json'  # json, csv, or both
EXPORT_DIR = DATA_DIR / 'exports'
EXPORT_DIR.mkdir(parents=True, exist_ok=True)