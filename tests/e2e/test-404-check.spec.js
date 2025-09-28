import { test } from '@playwright/test';

test('Check for 404 errors', async ({ page }) => {
    // Track network requests
    const failed404s = [];

    page.on('response', response => {
        if (response.status() === 404) {
            failed404s.push({
                url: response.url(),
                status: response.status()
            });
        }
    });

    // Navigate to admin page
    await page.goto('http://localhost:3000/admin');

    // Wait a bit to capture all network requests
    await page.waitForTimeout(2000);

    // Print 404 errors
    console.log('\n=== 404 Errors ===');
    failed404s.forEach(req => {
        console.log(`❌ 404: ${req.url}`);
    });

    // Check if critical JS files are loading
    const jsFiles = ['admin.js', 'admin-wizard.js', 'admin-payment.js'];

    for (const file of jsFiles) {
        const response = await page.evaluate(async (filename) => {
            try {
                const res = await fetch(`/admin/${filename}`);
                return { file: filename, ok: res.ok, status: res.status };
            } catch (e) {
                return { file: filename, error: e.message };
            }
        }, file);
        console.log(`\n${file}:`, response);
    }
});