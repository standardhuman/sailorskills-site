# Commit Story UI - Deployment Checklist

**Created:** 2025-10-29
**Feature Branch:** `feature/commit-story-ui`
**Status:** Ready for preview deployment and testing

---

## Automated Steps (Completed by Claude)

- [x] All code committed to feature branch
- [x] Feature branch pushed to GitHub
- [x] Working tree clean (no uncommitted changes)

---

## Manual Steps Required (User Action Needed)

### Step 1: Configure Vercel Environment Variables

**Location:** Vercel Dashboard → sailorskills-site project → Settings → Environment Variables

**Required Variables:**

1. **GITHUB_TOKEN**
   - Value: Your GitHub Personal Access Token
   - Scope: `repo` (read access to repositories)
   - How to create: GitHub Settings → Developer settings → Personal access tokens → Generate new token
   - Required for: Fetching commit data from GitHub API

2. **GEMINI_API_KEY**
   - Value: Your Gemini API key from Google AI Studio
   - How to get: https://makersuite.google.com/app/apikey
   - Required for: AI translation of commits to business language

3. **GITHUB_ORG**
   - Value: `standardhuman`
   - Required for: Specifying which GitHub organization

4. **GITHUB_REPO**
   - Value: `sailorskills-repos`
   - Required for: Specifying which repository to fetch commits from

**Important Notes:**
- Add these variables to ALL environments (Production, Preview, Development)
- Vercel may require redeployment after adding environment variables
- Keep these tokens secure - never commit them to git

---

### Step 2: Create Pull Request on GitHub

**Action Required:**

1. Visit: https://github.com/standardhuman/sailorskills-repos/pulls
2. Click "New pull request"
3. Base: `main` ← Compare: `feature/commit-story-ui`
4. Title: `[FEATURE] Add Commit Story UI for co-founder recruitment`
5. Description:
   ```markdown
   ## Summary
   - Added edge function API to fetch GitHub commits and translate via Gemini AI
   - Created React page component to display commit stories categorized by business pain points
   - Added Playwright E2E tests for commit story functionality
   - Implements Task 1-7 from commit story UI implementation plan

   ## Business Value
   Translates technical git commits into business-meaningful stories for potential co-founder hull cleaner divers

   ## Test Plan
   - [ ] Verify Vercel environment variables configured
   - [ ] Check preview deployment loads at /story route
   - [ ] Confirm API returns categorized commits
   - [ ] Test category expand/collapse functionality
   - [ ] Verify GitHub commit links work
   - [ ] Test mobile responsiveness
   - [ ] Run Playwright tests in preview environment

   Generated with Claude Code

   Co-Authored-By: Claude <noreply@anthropic.com>
   ```
6. Click "Create pull request"

---

### Step 3: Access Vercel Preview Deployment

**Expected Behavior:**
- Vercel automatically deploys all pull requests
- Check the "Checks" tab on the PR for deployment status
- Look for "Vercel - Preview" check with deployment URL

**Preview URL Pattern:**
```
https://sailorskills-site-git-feature-commit-story-ui-<team-slug>.vercel.app/story
```

Or check Vercel dashboard for the preview deployment link.

---

### Step 4: Test Preview Deployment

**Testing Checklist:**

- [ ] **Page loads successfully**
  - Navigate to preview URL + `/story`
  - Page displays header "Building SailorSkills: Solving Real Problems for Hull Cleaners"

- [ ] **API functionality works**
  - Open browser DevTools → Network tab
  - Visit `/story` page
  - Check for successful API call to `/api/commit-story`
  - Response should contain categorized commits

- [ ] **Categories display correctly**
  - At least one category section visible (Operations, Billing, Scheduling, Inventory, Communication)
  - Each category shows count of features
  - Categories can expand/collapse on click

- [ ] **Feature cards render**
  - Each card shows business impact description
  - Date badge displays (e.g., "Added Oct 2025")
  - "View commit" link present

- [ ] **GitHub links work**
  - Click "View commit" link on any feature card
  - Should open GitHub commit page in new tab
  - URL format: `https://github.com/standardhuman/sailorskills-repos/commit/{sha}`

- [ ] **Mobile responsiveness**
  - Test on mobile device or browser DevTools mobile emulation
  - Header, categories, and cards should stack properly
  - Text should be readable without horizontal scroll

- [ ] **Error handling**
  - Check browser console for errors
  - If API fails, error message should display gracefully

---

### Step 5: Run Playwright Tests (Recommended)

**From Claude Code with Playwright MCP:**

```bash
# Navigate to the worktree
cd /Users/brian/app-development/sailorskills-repos/sailorskills-site/.worktrees/commit-story

# Run commit story tests
npx playwright test tests/e2e/commit-story.spec.js

# Or run all tests
npx playwright test
```

**Expected Result:**
- All commit story tests should pass
- Tests verify: page load, categories, expansion, feature cards, GitHub links, mobile responsiveness, error handling

---

### Step 6: Merge to Main (After Testing Passes)

**Action Required:**

1. **Via GitHub PR Interface (Recommended):**
   - Go to the pull request
   - Click "Merge pull request"
   - Select merge method (Squash, Merge commit, or Rebase)
   - Confirm merge

2. **Via Command Line (Alternative):**
   ```bash
   cd /Users/brian/app-development/sailorskills-repos/sailorskills-site
   git checkout main
   git pull origin main
   git merge feature/commit-story-ui
   git push origin main
   ```

---

### Step 7: Verify Production Deployment

**Production URL:**
```
https://sailorskills-site.vercel.app/story
```

**Production Verification Checklist:**

- [ ] Navigate to production URL + `/story`
- [ ] Page loads without errors
- [ ] Commit data displays correctly
- [ ] Categories function properly
- [ ] GitHub links work
- [ ] Check Vercel dashboard for successful production deployment
- [ ] No errors in Vercel function logs

---

## Troubleshooting Guide

### Issue: API returns 500 error

**Possible Causes:**
- Environment variables not configured in Vercel
- GitHub token expired or insufficient permissions
- Gemini API key invalid

**Solutions:**
1. Check Vercel Dashboard → Settings → Environment Variables
2. Verify all 4 required variables are set
3. Test GitHub token: `curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/user`
4. Test Gemini API key in Google AI Studio
5. Redeploy after adding/updating environment variables

---

### Issue: Page shows "Loading..." forever

**Possible Causes:**
- API endpoint not responding
- CORS issues
- Network timeout

**Solutions:**
1. Open browser DevTools → Network tab
2. Check for failed `/api/commit-story` request
3. Look at response status code and error message
4. Check Vercel function logs for errors

---

### Issue: No commits displayed

**Possible Causes:**
- No milestone commits matching pattern `[FEATURE|FIX|PHASE|DOC]`
- Gemini AI filtered out all commits as internal
- GitHub API rate limiting

**Solutions:**
1. Check `/api/commit-story` response in browser DevTools
2. Verify commits exist in repository with correct prefixes
3. Check GitHub API rate limits: `curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/rate_limit`
4. Wait for cache to expire (1 hour) or clear Vercel KV cache

---

### Issue: Playwright tests fail

**Possible Causes:**
- API timeout (tests wait 10 seconds max)
- Environment variables not set in test environment
- Vercel dev server not running

**Solutions:**
1. Ensure `.env.local` exists with valid tokens
2. Run `vercel dev` before running tests
3. Increase timeout in test spec if API is slow
4. Check test output for specific assertion failures

---

## Cache Management

**Cache Behavior:**
- Commit story data cached in Vercel KV for 1 hour
- Cache key: `commit-story-v1`
- Response includes `X-Cache` header: `HIT` or `MISS`

**Manual Cache Clear (if needed):**
1. Go to Vercel Dashboard → Storage → KV
2. Find the KV store
3. Delete key `commit-story-v1`
4. Or wait 1 hour for automatic expiration

---

## Next Steps After Deployment

### Task 9: Add Navigation Link (Not Yet Implemented)

After production verification, you'll need to:
1. Add navigation link to story page in main site navigation
2. Update homepage or main menu with "Our Story" link
3. Test navigation flow
4. Commit and push navigation changes

See Task 9 in the implementation plan for details.

---

## Support Contacts

**GitHub Repository:** https://github.com/standardhuman/sailorskills-repos
**Vercel Project:** sailorskills-site
**Implementation Plan:** `/Users/brian/app-development/sailorskills-repos/docs/plans/2025-10-29-commit-story-ui-implementation.md`

---

## Deployment Timeline

| Step | Status | Notes |
|------|--------|-------|
| Code Implementation (Tasks 1-7) | ✅ Complete | All code committed |
| Push to GitHub | ✅ Complete | Branch: feature/commit-story-ui |
| Configure Vercel Env Vars | ⏳ Pending | User action required |
| Create Pull Request | ⏳ Pending | User action required |
| Preview Deployment | ⏳ Pending | Auto-deploys from PR |
| Testing | ⏳ Pending | User verification required |
| Merge to Main | ⏳ Pending | After testing passes |
| Production Deployment | ⏳ Pending | Auto-deploys from main |
| Add Navigation (Task 9) | ⏳ Pending | Follow-up work |

---

**Last Updated:** 2025-10-29
