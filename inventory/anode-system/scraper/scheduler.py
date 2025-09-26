#!/usr/bin/env python3
"""
Anode Scraper Scheduler
Automated scheduling for boatzincs scraper runs
"""

import schedule
import time
import subprocess
import logging
from datetime import datetime
from pathlib import Path
from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client, Client

# Set up logging
log_dir = Path(__file__).parent / 'data' / 'logs'
log_dir.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_dir / f'scheduler_{datetime.now().strftime("%Y%m%d")}.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def run_scraper(scrape_type='prices'):
    """
    Run the scraper with specified type

    Args:
        scrape_type: 'full' for complete catalog or 'prices' for price update only
    """
    logger.info(f"Starting {scrape_type} scrape")

    try:
        # Log to Supabase
        supabase.table('anode_sync_logs').insert({
            'sync_type': 'full_catalog' if scrape_type == 'full' else 'price_update',
            'status': 'started',
            'triggered_by': 'scheduler',
            'trigger_method': 'automated',
            'started_at': datetime.now().isoformat()
        }).execute()

        # Run the scraper
        script_path = Path(__file__).parent / 'boatzincs_scraper.py'
        result = subprocess.run(
            ['python3', str(script_path), scrape_type],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent
        )

        if result.returncode == 0:
            logger.info(f"{scrape_type} scrape completed successfully")
        else:
            logger.error(f"{scrape_type} scrape failed: {result.stderr}")

    except Exception as e:
        logger.error(f"Error running {scrape_type} scraper: {e}")

def health_check():
    """
    Simple health check to ensure scheduler is running
    """
    logger.info("Scheduler health check - running")

# Schedule jobs
def setup_schedule():
    """
    Configure the schedule for scraper runs
    """

    # Full catalog scrape - Once per week (Sunday at 2 AM)
    schedule.every().sunday.at("02:00").do(lambda: run_scraper('full'))

    # Price update - Twice daily (8 AM and 8 PM)
    schedule.every().day.at("08:00").do(lambda: run_scraper('prices'))
    schedule.every().day.at("20:00").do(lambda: run_scraper('prices'))

    # Health check - Every hour
    schedule.every().hour.do(health_check)

    logger.info("Schedule configured:")
    logger.info("  - Full catalog: Weekly (Sunday 2 AM)")
    logger.info("  - Price update: Daily (8 AM and 8 PM)")
    logger.info("  - Health check: Hourly")

def main():
    """
    Main scheduler loop
    """
    logger.info("Starting Anode Scraper Scheduler")

    # Set up the schedule
    setup_schedule()

    # Run initial price check on startup
    logger.info("Running initial price check...")
    run_scraper('prices')

    # Keep the scheduler running
    logger.info("Scheduler is running. Press Ctrl+C to stop.")

    while True:
        try:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            logger.info("Scheduler stopped by user")
            break
        except Exception as e:
            logger.error(f"Scheduler error: {e}")
            time.sleep(60)  # Continue running despite errors

if __name__ == "__main__":
    main()