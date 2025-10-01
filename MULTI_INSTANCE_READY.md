# Multi-Instance Claude Code Workflow - READY ✅

**Date:** October 1, 2025
**Status:** All repos configured with CLAUDE.md guidance files

---

## Overview

Each of the 6 product repositories now has a comprehensive CLAUDE.md file that provides complete guidance to Claude Code instances working in that repo.

---

## Repository Status

| Repo | CLAUDE.md | Deployment | GitHub | Status |
|------|-----------|------------|--------|--------|
| **estimator** | ✅ | ✅ | https://github.com/standardhuman/sailorskills-estimator | Ready |
| **schedule** | ✅ | ✅ | https://github.com/standardhuman/sailorskills-schedule | Ready |
| **billing** | ✅ | ✅ | https://github.com/standardhuman/sailorskills-billing | Ready |
| **inventory** | ✅ | ✅ | https://github.com/standardhuman/sailorskills-inventory | Ready |
| **video** | ✅ | ⏳ | https://github.com/standardhuman/sailorskills-video | Ready |
| **admin** | ✅ | ✅ | https://github.com/standardhuman/sailorskills-admin | Ready |

---

## What Each CLAUDE.md Contains

### Common Elements (All Repos)
1. ✅ **Testing Directive:** "Always test with Playwright MCP"
2. ✅ **Git Directive:** "Always push to GitHub after testing"
3. ✅ **Product Overview:** Role, tagline, purpose
4. ✅ **Tech Stack:** Technologies and frameworks
5. ✅ **Deployment Info:** Vercel URL and auto-deploy
6. ✅ **Environment Variables:** Required config
7. ✅ **Shared Package:** Git submodule usage
8. ✅ **Integration Points:** How products connect
9. ✅ **Development Workflow:** Step-by-step process
10. ✅ **Common Tasks:** Typical operations
11. ✅ **Troubleshooting:** Known issues & solutions

### Product-Specific Content

**Estimator:**
- Vite build configuration
- Stripe checkout integration
- Supabase booking creation
- Pricing calculator logic

**Schedule:**
- Google Calendar API
- Booking management (customer + admin)
- Availability checking
- Business hours configuration

**Billing:**
- Stripe payment processing
- Invoice generation workflow
- Payment method management
- Customer wizard

**Inventory:**
- Gemini AI assistant
- Boatzincs scraper documentation
- Low stock alert system
- Anode management

**Video:**
- Already had comprehensive CLAUDE.md ✅
- Flask + Python architecture
- YouTube upload workflow
- Mobile app planning

**Admin:**
- Master dashboard architecture
- Cross-product data aggregation
- Analytics & reporting
- Development roadmap

---

## Launch Instructions

### Step 1: Open Terminal Windows

Open 6 separate terminal windows/tabs:

```bash
# Terminal 1: Estimator
cd /Users/brian/app-development/sailorskills-repos/sailorskills-estimator
claude

# Terminal 2: Schedule
cd /Users/brian/app-development/sailorskills-repos/sailorskills-schedule
claude

# Terminal 3: Billing
cd /Users/brian/app-development/sailorskills-repos/sailorskills-billing
claude

# Terminal 4: Inventory
cd /Users/brian/app-development/sailorskills-repos/sailorskills-inventory
claude

# Terminal 5: Video
cd /Users/brian/app-development/sailorskills-repos/sailorskills-video
claude

# Terminal 6: Admin
cd /Users/brian/app-development/sailorskills-repos/sailorskills-admin
claude
```

### Step 2: Give Context (Optional)

Each instance will automatically read its CLAUDE.md file. You can optionally give additional context:

**Example for Estimator:**
> "Focus on the pricing calculator. The CLAUDE.md has all the details."

**Example for Inventory:**
> "Work on the low stock alert system. Check CLAUDE.md for architecture."

### Step 3: Start Development

Give each instance tasks and they'll work independently:
- No merge conflicts
- Parallel development
- Independent testing
- Separate deployments

---

## Example: Parallel Development Session

**Goal:** Add 3 features across different products

**You → Instance #1 (Estimator):**
> "Add a 'Quick Quote' button that gives rough estimates without full form"

**You → Instance #2 (Schedule):**
> "Add SMS notifications when bookings are confirmed"

**You → Instance #4 (Inventory):**
> "Add CSV export for inventory reports"

**All work simultaneously:**
- Each reads their CLAUDE.md for context
- Each tests with Playwright MCP
- Each pushes to GitHub when done
- Each deploys to Vercel independently

**Result:** 3 features complete in parallel, no conflicts!

---

## Benefits of This Setup

### 1. Context Isolation ✅
Each instance only knows about its product:
- Estimator instance doesn't see inventory code
- Schedule instance doesn't see billing logic
- Focused, efficient development

### 2. No Merge Conflicts ✅
- Separate repos = no conflicts
- Independent git history
- Clean commit logs per product

### 3. True Parallelization ✅
- Work on 6 products simultaneously
- Features complete in parallel
- Development speed multiplied

### 4. Clear Guidelines ✅
- CLAUDE.md provides complete context
- Testing requirements clear
- Git workflow defined
- Integration points documented

### 5. Independent Deployment ✅
- Each push triggers Vercel deploy
- No dependency on other products
- Fast deployment pipeline

---

## CLAUDE.md Highlights

### Testing Directive (All Repos)
```markdown
**IMPORTANT**: Always follow these steps after making code changes:

1. **Test Locally**: Run dev server and manually test
2. **Test with Playwright**: Run Playwright MCP tests to verify functionality
3. **Check Database**: Verify database operations work correctly
4. **Commit**: Commit changes with clear message
5. **Push to GitHub**: Push to `main` branch (triggers deployment)
```

### Integration Points Example (Schedule)
```markdown
### ← Estimator Product
- Receives bookings created by customer quotes
- Reads `bookings` table for new appointments
- Shares customer_id and service_type

### → Billing Product
- Marks service as completed
- Triggers invoice generation
- Updates booking status to "completed"
```

### Common Tasks Example (Billing)
```markdown
### Processing Payment
1. Find invoice
2. Click "Process Payment"
3. Select payment method
4. Confirm charge amount
5. Process payment
6. Mark invoice as paid
7. Send receipt
```

---

## Shared Package Integration

All repos have the shared package as a git submodule:

```bash
# Each repo can use shared utilities
import {
  createSupabaseClient,
  SimpleAuth,
  initStripe,
  showToast,
  createModal
} from './shared/src/index.js';
```

**Update shared package:**
```bash
cd shared
git pull origin main
cd ..
git add shared
git commit -m "Update shared package"
git push
```

---

## Coordination Strategy

Since Claude instances can't communicate directly:

### 1. Database Communication
Products share data via Supabase:
- Estimator creates bookings → Schedule reads
- Schedule completes service → Billing invoices
- All products → Admin aggregates

### 2. You as Orchestrator
Tell each instance their part:
- "Estimator: Write bookings with this schema"
- "Schedule: Read bookings with this schema"
- "Admin: Display bookings from both"

### 3. Shared Package
Common code stays in sync via git submodule:
- Auth logic shared
- UI components shared
- API clients shared

---

## Success Metrics

### Setup Complete ✅
- [x] 6 repos created
- [x] All CLAUDE.md files written
- [x] All repos deployed (except Video)
- [x] Shared package integrated
- [x] Git submodules configured

### Ready to Use ✅
- [x] Clear testing directives
- [x] Git workflow documented
- [x] Integration points defined
- [x] Common tasks documented
- [x] Troubleshooting guides included

---

## What's Next

### Immediate:
1. Open 6 Claude Code instances
2. Start parallel development
3. Test multi-instance workflow
4. Verify no conflicts

### Future Enhancements:
- Add more detailed integration tests
- Create cross-product test suites
- Build automated deployment pipelines
- Add monitoring & analytics

---

## Files Created

| Repo | CLAUDE.md Lines | Commit |
|------|----------------|---------|
| estimator | 296 | 994193d |
| schedule | 366 | 01b0b1a |
| billing | 406 | fa54d29 |
| inventory | 447 | 95a9777 |
| video | 203 (existing) | N/A |
| admin | 400 | 8a0eab5 |

**Total documentation:** ~2,118 lines of guidance across 6 repos

---

## Quick Reference

**Launch all instances:**
```bash
# Copy/paste these 6 commands into 6 terminals
cd /Users/brian/app-development/sailorskills-repos/sailorskills-estimator && claude &
cd /Users/brian/app-development/sailorskills-repos/sailorskills-schedule && claude &
cd /Users/brian/app-development/sailorskills-repos/sailorskills-billing && claude &
cd /Users/brian/app-development/sailorskills-repos/sailorskills-inventory && claude &
cd /Users/brian/app-development/sailorskills-repos/sailorskills-video && claude &
cd /Users/brian/app-development/sailorskills-repos/sailorskills-admin && claude &
```

**Production URLs:**
- Estimator: https://sailorskills-estimator-309d9lol8-brians-projects-bc2d3592.vercel.app
- Schedule: https://sailorskills-schedule-6i3ugel27-brians-projects-bc2d3592.vercel.app
- Billing: https://sailorskills-billing-l8wa7s9go-brians-projects-bc2d3592.vercel.app
- Inventory: https://sailorskills-inventory-kqes0q8hl-brians-projects-bc2d3592.vercel.app
- Admin: https://sailorskills-admin-m35uosckm-brians-projects-bc2d3592.vercel.app
- Video: TBD (Python/Flask deployment pending)

---

*Last Updated: October 1, 2025*
*Status: READY FOR MULTI-INSTANCE DEVELOPMENT* 🚀
