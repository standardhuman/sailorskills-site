# Sailor Skills Multi-Instance Launcher

## Setup Complete ✅

A launcher script has been created at:
```
/Users/brian/app-development/launch-sailorskills.sh
```

This script automatically opens 6 iTerm2 windows with Claude Code running in each product repo.

---

## Quick Start

### Option 1: Run from Terminal
```bash
/Users/brian/app-development/launch-sailorskills.sh
```

### Option 2: Launch from Spotlight (Recommended)

**One-time setup:**

1. Open **Automator** (Cmd+Space → type "Automator")

2. Create new **Application**:
   - File → New
   - Choose "Application"

3. Add **Run Shell Script**:
   - Search left sidebar for "Run Shell Script"
   - Drag it into the workflow area
   - Paste this:
     ```bash
     /Users/brian/app-development/launch-sailorskills.sh
     ```

4. Save:
   - File → Save
   - Name: `Launch Sailor Skills`
   - Location: `/Applications/`
   - Format: Application

5. **Launch anytime:**
   - Cmd+Space → type "Launch Sailor Skills" → Enter
   - Or just "Launch Sa" and it'll autocomplete

---

## What It Does

Opens 6 iTerm2 windows:

1. **💰 Estimator** → `/sailorskills-estimator/`
2. **📅 Schedule** → `/sailorskills-schedule/`
3. **💳 Billing** → `/sailorskills-billing/`
4. **📦 Inventory** → `/sailorskills-inventory/`
5. **🎥 Video** → `/sailorskills-video/`
6. **🎯 Admin** → `/sailorskills-admin/`

Each window:
- Navigates to the product repo
- Shows product name and context
- Launches Claude Code
- Reads CLAUDE.md automatically

---

## Bonus: Alfred Workflow

If you use Alfred, create a workflow:

1. Alfred Preferences → Workflows → +
2. Blank Workflow
3. Add **Keyword** input: `ss` or `launch sailors`
4. Add **Run Script** action:
   ```bash
   /Users/brian/app-development/launch-sailorskills.sh
   ```
5. Connect keyword → script
6. Now just type `ss` in Alfred!

---

## The Script

Located at: `/Users/brian/app-development/launch-sailorskills.sh`

```bash
#!/bin/bash
# Opens 6 iTerm2 windows, launches Claude Code in each product repo
# Each instance gets full product context from CLAUDE.md
```

**Make executable (if needed):**
```bash
chmod +x /Users/brian/app-development/launch-sailorskills.sh
```

---

## Full Instructions

See: `/Users/brian/app-development/launch-instructions.md`

Includes:
- Detailed setup guide
- Troubleshooting tips
- Alternative launch methods
- Quick reference

---

## Ready to Use!

Just run the script or create the Spotlight launcher, and you'll have 6 parallel Claude Code instances ready for development.

**Happy parallel coding! 🚀**
