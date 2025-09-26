# Anode Scraper Scheduling Guide

This guide explains how to set up automated scheduling for the Boatzincs anode scraper.

## Schedule Overview

The recommended schedule is:
- **Full Catalog Scrape**: Weekly (Sunday at 2 AM)
- **Price Updates**: Twice daily (8 AM and 8 PM)

## Option 1: Cron (Linux/Mac)

### Setup Steps

1. Make the cron runner executable:
   ```bash
   chmod +x anode-system/scraper/cron_runner.sh
   ```

2. Edit your crontab:
   ```bash
   crontab -e
   ```

3. Add these lines (update paths to match your system):
   ```cron
   # Price update - Twice daily at 8 AM and 8 PM
   0 8,20 * * * /path/to/cost-calculator/anode-system/scraper/cron_runner.sh prices

   # Full catalog scrape - Weekly on Sunday at 2 AM
   0 2 * * 0 /path/to/cost-calculator/anode-system/scraper/cron_runner.sh full
   ```

4. Verify crontab is saved:
   ```bash
   crontab -l
   ```

### Monitoring

Check logs in `anode-system/scraper/data/logs/cron_*.log`

## Option 2: Python Scheduler

### Setup Steps

1. Install dependencies:
   ```bash
   cd anode-system/scraper
   pip install -r requirements.txt
   ```

2. Run the scheduler:
   ```bash
   python scheduler.py
   ```

3. Keep it running with `screen` or `tmux`:
   ```bash
   screen -S anode-scheduler
   python anode-system/scraper/scheduler.py
   # Press Ctrl+A then D to detach
   ```

### As a Systemd Service (Linux)

1. Copy the service file:
   ```bash
   sudo cp anode-system/scraper/anode-scheduler.service /etc/systemd/system/
   ```

2. Edit the service file to update paths:
   ```bash
   sudo nano /etc/systemd/system/anode-scheduler.service
   # Update WorkingDirectory and ExecStart paths
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl enable anode-scheduler
   sudo systemctl start anode-scheduler
   ```

4. Check status:
   ```bash
   sudo systemctl status anode-scheduler
   ```

## Option 3: GitHub Actions

### Setup Steps

1. Go to your GitHub repository settings
2. Navigate to Secrets and variables > Actions
3. Add these repository secrets:
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `BOATZINCS_USERNAME`
   - `BOATZINCS_PASSWORD`

4. The workflow will run automatically based on the schedule
5. You can also trigger manually from Actions tab

### Benefits
- No server required
- Automatic logs and history
- Easy monitoring through GitHub UI

## Option 4: Manual npm Scripts

For manual or development use:

```bash
# Full catalog scrape
npm run scrape:anodes

# Price update only
npm run scrape:prices
```

## Monitoring & Logs

### Check Sync Status in Supabase

Query the `anode_sync_logs` table:
```sql
SELECT * FROM anode_sync_logs
ORDER BY started_at DESC
LIMIT 10;
```

### Log Locations

- **Cron logs**: `anode-system/scraper/data/logs/cron_*.log`
- **Scheduler logs**: `anode-system/scraper/data/logs/scheduler_*.log`
- **Scraper logs**: `anode-system/scraper/data/logs/scraper_*.log`

### Health Checks

The Python scheduler includes hourly health checks. You can also set up external monitoring:

```bash
# Add to crontab for email alerts
0 * * * * /path/to/cost-calculator/anode-system/scraper/health_check.sh || mail -s "Anode Scraper Down" admin@example.com
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure scripts are executable: `chmod +x *.sh`
   - Check file ownership matches the user running the cron/service

2. **Module Not Found**
   - Install dependencies: `pip install -r requirements.txt`
   - Use full Python path in cron: `/usr/bin/python3`

3. **Supabase Connection Failed**
   - Verify `.env` file exists and has correct credentials
   - Check network connectivity

4. **Scraper Hangs**
   - Set `SCRAPER_HEADLESS=true` in environment
   - Increase timeout in `config.py`

### Testing

Test the scraper manually before scheduling:
```bash
cd anode-system/scraper
python boatzincs_scraper.py prices
```

Check cron syntax:
```bash
# Test cron expression
echo "0 8,20 * * *" | crontab -l
```

## Recommended Setup

For production, we recommend:
1. **GitHub Actions** for cloud-based automation (no server needed)
2. **Cron** for simple server setups
3. **Systemd + Python Scheduler** for advanced monitoring needs

Choose based on your infrastructure and monitoring requirements.