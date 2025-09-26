#!/bin/bash

# Boatzincs Scraper Manual Trigger Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/../.."
SCRAPER_DIR="$SCRIPT_DIR/../scraper"

echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Boatzincs Anode Scraper Control   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""

# Check if virtual environment exists
if [ ! -d "$PROJECT_ROOT/venv" ]; then
    echo -e "${YELLOW}Virtual environment not found. Creating...${NC}"
    python3 -m venv "$PROJECT_ROOT/venv"
    source "$PROJECT_ROOT/venv/bin/activate"
    pip install -r "$SCRAPER_DIR/requirements.txt"
    playwright install chromium
else
    source "$PROJECT_ROOT/venv/bin/activate"
fi

# Function to run scraper
run_scraper() {
    local command=$1
    echo -e "${YELLOW}Starting $command scraper...${NC}"
    cd "$SCRAPER_DIR"
    python boatzincs_scraper.py "$command"
    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ Scraping completed successfully${NC}"
    else
        echo -e "${RED}✗ Scraping failed with exit code $exit_code${NC}"
    fi

    return $exit_code
}

# Function to run ordering
run_ordering() {
    local command=$1
    shift
    echo -e "${YELLOW}Running ordering command: $command${NC}"
    cd "$SCRAPER_DIR"
    python ordering.py "$command" "$@"
    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ Command completed successfully${NC}"
    else
        echo -e "${RED}✗ Command failed with exit code $exit_code${NC}"
    fi

    return $exit_code
}

# Main menu
show_menu() {
    echo "Select an operation:"
    echo ""
    echo "  ${GREEN}SCRAPING:${NC}"
    echo "  1) Full Catalog Sync     - Complete scrape of all products"
    echo "  2) Price Update Only     - Quick price check for existing products"
    echo ""
    echo "  ${GREEN}ORDERING:${NC}"
    echo "  3) Test Login           - Verify Boatzincs credentials"
    echo "  4) View Cart            - Show current cart contents"
    echo "  5) Create Reorder       - Generate order from inventory needs"
    echo "  6) Submit Order (DRY)   - Test order submission (no actual order)"
    echo ""
    echo "  ${GREEN}UTILITIES:${NC}"
    echo "  7) Check Environment    - Verify configuration"
    echo "  8) View Recent Logs     - Show recent scraper logs"
    echo ""
    echo "  0) Exit"
    echo ""
    echo -n "Enter choice: "
}

# Check environment
check_environment() {
    echo -e "${YELLOW}Checking environment...${NC}"
    echo ""

    # Check Python
    echo -n "Python: "
    python --version

    # Check Playwright
    echo -n "Playwright: "
    python -c "import playwright; print(playwright.__version__)" 2>/dev/null || echo "Not installed"

    # Check Supabase connection
    echo -n "Supabase: "
    if [ -f "$PROJECT_ROOT/.env" ]; then
        if grep -q "SUPABASE_URL" "$PROJECT_ROOT/.env"; then
            echo -e "${GREEN}Configured${NC}"
        else
            echo -e "${RED}Not configured${NC}"
        fi
    else
        echo -e "${RED}.env file not found${NC}"
    fi

    # Check Boatzincs credentials
    echo -n "Boatzincs: "
    if [ -f "$PROJECT_ROOT/.env" ]; then
        if grep -q "BOATZINCS_USERNAME" "$PROJECT_ROOT/.env"; then
            echo -e "${GREEN}Credentials found${NC}"
        else
            echo -e "${YELLOW}Credentials not set${NC}"
        fi
    fi

    echo ""
}

# View logs
view_logs() {
    echo -e "${YELLOW}Recent scraper logs:${NC}"
    echo ""

    if [ -d "$SCRAPER_DIR/data/logs" ]; then
        # Show last 5 log files
        ls -lt "$SCRAPER_DIR/data/logs"/*.log 2>/dev/null | head -5 | while read -r line; do
            echo "  $line"
        done

        echo ""
        echo -n "View a log file? (enter filename or press Enter to skip): "
        read logfile
        if [ -n "$logfile" ]; then
            if [ -f "$SCRAPER_DIR/data/logs/$logfile" ]; then
                tail -50 "$SCRAPER_DIR/data/logs/$logfile"
            else
                echo -e "${RED}Log file not found${NC}"
            fi
        fi
    else
        echo "No logs found"
    fi

    echo ""
}

# Main loop
while true; do
    show_menu
    read choice

    case $choice in
        1)
            echo ""
            echo -e "${YELLOW}WARNING: Full catalog sync may take 30-60 minutes${NC}"
            echo -n "Continue? (y/n): "
            read confirm
            if [ "$confirm" = "y" ]; then
                run_scraper "full"
            fi
            ;;
        2)
            echo ""
            run_scraper "prices"
            ;;
        3)
            echo ""
            run_ordering "test-login"
            ;;
        4)
            echo ""
            run_ordering "view-cart"
            ;;
        5)
            echo ""
            run_ordering "create-order"
            ;;
        6)
            echo ""
            echo -e "${YELLOW}This is a DRY RUN - no actual order will be placed${NC}"
            echo -n "Enter order ID: "
            read order_id
            if [ -n "$order_id" ]; then
                run_ordering "submit-order" "$order_id"
            fi
            ;;
        7)
            echo ""
            check_environment
            ;;
        8)
            echo ""
            view_logs
            ;;
        0)
            echo ""
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo ""
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac

    echo ""
    echo "Press Enter to continue..."
    read
    clear
done