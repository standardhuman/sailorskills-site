import { test, expect } from '@playwright/test';

test('Charge summary updates when service is selected', async ({ page }) => {
  // Navigate to admin page
  await page.goto('http://localhost:3000/admin/admin.html');
  await page.waitForLoadState('networkidle');

  // Monitor console for debugging
  page.on('console', msg => {
    if (msg.text().includes('updateChargeSummary') || msg.text().includes('calculateCost')) {
      console.log('Console:', msg.text());
    }
  });

  // Check initial state of charge summary
  const chargeDetails = page.locator('#chargeDetails');
  const chargeButton = page.locator('#chargeButton');

  await expect(chargeButton).toBeDisabled();

  // Click Recurring Cleaning
  console.log('Clicking Recurring Cleaning...');
  await page.click('button:has-text("Recurring Cleaning")');
  await page.waitForTimeout(1000);

  // Enter boat length in wizard
  const boatLengthInput = page.locator('#wizardBoatLength');
  if (await boatLengthInput.isVisible()) {
    await boatLengthInput.fill('40');
    console.log('Entered boat length: 40');
    await page.waitForTimeout(500);
  }

  // Check if charge summary updated
  const chargeDetailsText = await chargeDetails.textContent();
  console.log('Charge details after service selection:', chargeDetailsText);

  // Check if charge button is enabled
  const isEnabled = await chargeButton.isEnabled();
  console.log('Charge button enabled:', isEnabled);

  // Check if price is displayed in wizard
  const wizardPrice = page.locator('#wizardTotalPrice');
  if (await wizardPrice.isVisible()) {
    const price = await wizardPrice.textContent();
    console.log('Wizard price:', price);
  }

  // Test boat type selection
  const powerboatRadio = page.locator('input[name="wizard_boat_type"][value="powerboat"]');
  if (await powerboatRadio.isVisible()) {
    await powerboatRadio.click();
    console.log('Selected powerboat');
    await page.waitForTimeout(500);

    const updatedPrice = await wizardPrice.textContent();
    console.log('Updated price after powerboat selection:', updatedPrice);
  }

  // Test paint condition
  const paintButton = page.locator('button:has-text("Poor")');
  if (await paintButton.isVisible()) {
    await paintButton.click();
    console.log('Selected Poor paint condition');
    await page.waitForTimeout(500);

    const updatedPrice = await wizardPrice.textContent();
    console.log('Updated price after paint condition:', updatedPrice);
  }

  // Final check of charge details
  const finalChargeDetails = await chargeDetails.textContent();
  console.log('Final charge details:', finalChargeDetails);

  // Check if service name is in charge summary
  expect(finalChargeDetails).toContain('Recurring Cleaning');
});