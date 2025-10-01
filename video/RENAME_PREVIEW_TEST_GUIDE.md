# BOATY Rename Preview Testing Guide

This guide provides comprehensive test scenarios for the rename preview functionality in BOATY.

## Prerequisites

1. BOATY application running at http://localhost:5000 (or http://localhost:8080 if using launcher.py)
2. At least 3-5 video files in the source directory
3. Web browser (Chrome, Firefox, or Safari)

## Test Scenarios

### 1. Basic Rename Preview Flow ✅

**Steps:**
1. Navigate to http://localhost:5000
2. Go to "Step 2: Rename Videos"
3. Verify source videos are displayed in Step 1
4. Enter boat names:
   ```
   Test Boat A
   Test Boat B
   Test Boat C
   ```
5. Keep the default date (today)
6. Click "Preview Rename" button

**Expected Results:**
- Preview table appears below the form
- Each video is assigned to a boat
- Preview filenames show format: `[Boat Name] MM-DD-YYYY [Position] (Type).ext`
- Original form is hidden

**Screenshot Points:**
- Before clicking preview
- After preview table appears

### 2. Edit Preview Assignments 📝

**Prerequisites:** Complete Test 1 (stay in preview mode)

**Steps:**
1. In the first row, change boat name to "Modified Boat"
2. Change the date to a different date
3. Change video type from dropdown (e.g., "Before" to "Inspection")
4. Observe preview filename updates

**Expected Results:**
- Preview filename updates immediately as you type
- Date format changes in preview
- Type suffix changes in preview filename
- No page reload required

### 3. Drag and Drop Reordering 🔄

**Prerequisites:** Stay in preview mode with multiple rows

**Steps:**
1. Click and hold the drag handle (☰) on the first row
2. Drag to the second or third position
3. Release the mouse

**Expected Results:**
- Row moves to new position
- Position numbers in preview filenames update
- Order is maintained

**Note:** If drag-drop doesn't work, document this as a limitation

### 4. Quick Rename vs Preview Rename 🚀

**Steps:**
1. Click "Cancel" to exit preview mode
2. Verify you return to the original form
3. Note the two buttons:
   - "Preview Rename" - Opens preview mode
   - "Quick Rename" - Direct rename without preview
4. Click "Preview Rename" again
5. Make some changes
6. Click "Apply Rename"

**Expected Results:**
- Cancel returns to form without making changes
- Quick Rename would directly rename files
- Apply Rename uses the edited assignments
- Success message appears after rename
- Navigation to Step 3

### 5. Edge Cases 🔧

#### 5a. Empty Boat Names
**Steps:**
1. Clear the boat names textarea
2. Click "Preview Rename"

**Expected:** Error message or alert about missing boat names

#### 5b. No Source Videos
**Steps:**
1. Test when no videos are in source directory

**Expected:** Appropriate message about no videos available

#### 5c. More Videos than Boat Names
**Steps:**
1. Enter only 1 boat name
2. Set videos per boat to 2
3. Click "Preview Rename" (assuming 5+ videos available)

**Expected:**
- First 2 videos assigned to the boat
- Remaining videos shown as "unassigned"
- Option to add more boats for unassigned videos

#### 5d. Special Characters in Boat Names
**Steps:**
1. Enter boat names with special characters:
   ```
   Boat/Name
   Boat:Name
   Boat*Name
   Boat?Name
   "Quoted Boat"
   Boat<>Name
   ```
2. Click "Preview Rename"

**Expected:**
- Special characters are handled (replaced or escaped)
- Preview shows safe filenames
- No errors occur

### 6. Performance Testing ⚡

**Steps:**
1. Test with different numbers of videos:
   - 10 videos
   - 50 videos
   - 100+ videos (if available)

**Expected:**
- Preview loads within 2-3 seconds
- UI remains responsive
- Editing is smooth

### 7. Browser Compatibility 🌐

Test the above scenarios in:
- Chrome
- Firefox
- Safari
- Edge

**Focus on:**
- Drag and drop functionality
- Live preview updates
- Button interactions

## Issues to Document 📋

For any issues found, document:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser and version
5. Screenshots if applicable
6. Error messages from browser console

## Test Results Template

```
Test Date: ___________
Tester: _____________
BOATY Version: ______

| Test Scenario | Pass/Fail | Notes |
|--------------|-----------|-------|
| 1. Basic Preview | | |
| 2. Edit Assignments | | |
| 3. Drag & Drop | | |
| 4. Quick vs Preview | | |
| 5a. Empty Names | | |
| 5b. No Videos | | |
| 5c. More Videos | | |
| 5d. Special Chars | | |
| 6. Performance | | |
| 7. Browser Compat | | |

Additional Comments:
```

## Automated Testing

Two test scripts are available:

1. **test_rename_preview.py** - API and backend testing
   ```bash
   python3 test_rename_preview.py
   ```

2. **test_rename_preview_playwright.py** - Full UI automation testing
   ```bash
   # Install playwright first:
   pip install playwright
   playwright install chromium
   
   # Run tests:
   python3 test_rename_preview_playwright.py
   ```

## Tips for Testing

1. **Reset between tests**: Refresh the page between major test scenarios
2. **Check console**: Open browser developer tools (F12) and check for JavaScript errors
3. **Network tab**: Monitor API calls in the Network tab
4. **Mobile view**: Test responsive behavior using browser's device emulation
5. **Take screenshots**: Document any issues with screenshots

## Common Issues and Solutions

1. **Preview not updating**: Check browser console for JavaScript errors
2. **Drag-drop not working**: Try different browsers, some have better support
3. **Special characters causing errors**: Document which characters cause issues
4. **Slow performance**: Note the number of videos when slowness occurs