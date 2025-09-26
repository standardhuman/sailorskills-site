#!/bin/bash
# Anode Scraper Cron Runner
# Add this script to crontab for automated scraping

# Set the working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables
if [ -f "../../.env" ]; then
    export $(cat ../../.env | grep -v '^#' | xargs)
fi

# Get the scrape type from argument (default to prices)
SCRAPE_TYPE=${1:-prices}

# Create log directory if it doesn't exist
mkdir -p data/logs

# Run the scraper with logging
LOG_FILE="data/logs/cron_$(date +%Y%m%d_%H%M%S).log"

echo "Starting $SCRAPE_TYPE scrape at $(date)" >> "$LOG_FILE"
python3 boatzincs_scraper.py "$SCRAPE_TYPE" >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "Scrape completed successfully at $(date)" >> "$LOG_FILE"
else
    echo "Scrape failed with exit code $EXIT_CODE at $(date)" >> "$LOG_FILE"
fi

# Rotate logs - keep only last 30 days
find data/logs -name "cron_*.log" -mtime +30 -delete

exit $EXIT_CODE