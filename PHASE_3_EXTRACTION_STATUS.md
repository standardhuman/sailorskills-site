# Phase 3: Git Subtree Extraction - STATUS REPORT

**Date:** October 1, 2025
**Current Progress:** 60% Complete

---

## What We've Accomplished

### ✅ Completed Extractions

1. **sailorskills-estimator** - COMPLETE
   - Branch created: `estimator-standalone`
   - Code merged and pushed to GitHub
   - Contains: diving.html, calculator.js, checkoutHandler.js, formHandler.js, state.js, style.css, configuration.js
   - URL: https://github.com/standardhuman/sailorskills-estimator

2. **sailorskills-schedule** - COMPLETE
   - Branch created: `schedule-standalone`
   - Code merged and pushed to GitHub
   - Contains: schedule.html, schedule.js, schedule.css, admin.html, settings.html
   - URL: https://github.com/standardhuman/sailorskills-schedule

3. **sailorskills-billing** - COMPLETE
   - Branch created: `billing-standalone`
   - Code merged and pushed to GitHub
   - Contains: admin.html, admin.js, admin-wizard.js, admin-payment.js, admin.css, dashboard.html, setup-admin.sql
   - URL: https://github.com/standardhuman/sailorskills-billing

### ⚠️ Partially Complete

4. **sailorskills-inventory** - MERGE CONFLICT
   - Branch created: `inventory-standalone`
   - Code extracted successfully
   - **Issue:** README.md merge conflict
   - **Status:** Needs manual resolution
   - **Location:** `/Users/brian/app-development/sailorskills-repos/sailorskills-inventory/`
   - **Conflict:** Two different README.md files (initial setup vs extracted code)

### ⏳ Not Yet Started

5. **sailorskills-video** - PENDING
   - Branch created: `video-standalone` ✅
   - Code extracted from monorepo ✅
   - **Needs:** Merge to repo and push

6. **sailorskills-admin** - PENDING
   - Branch created: `admin-standalone` ✅
   - Code extracted from monorepo ✅
   - **Needs:** Merge to repo and push

7. **sailorskills-shared** - NOT STARTED
   - No code to extract yet (will be built from scratch)
   - Currently just has README, .gitignore, package.json

---

## Next Steps to Complete Phase 3

### Step 1: Resolve Inventory Merge Conflict

```bash
cd /Users/brian/app-development/sailorskills-repos/sailorskills-inventory

# Check conflict status
git status

# Option A: Keep monorepo README (more detailed)
git checkout --theirs README.md
git add README.md
git commit -m "Merge inventory code from monorepo with preserved history"
git push origin main

# Option B: Merge both READMEs manually
# Edit README.md to combine best of both versions
git add README.md
git commit -m "Merge inventory code from monorepo with preserved history"
git push origin main
```

**Recommendation:** Use Option A (keep the detailed README from monorepo that documents all files)

### Step 2: Complete Video Extraction

```bash
cd /Users/brian/app-development/sailorskills-repos/sailorskills-video

# Add monorepo remote
git remote add monorepo /Users/brian/app-development/sailorskills

# Fetch and merge
git fetch monorepo video-standalone
git merge --allow-unrelated-histories monorepo/video-standalone -m "Merge video code from monorepo with preserved history"

# Push to GitHub
git push origin main
```

### Step 3: Complete Admin Extraction

```bash
cd /Users/brian/app-development/sailorskills-repos/sailorskills-admin

# Add monorepo remote
git remote add monorepo /Users/brian/app-development/sailorskills

# Fetch and merge
git fetch monorepo admin-standalone
git merge --allow-unrelated-histories monorepo/admin-standalone -m "Merge admin code from monorepo with preserved history"

# Push to GitHub
git push origin main
```

### Step 4: Verify All Extractions

```bash
# Check each repo has code
cd /Users/brian/app-development/sailorskills-repos
for repo in sailorskills-*; do
    echo "=== $repo ==="
    cd $repo
    ls -la | head -10
    echo ""
    cd ..
done
```

### Step 5: Clean Up Monorepo Branches

```bash
cd /Users/brian/app-development/sailorskills

# Delete the standalone branches (they're now in separate repos)
git branch -D estimator-standalone
git branch -D schedule-standalone
git branch -D billing-standalone
git branch -D inventory-standalone
git branch -D video-standalone
git branch -D admin-standalone
```

---

## Repository Status Summary

| Repository | GitHub URL | Code Extracted | Merged | Pushed | Status |
|------------|-----------|----------------|--------|--------|--------|
| estimator | [link](https://github.com/standardhuman/sailorskills-estimator) | ✅ | ✅ | ✅ | **COMPLETE** |
| schedule | [link](https://github.com/standardhuman/sailorskills-schedule) | ✅ | ✅ | ✅ | **COMPLETE** |
| billing | [link](https://github.com/standardhuman/sailorskills-billing) | ✅ | ✅ | ✅ | **COMPLETE** |
| inventory | [link](https://github.com/standardhuman/sailorskills-inventory) | ✅ | ⚠️ | ❌ | **CONFLICT** |
| video | [link](https://github.com/standardhuman/sailorskills-video) | ✅ | ❌ | ❌ | **PENDING** |
| admin | [link](https://github.com/standardhuman/sailorskills-admin) | ✅ | ❌ | ❌ | **PENDING** |
| shared | [link](https://github.com/standardhuman/sailorskills-shared) | N/A | N/A | ✅ | **READY** |

---

## After Phase 3 is Complete

### Phase 4: Build Shared Infrastructure

**Goal:** Create the `sailorskills-shared` package with common code

**Tasks:**
1. Extract common authentication logic from existing products
2. Create shared UI components (buttons, modals, forms)
3. Extract Supabase utilities
4. Extract Stripe integration helpers
5. Set up as npm package or git submodule
6. Update all product repos to use shared package

**Estimated Time:** 3-4 hours

### Phase 5: Independent Deployments

**Goal:** Deploy each product to its own Vercel subdomain

**Tasks:**
1. Configure Vercel projects for each repo
2. Set up subdomains:
   - estimator: sailorskills.com/diving (keep current)
   - schedule: schedule.sailorskills.com
   - billing: billing.sailorskills.com
   - inventory: inventory.sailorskills.com
   - video: video.sailorskills.com
   - admin: admin.sailorskills.com
3. Configure environment variables per deployment
4. Test cross-product integration
5. Set up CI/CD pipelines

**Estimated Time:** 2-3 hours

### Phase 6: Multi-Instance Claude Code Workflow

**Goal:** Open separate Claude Code instances for parallel development

**Tasks:**
1. Clone each repo to separate directories (already done in `/Users/brian/app-development/sailorskills-repos/`)
2. Open 6 separate Claude Code windows
3. Verify each instance can work independently
4. Test workflow: Make changes in one repo, verify no conflicts
5. Document workflow for future development

**Estimated Time:** 1 hour

---

## Key Locations

**Monorepo (Original):**
- Path: `/Users/brian/app-development/sailorskills/`
- Git Remote: https://github.com/standardhuman/costcalc.git
- Status: Still the active development repo (for now)

**Individual Repos (New):**
- Path: `/Users/brian/app-development/sailorskills-repos/`
- Contains: 7 cloned repos (estimator, schedule, billing, inventory, video, admin, shared)
- Status: Being populated with extracted code

---

## Important Notes

1. **Monorepo Still Active**: Continue using `/sailorskills/` for development until all extractions complete
2. **Git History Preserved**: All `git subtree split` operations preserve full commit history
3. **No Code Lost**: Original code remains in monorepo, extractions are copies
4. **Merge Conflicts Normal**: README conflicts expected (we created READMEs before extraction)

---

## Troubleshooting

### If Extraction Fails

```bash
# Check if branch exists
cd /Users/brian/app-development/sailorskills
git branch | grep standalone

# Re-extract if needed
git subtree split --prefix=DIRECTORY_NAME -b PRODUCT-standalone --rejoin
```

### If Merge Fails

```bash
# Abort and retry
git merge --abort

# Try with different strategy
git merge --allow-unrelated-histories --strategy=ours monorepo/PRODUCT-standalone
```

### If Push Fails

```bash
# Check remote
git remote -v

# Force push if needed (ONLY on first setup)
git push origin main --force
```

---

## Timeline Estimate

- **Remaining Phase 3 Work:** 30 minutes (resolve conflict + complete video/admin)
- **Phase 4 (Shared Package):** 3-4 hours
- **Phase 5 (Deployments):** 2-3 hours
- **Phase 6 (Multi-Instance):** 1 hour

**Total Remaining:** ~7-9 hours of work

---

## Success Criteria

Phase 3 complete when:
- [x] Estimator repo has all code ✅
- [x] Schedule repo has all code ✅
- [x] Billing repo has all code ✅
- [ ] Inventory repo has all code (conflict needs resolution)
- [ ] Video repo has all code
- [ ] Admin repo has all code
- [ ] Shared repo has initial structure ✅
- [ ] All repos pushed to GitHub
- [ ] Git history preserved in all repos

**Current:** 4/8 complete (50%)
**After resolving inventory + merging video/admin:** 7/8 complete (87.5%)

---

*Last Updated: October 1, 2025 - End of Session*
*Next Session: Resolve inventory conflict, complete video/admin extraction*
