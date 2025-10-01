# Sailor Skills SaaS Suite - Complete Restructuring Plan

**Date:** October 1, 2025
**Purpose:** Transform monorepo into multi-product SaaS suite ready for commercial sale

---

## Executive Summary

Restructuring the current `cost-calculator` monorepo into a professional multi-product SaaS suite called **Sailor Skills**, designed for marine service businesses. Products can be sold individually or as a bundle.

---

## Phase 1: Reorganize Directory Structure

### Current Structure
```
app-development/
├── BOATY/                           # Video management app
└── cost-calculator/                 # Monorepo with everything
    ├── diving/                      # Cost estimator
    ├── admin/                       # Billing for diving
    ├── inventory/                   # Inventory management
    └── schedule/                    # Scheduling
```

### Target Structure
```
app-development/
└── sailorskills/                    # Master suite directory
    ├── estimator/                   # Customer-facing cost estimates
    ├── billing/                     # Diving service invoicing & payments
    ├── inventory/                   # Inventory management
    ├── schedule/                    # Scheduling & calendar
    ├── video/                       # Video management (native + web)
    └── admin/                       # Master dashboard across all services
```

### Specific Actions
1. Rename `cost-calculator/` → `sailorskills/`
2. Rename `sailorskills/diving/` → `sailorskills/estimator/`
3. Rename `sailorskills/admin/` → `sailorskills/billing/`
4. Move `app-development/BOATY/` → `sailorskills/video/`
5. Create `sailorskills/admin/` (NEW - master dashboard)

---

## Phase 2: Create Multi-Repo Structure

### GitHub Repositories
- `sailorskills-estimator` - Customer-facing cost estimates & booking
- `sailorskills-billing` - Invoice & payment management for diving services
- `sailorskills-inventory` - Parts/supplies inventory tracking
- `sailorskills-schedule` - Calendar & scheduling system
- `sailorskills-video` - Video renaming & upload manager (web + native)
- `sailorskills-admin` - Master dashboard across all products
- `sailorskills-shared` - Shared code, auth, components

### Why Multi-Repo?
- **Parallel Claude Code instances** - No merge conflicts between products
- **Independent versioning** - Each product has its own release cycle
- **Clean licensing** - Easier to sell products individually
- **Clear boundaries** - Forces good architecture practices
- **Future-proof** - Easy to add/remove products from suite

---

## Phase 3: Extract Products from Monorepo

### Git History Preservation Strategy
```bash
# For each product, extract with full history
git subtree split --prefix=estimator -b estimator-standalone
git subtree split --prefix=billing -b billing-standalone
git subtree split --prefix=inventory -b inventory-standalone
git subtree split --prefix=schedule -b schedule-standalone
git subtree split --prefix=video -b video-standalone
```

### Per-Product Setup
- Independent `package.json` with product-specific dependencies
- Separate `README.md` documenting product purpose
- Individual `.env.example` for product configuration
- Product-specific `.gitignore` patterns

---

## Phase 4: Shared Infrastructure Package

### `sailorskills-shared` Package Contents

**Authentication:**
- Supabase client initialization
- Login/logout utilities
- Session management
- Role-based access control

**UI Components:**
- Buttons, forms, modals
- Navigation components
- Consistent styling/theme
- Shared CSS/design tokens

**Business Logic:**
- TypeScript types & interfaces
- Stripe integration utilities
- API client helpers
- Common validation functions

**Distribution:**
- Option A: Private npm package (@sailorskills/shared)
- Option B: Git submodule in each product repo

---

## Phase 5: Deployment Architecture

### Web Products (Vercel)
| Product | Public Endpoint | Purpose | Pricing |
|---------|----------------|---------|---------|
| Estimator | `sailorskills.com/diving` | Customer quotes & booking | Free (acquisition) |
| Billing | `billing.sailorskills.com` | Invoice & payment mgmt | $79/month |
| Inventory | `inventory.sailorskills.com` | Parts/supplies tracking | $49/month |
| Schedule | `schedule.sailorskills.com` | Calendar & scheduling | $39/month |
| Video | `video.sailorskills.com` | Video management (web) | $59/month |
| Admin | `admin.sailorskills.com` | Master dashboard | Bundle only |

### Mobile Products
- **Video App:** iOS & Android native app (same pricing as web version)

### Shared Backend Services
- **Database:** Single Supabase instance
  - Unified authentication (one login for all purchased products)
  - Shared customer/user tables
  - Product-specific schemas (billing_*, inventory_*, etc.)

- **Payments:** Single Stripe account
  - Tiered subscription pricing
  - Individual product subscriptions
  - Bundle discount pricing

### Integration Architecture
```
Customer Flow:
1. Visit sailorskills.com/diving (Estimator)
2. Get quote, book service, pay deposit
3. Business uses billing.sailorskills.com to manage booking
4. Admin dashboard shows metrics across all products

Cross-Product Communication:
- REST APIs between products
- Shared database for reference data
- Event-based webhooks for real-time updates
```

---

## Phase 6: Update File References

### Internal Links & Routing
- Update all `/admin/*` → `/billing/*`
- Update all `/diving/*` → keep endpoint, update internal references
- Add routing for new `/admin` dashboard

### Import Path Updates
```javascript
// Before (monorepo)
import { auth } from '../../../shared/auth.js'

// After (multi-repo)
import { auth } from '@sailorskills/shared'
```

### Configuration Files
- `vercel.json` - Update routes for each product
- `package.json` - Update dependencies per product
- Documentation - Update README files
- Environment variables - `.env.example` templates

---

## Phase 7: Claude Code Workflow

### Multi-Instance Development Strategy

**Concept:** Treat each Claude Code instance as a dedicated developer for a product

**Setup:**
1. Open 6 separate Claude Code instances
2. Each instance clones its dedicated product repo
3. All share access to `sailorskills-shared` repo

**Workflow:**
```
Claude Instance #1 → sailorskills-estimator repo
Claude Instance #2 → sailorskills-billing repo
Claude Instance #3 → sailorskills-inventory repo
Claude Instance #4 → sailorskills-schedule repo
Claude Instance #5 → sailorskills-video repo
Claude Instance #6 → sailorskills-admin repo
```

**Benefits:**
- ✅ No merge conflicts between parallel development
- ✅ Each instance has clear context/boundaries
- ✅ Faster development (true parallelization)
- ✅ Clean commit history per product

**Shared Code Updates:**
- Changes to `sailorskills-shared` get versioned
- Each product updates dependency when ready
- No forced coupling between products

---

## Product Descriptions (For Sales)

### Sailor Skills Estimator
**Tagline:** "Convert browsers into bookings"
- Customer-facing cost estimation tool
- Real-time pricing for diving, detailing, anode services
- Instant booking & payment processing
- Automated email confirmations

### Sailor Skills Billing
**Tagline:** "Manage diving services from quote to payment"
- Invoice generation & tracking
- Stripe payment processing
- Booking calendar integration
- Customer communication tools

### Sailor Skills Inventory
**Tagline:** "Never run out of parts again"
- Parts & supplies tracking
- Low stock alerts
- Automated reordering (scrapes boatzincs.com)
- AI-powered product information assistant

### Sailor Skills Schedule
**Tagline:** "Your calendar, simplified"
- Service scheduling & calendar management
- Customer appointment booking
- Team coordination
- Google Calendar integration

### Sailor Skills Video
**Tagline:** "Organize dive footage effortlessly"
- Automated video renaming
- Cloud upload management
- Mobile & desktop apps
- Customer video delivery

### Sailor Skills Admin
**Tagline:** "Mission control for your business"
- Unified dashboard across all products
- Revenue & booking analytics
- Customer management
- Business insights & reporting

---

## Pricing Strategy

### Individual Products (À la carte)
- Estimator: Free (customer acquisition tool)
- Billing: $79/month
- Inventory: $49/month
- Schedule: $39/month
- Video: $59/month

**Total if purchased separately:** $226/month

### Bundle Pricing
- **Complete Suite:** $179/month (save $47/month)
- **Includes:** All 5 paid products + Admin dashboard
- **Value prop:** Integrated workflow, unified dashboard

### Enterprise Tier
- Custom pricing
- White-label options
- Dedicated support
- Custom integrations

---

## Special Considerations

### Boatzincs References
**Keep references ONLY in:** `inventory/anode-system/scraper/`
- This scraper specifically targets boatzincs.com for product data
- All other references should use "Sailor Skills" branding

### Backwards Compatibility
- Maintain `/diving` endpoint (customer-facing URL)
- Set up redirects for any existing bookmarks/links
- Gradual migration for existing customers

### Testing Strategy
- Each product repo has independent test suite
- Integration tests in separate repo
- Playwright tests updated for new structure

---

## Success Metrics

**Restructuring Complete When:**
- ✅ All 6 product repos created with clean git history
- ✅ `sailorskills-shared` package functional
- ✅ All products deploy independently to subdomains
- ✅ Shared authentication works across products
- ✅ Claude Code instances can work in parallel
- ✅ No references to "cost-calculator" or "boatzincs" (except scraper)
- ✅ Documentation complete for each product
- ✅ Ready for first customer sale

---

## Timeline Estimate

- **Phase 1-2:** Directory & repo setup (2-3 hours)
- **Phase 3:** Git history extraction (1-2 hours)
- **Phase 4:** Shared package creation (2-3 hours)
- **Phase 5:** Deployment configuration (2-3 hours)
- **Phase 6:** File reference updates (1-2 hours)
- **Phase 7:** Testing & validation (2-3 hours)

**Total:** ~10-16 hours (can be parallelized with multiple Claude instances)

---

## Risk Mitigation

**Backup Strategy:**
- Create full backup of current monorepo before starting
- Tag current state: `git tag pre-restructure-backup`
- Can rollback if needed

**Incremental Approach:**
- Complete one product extraction fully before moving to next
- Test each product independently after extraction
- Validate shared package integration before proceeding

---

## Next Steps After Restructuring

1. **Marketing site:** Create sailorskills.com landing page
2. **Customer portal:** User account management across products
3. **Documentation:** Product guides & API docs
4. **Sales materials:** Product demos, pricing page
5. **Beta testing:** Recruit first customers
6. **Analytics:** Add tracking for product usage & metrics

---

**This plan transforms a personal project into a commercial SaaS suite ready for market.**
