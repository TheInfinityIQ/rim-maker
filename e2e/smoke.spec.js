import { test, expect } from '@playwright/test';

test('explains disabled export, creates a weapon, and preserves input across tabs', async ({ page }) => {
  await page.goto('#/weapon');
  await expect(page.getByRole('button', { name: 'Export mod', exact: true })).toBeDisabled();
  await page.locator('.export-trigger').hover();
  await expect(page.getByRole('tooltip')).toContainText('Add at least one weapon');
  await page.getByRole('button', { name: 'Add your first weapon' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add weapons', exact: true }).click();
  await page.locator('#weaponName').fill('Browser test rifle');
  await page.getByRole('tab', { name: 'Combat', exact: true }).click();
  await page.locator('#weaponRange').fill('42');
  await page.getByRole('tab', { name: 'Details', exact: true }).click();
  await expect(page.locator('#weaponName')).toHaveValue('Browser test rifle');
  await expect(page.getByRole('button', { name: 'Export mod', exact: true })).toBeEnabled();
});
