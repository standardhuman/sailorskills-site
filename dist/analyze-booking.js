const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to SailorSkills booking page...');
  await page.goto('https://sailorskills.com/book-lessons', { waitUntil: 'networkidle' });
  
  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Take screenshot of main booking page
  await page.screenshot({ path: 'booking-main.png', fullPage: true });
  
  // Look for booking options
  const bookingOptions = await page.$$eval('a, button', elements => 
    elements
      .filter(el => {
        const text = el.textContent.toLowerCase();
        return text.includes('book') || text.includes('schedule') || text.includes('lesson');
      })
      .map(el => ({
        text: el.textContent.trim(),
        href: el.href || '',
        tagName: el.tagName
      }))
  );
  
  console.log('Found booking options:', bookingOptions);
  
  // Try to find and click different booking types
  const selectors = [
    'text=/private.*lesson/i',
    'text=/group.*lesson/i',
    'text=/charter/i',
    'text=/course/i',
    'text=/book.*now/i',
    'text=/schedule/i'
  ];
  
  for (const selector of selectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        console.log(`Found: ${selector}`);
        await element.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `booking-${selector.replace(/[^a-z]/gi, '')}.png`, fullPage: true });
        
        // Check if we're on a booking form
        const formElements = await page.$$eval('form, input, select, textarea', elements => 
          elements.map(el => ({
            tagName: el.tagName,
            type: el.type || '',
            name: el.name || '',
            placeholder: el.placeholder || '',
            label: el.labels?.[0]?.textContent || ''
          }))
        );
        
        if (formElements.length > 0) {
          console.log('Form elements found:', formElements);
        }
        
        // Go back to main page
        await page.goBack();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log(`Selector ${selector} not found or not clickable`);
    }
  }
  
  // Check for embedded booking widgets
  const iframes = await page.$$('iframe');
  console.log(`Found ${iframes.length} iframes`);
  
  for (let i = 0; i < iframes.length; i++) {
    const frame = iframes[i];
    const src = await frame.getAttribute('src');
    console.log(`Iframe ${i} src:`, src);
  }
  
  // Check for calendar elements
  const calendarElements = await page.$$eval('[class*="calendar"], [id*="calendar"], [data-*="calendar"]', elements => 
    elements.map(el => ({
      className: el.className,
      id: el.id,
      tagName: el.tagName
    }))
  );
  
  if (calendarElements.length > 0) {
    console.log('Calendar elements found:', calendarElements);
  }
  
  await browser.close();
})();