# Inventory Management System

A comprehensive inventory management system for Boatzincs catalog, inventory tracking, order management, and automated synchronization with external sources.

## Core Application Files

### Main Application
- **inventory.html** - Main application interface with catalog, inventory, orders, sync, and reports views
- **inventory.js** - Core application logic (AnodeManager class)
- **inventory.css** - Application styling
- **inventory-manager.js** - Backend inventory management and data operations

### AI Assistant
- **ai-assistant.html** - AI-powered product information assistant interface
- **ai-assistant.js** - AI assistant logic and Google Gemini integration
- **ai-assistant.css** - AI assistant styling
- **gemini-service.js** - Google Gemini API service wrapper

### Authentication & Configuration
- **auth.js** - Supabase authentication management
- **config.js** - Application configuration (Supabase, API keys)
- **AUTH_README.md** - Authentication setup documentation

### Utilities
- **url-scraper.js** - URL scraping utilities
- **validate-api.js** - API validation utilities
- **check-quota.js** - API quota checking

## Database

- **setup-inventory-database.sql** - Complete database schema and setup
- **test-inventory-setup.mjs** - Database setup verification script

## Anode System (Python Scraper)

- **anode-system/** - Python-based web scraping system for automated product data collection
  - Playwright-based scraper
  - Database integration
  - Automated scheduling

## Testing & Development

- **test-manual-anode.html** - Manual anode entry testing
- **test-anode-updates.html** - Anode update testing
- **test-anode-debug.png** - Debug screenshot
- **test-anode-simple.png** - Simple test screenshot
- **test-extract-product.html** - Product extraction testing
- **test-gemini-direct.html** - Direct Gemini API testing
- **test-amazon-url.html** - Amazon URL testing

## Documentation

- **INVENTORY_SETUP_GUIDE.md** - Initial setup guide
- **INVENTORY_SYSTEM_REVIEW.md** - System architecture review
- **INVENTORY_IMPROVEMENTS_COMPLETE.md** - Completed improvements log

## Getting Started

1. Set up Supabase database using `setup-inventory-database.sql`
2. Configure `config.js` with your Supabase credentials
3. Open `inventory.html` in a web browser
4. Log in using Supabase authentication

## Features

- **Catalog Management** - Browse and manage Boatzincs product catalog
- **Inventory Tracking** - Real-time inventory levels and stock alerts
- **Order Management** - Track orders and fulfillment
- **Automated Sync** - Python scraper for automated product data updates
- **AI Assistant** - Google Gemini-powered product information assistant
- **Reports** - Inventory analytics and reporting
