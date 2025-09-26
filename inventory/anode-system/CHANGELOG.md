# Changelog

All notable changes to the Anode Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-19

### Added
- Initial release of standalone Anode Management System
- Complete web scraper for boatzincs.com catalog
  - Full catalog sync (all materials and categories)
  - Price-only update mode for quick checks
  - Pagination handling
  - Rate limiting and retry logic
- Order automation system
  - Login to boatzincs.com
  - Add items to cart programmatically
  - Checkout process (with dry-run mode)
  - Session management and cookie storage
- Inventory management
  - Track stock levels
  - Automatic reorder point detection
  - Location tracking
  - Inventory value reporting
- Web interface (`anode-manager.html`)
  - Browse full catalog with search/filters
  - Manage inventory levels
  - Create and track orders
  - Trigger manual syncs
  - View reports and analytics
- RESTful API endpoints
  - Catalog endpoints (list, search, details)
  - Inventory endpoints (levels, updates, reorder)
  - Order endpoints (create, list, auto-reorder)
  - Sync endpoints (trigger, status, history)
- Manual trigger system
  - Interactive bash menu
  - NPM scripts for all operations
  - No automatic scheduling (manual control only)
- Database schema
  - Complete product catalog storage
  - Price history tracking
  - Order management
  - Sync logging

### Security
- Credentials stored in environment variables
- Session cookies encrypted
- Service role key for full database access
- No automatic operations without user trigger

### Documentation
- Comprehensive README with setup instructions
- Database migration documentation
- Example configuration files
- Changelog for version tracking

## [Unreleased]

### Planned Features
- Email notifications for price changes
- Barcode/QR code generation for inventory
- Mobile app for inventory counts
- Bulk order import/export
- Advanced reporting dashboard
- Integration with shipping providers

### Known Issues
- Large catalog syncs may timeout (workaround: run in smaller batches)
- Session cookies expire after 24 hours (workaround: re-login)
- Image downloads not yet implemented (placeholder images used)

---

## Version Naming

- **Major** (1.x.x): Breaking changes, major features
- **Minor** (x.1.x): New features, backwards compatible
- **Patch** (x.x.1): Bug fixes, minor improvements

## How to Update

1. Pull latest changes
2. Check migration files for database updates
3. Run `npm run anode:install` if dependencies changed
4. Check CHANGELOG for breaking changes
5. Test in development before production