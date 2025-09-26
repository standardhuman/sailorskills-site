# Anode Management System

A standalone system for scraping, managing, and ordering anodes from boatzincs.com. This system operates independently but can integrate with the existing admin and diving pages.

## Features

- **Complete Product Catalog**: Scrapes and maintains the full boatzincs.com anode catalog
- **Price Tracking**: Monitors price changes and sale items
- **Inventory Management**: Track stock levels with automatic reorder points
- **Order Automation**: Login to boatzincs.com and create orders programmatically
- **Manual Triggers**: All operations are manually triggered (no automatic scheduling)
- **Standalone Web Interface**: Separate management interface at `/anode-manager.html`
- **RESTful API**: Integration endpoints for future use with admin/diving pages

## Quick Start

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
npm run anode:install
```

### 2. Configure Environment

Add to your `.env` file:

```env
# Supabase (required)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Boatzincs (optional - for ordering)
BOATZINCS_USERNAME=your_email
BOATZINCS_PASSWORD=your_password
```

### 3. Set Up Database

Run the migration in your Supabase dashboard:

```sql
-- Run the migration file:
anode-system/database/migrations/003_anode_system.sql
```

### 4. Run Manual Commands

```bash
# Interactive menu
npm run anode:menu

# Direct commands
npm run scrape:anodes      # Full catalog sync (30-60 min)
npm run scrape:prices      # Price update only (5-10 min)
npm run order:generate     # Create reorder from inventory
npm run order:submit       # Submit order to boatzincs

# Check environment
npm run anode:check
```

## Directory Structure

```
anode-system/
├── scraper/              # Python scraping and ordering
│   ├── boatzincs_scraper.py
│   ├── ordering.py
│   └── config.py
├── database/            # Database schema
│   └── migrations/
├── api/                 # Node.js API endpoints
│   └── anode-api.js
├── web/                 # Standalone web interface
│   ├── anode-manager.html
│   ├── anode-manager.js
│   └── anode-manager.css
└── scripts/             # Manual trigger scripts
    ├── run-scraper.sh
    └── manual-triggers.js
```

## Web Interface

Access the standalone interface at:

```
http://localhost:3000/anode-system/web/anode-manager.html
```

Features:
- Browse full catalog with search/filters
- Manage inventory levels
- Create and track orders
- Trigger manual syncs
- View reports and analytics

## API Endpoints

The system provides RESTful endpoints for integration:

### Catalog
- `GET /api/anodes/catalog` - List all products
- `GET /api/anodes/catalog/:id` - Get product details
- `GET /api/anodes/catalog/search/:query` - Search products

### Inventory
- `GET /api/anodes/inventory` - Get inventory levels
- `PUT /api/anodes/inventory/:id` - Update inventory
- `GET /api/anodes/inventory/reorder` - Get reorder report

### Orders
- `GET /api/anodes/orders` - List orders
- `POST /api/anodes/orders` - Create order
- `POST /api/anodes/orders/auto-reorder` - Create automatic reorder

### Sync
- `POST /api/anodes/sync` - Trigger manual sync
- `GET /api/anodes/sync/:id` - Check sync status

## Manual Scraping

### Full Catalog Sync

Scrapes the entire boatzincs.com catalog:

```bash
npm run scrape:anodes
```

- Takes 30-60 minutes
- Scrapes all categories (zinc, aluminum, magnesium)
- Updates product details, prices, and images
- Records price history

### Price Update

Quick price check for existing products:

```bash
npm run scrape:prices
```

- Takes 5-10 minutes
- Only updates prices for products already in database
- Records price changes

## Ordering System

### Test Login

Verify credentials work:

```bash
npm run anode:menu
# Select option 3 (Test Login)
```

### Create Reorder

Generate order based on inventory levels:

```bash
npm run order:generate
```

### Submit Order

Submit a draft order (dry run by default):

```bash
npm run order:submit
# Enter order ID when prompted
# Choose dry run or live submission
```

## Integration with Existing System

The anode system is designed to be standalone but can integrate with your existing admin and diving pages through:

1. **Shared Database**: Uses same Supabase instance
2. **API Endpoints**: RESTful API for data access
3. **JavaScript Integration**: Can import catalog data

Example integration in admin.js:

```javascript
// Fetch anode catalog
const response = await fetch('/api/anodes/catalog?material=zinc&category=shaft');
const anodes = await response.json();

// Use in existing anode picker
this.anodeCatalog = anodes.data;
```

## Database Schema

Key tables:
- `anodes_catalog` - Complete product catalog
- `anode_inventory` - Stock levels and locations
- `anode_orders` - Order management
- `anode_price_history` - Price tracking
- `anode_sync_logs` - Scraping history

## Troubleshooting

### Python/Playwright Issues

```bash
# Reinstall dependencies
cd anode-system/scraper
pip install -r requirements.txt
playwright install chromium
```

### Database Connection

Check `.env` file has correct Supabase credentials:

```bash
npm run anode:check
```

### Scraping Errors

- Check logs in `anode-system/scraper/data/logs/`
- Verify boatzincs.com is accessible
- Try running with headless mode off (edit config.py)

## Security Notes

- Boatzincs credentials are stored in `.env` (never commit)
- All scraping is manual trigger only
- Use service role key for full database access
- Session cookies are stored encrypted

## Future Enhancements

- [ ] Scheduled scraping (currently manual only)
- [ ] Email notifications for price changes
- [ ] Automatic order submission
- [ ] Image caching and CDN
- [ ] Barcode/QR code generation
- [ ] Mobile app for inventory counts