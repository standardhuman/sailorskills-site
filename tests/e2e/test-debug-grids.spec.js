import { test, expect } from '@playwright/test';

test.describe('Debug Anode Grids', () => {
    test('Debug why anode grids are not visible', async ({ page }) => {
        console.log('=== DEBUGGING ANODE GRIDS ===\n');

        // Navigate to admin page
        await page.goto('http://localhost:3000/admin/admin.html');
        await page.waitForTimeout(2000);

        // Click on Recurring Cleaning service
        console.log('1. Selecting Recurring Cleaning service...');
        await page.click('button:has-text("Recurring Cleaning")');
        await page.waitForTimeout(3000); // Give more time to load

        // Find all anode grids and check their properties
        console.log('2. Analyzing anode grids...\n');

        const grids = await page.$$('#anodeGrid');
        console.log(`Found ${grids.length} grids with id="anodeGrid"\n`);

        for (let i = 0; i < grids.length; i++) {
            const grid = grids[i];

            // Get grid properties
            const properties = await page.evaluate((args) => {
                const el = args.element;
                const rect = el.getBoundingClientRect();
                const styles = window.getComputedStyle(el);
                const parent = el.parentElement;
                const parentStyles = parent ? window.getComputedStyle(parent) : null;

                return {
                    index: args.index,
                    visible: el.offsetParent !== null,
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity,
                    position: styles.position,
                    overflow: styles.overflow,
                    maxHeight: styles.maxHeight,
                    width: rect.width,
                    height: rect.height,
                    top: rect.top,
                    left: rect.left,
                    childCount: el.children.length,
                    innerHTML: el.innerHTML.substring(0, 100),
                    parentTag: parent ? parent.tagName : 'none',
                    parentId: parent ? parent.id : 'none',
                    parentDisplay: parentStyles ? parentStyles.display : 'none',
                    parentVisibility: parentStyles ? parentStyles.visibility : 'none',
                    closestWizard: el.closest('.wizard-step') ? el.closest('.wizard-step').id : 'none'
                };
            }, { element: grid, index: i });

            console.log(`Grid ${i + 1}:`);
            console.log(`  Visible: ${properties.visible}`);
            console.log(`  Display: ${properties.display}`);
            console.log(`  Visibility: ${properties.visibility}`);
            console.log(`  Opacity: ${properties.opacity}`);
            console.log(`  Position: ${properties.position}`);
            console.log(`  Overflow: ${properties.overflow}`);
            console.log(`  Max Height: ${properties.maxHeight}`);
            console.log(`  Dimensions: ${properties.width}x${properties.height}`);
            console.log(`  Location: (${properties.left}, ${properties.top})`);
            console.log(`  Child count: ${properties.childCount}`);
            console.log(`  Parent: ${properties.parentTag}#${properties.parentId}`);
            console.log(`  Parent display: ${properties.parentDisplay}`);
            console.log(`  Parent visibility: ${properties.parentVisibility}`);
            console.log(`  Closest wizard: ${properties.closestWizard}`);
            console.log(`  Content preview: ${properties.innerHTML}`);
            console.log('');
        }

        // Check if anodes are being loaded
        console.log('3. Checking for anode items...\n');

        const anodeItems = page.locator('.anode-item');
        const itemCount = await anodeItems.count();
        console.log(`Found ${itemCount} anode items total\n`);

        if (itemCount > 0) {
            // Check visibility of first few items
            for (let i = 0; i < Math.min(3, itemCount); i++) {
                const item = anodeItems.nth(i);
                const isVisible = await item.isVisible();
                const name = await item.locator('.anode-name').textContent().catch(() => 'unknown');
                console.log(`  Anode ${i + 1} "${name}": visible = ${isVisible}`);
            }
        }

        // Check category buttons
        console.log('\n4. Checking category buttons...\n');

        const categoryButtons = page.locator('.category-btn');
        const btnCount = await categoryButtons.count();
        console.log(`Found ${btnCount} category buttons\n`);

        for (let i = 0; i < btnCount; i++) {
            const btn = categoryButtons.nth(i);
            const text = await btn.textContent();
            const hasActive = await btn.evaluate(el => el.classList.contains('active'));
            console.log(`  Button "${text}": active = ${hasActive}`);
        }

        // Check if adminApp is initialized
        console.log('\n5. Checking adminApp initialization...\n');

        const appExists = await page.evaluate(() => {
            return {
                adminApp: typeof window.adminApp !== 'undefined',
                adminAppMethods: window.adminApp ? Object.keys(window.adminApp).slice(0, 10) : [],
                selectedAnodes: window.adminApp ? window.adminApp.selectedAnodes : {},
                anodeDetails: window.adminApp ? window.adminApp.anodeDetails : []
            };
        });

        console.log(`  adminApp exists: ${appExists.adminApp}`);
        if (appExists.adminApp) {
            console.log(`  adminApp methods: ${appExists.adminAppMethods.join(', ')}`);
            console.log(`  Selected anodes: ${JSON.stringify(appExists.selectedAnodes)}`);
            console.log(`  Anode details: ${JSON.stringify(appExists.anodeDetails).substring(0, 100)}`);
        }

        // Try clicking "All" category button explicitly
        console.log('\n6. Trying to click "All" category...\n');

        const allBtn = page.locator('button.category-btn:has-text("All")');
        if (await allBtn.count() > 0) {
            await allBtn.click();
            console.log('  Clicked "All" button');
            await page.waitForTimeout(2000);

            // Check again
            const visibleAfter = await anodeItems.first().isVisible().catch(() => false);
            console.log(`  After clicking "All": first anode visible = ${visibleAfter}`);
        }

        console.log('\n=== DEBUG COMPLETE ===');
    });
});