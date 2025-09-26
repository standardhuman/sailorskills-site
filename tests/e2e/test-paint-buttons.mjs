import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing paint condition button styling issue...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Select a service to show the form
console.log('1. Selecting Recurring Cleaning service...');
await page.locator('button:has-text("Recurring Cleaning")').first().click();
await page.waitForTimeout(2000);

// Find all paint condition buttons
console.log('\n2. Analyzing paint condition buttons:');
const paintButtonSelectors = [
    { class: 'paint-excellent', label: 'Excellent' },
    { class: 'paint-good', label: 'Good' },
    { class: 'paint-fair', label: 'Fair' },
    { class: 'paint-poor', label: 'Poor' },
    { class: 'paint-missing', label: 'Missing' }
];

for (const btn of paintButtonSelectors) {
    const button = await page.locator(`[id*="wizardPaintCondition"] .${btn.class}`).first();
    if (await button.count() > 0) {
        // Click the button
        await button.click();
        await page.waitForTimeout(500);
        
        // Get computed styles
        const styles = await button.evaluate(el => {
            const computed = window.getComputedStyle(el);
            const classList = Array.from(el.classList);
            const cssText = el.getAttribute('style') || '';
            
            // Also check the CSS rules that apply to this element
            const sheets = Array.from(document.styleSheets);
            const applicableRules = [];
            
            sheets.forEach(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules || []);
                    rules.forEach(rule => {
                        if (rule.selectorText && el.matches(rule.selectorText)) {
                            applicableRules.push({
                                selector: rule.selectorText,
                                styles: rule.style.cssText
                            });
                        }
                    });
                } catch (e) {
                    // Cross-origin stylesheets will throw
                }
            });
            
            return {
                computedColor: computed.color,
                computedBackground: computed.backgroundColor,
                classes: classList,
                inlineStyles: cssText,
                isSelected: classList.includes('selected'),
                visibility: computed.visibility,
                opacity: computed.opacity,
                applicableRules: applicableRules.slice(0, 5) // First 5 matching rules
            };
        });
        
        console.log(`\n   ${btn.label} Button:`);
        console.log(`   - Selected: ${styles.isSelected}`);
        console.log(`   - Computed color: ${styles.computedColor}`);
        console.log(`   - Computed background: ${styles.computedBackground}`);
        console.log(`   - Classes: ${styles.classes.join(', ')}`);
        if (styles.inlineStyles) {
            console.log(`   - Inline styles: ${styles.inlineStyles}`);
        }
        
        // Check if text is visible
        const isTextVisible = await button.evaluate(el => {
            const computed = window.getComputedStyle(el);
            const bg = computed.backgroundColor;
            const color = computed.color;
            
            // Parse RGB values
            const parseRGB = (str) => {
                const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
            };
            
            const bgRGB = parseRGB(bg);
            const textRGB = parseRGB(color);
            
            if (bgRGB && textRGB) {
                // Calculate contrast ratio (simplified)
                const getLuminance = (rgb) => {
                    const [r, g, b] = rgb.map(val => {
                        val = val / 255;
                        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
                    });
                    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
                };
                
                const bgLum = getLuminance(bgRGB);
                const textLum = getLuminance(textRGB);
                const contrast = (Math.max(bgLum, textLum) + 0.05) / (Math.min(bgLum, textLum) + 0.05);
                
                return {
                    bgRGB,
                    textRGB,
                    contrast: contrast.toFixed(2),
                    isVisible: contrast > 1.5
                };
            }
            return null;
        });
        
        if (isTextVisible) {
            console.log(`   - Contrast ratio: ${isTextVisible.contrast}`);
            console.log(`   - Text visible: ${isTextVisible.isVisible ? 'YES' : 'NO (TOO LOW CONTRAST!)'}`);
        }
    }
}

// Take screenshot of the buttons
await page.screenshot({ path: 'paint-buttons-issue.png', clip: { x: 0, y: 300, width: 1200, height: 400 } });
console.log('\n✅ Screenshot saved as paint-buttons-issue.png');

await page.waitForTimeout(3000);
await browser.close();
