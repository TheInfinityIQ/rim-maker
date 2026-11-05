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

test('repeatable crafting and melee inputs have usable labels and retain edits across sections', async ({ page }) => {
  await page.goto('#/weapon');
  await page.getByRole('button', { name: 'Add your first weapon' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add weapons', exact: true }).click();
  await page.getByRole('tab', { name: 'Crafting', exact: true }).click();
  await page.getByRole('button', { name: 'Add resource', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Resource 3', exact: true })).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Resource 3 amount', exact: true }).fill('12');
  await page.getByRole('spinbutton', { name: 'Resource 3 amount', exact: true }).press('Tab');
  await page.getByRole('button', { name: 'Recipe Skill Requirements', exact: true }).click();
  await page.getByRole('button', { name: 'Add skill requirement', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Required skill 1 level', exact: true }).fill('15');
  await page.getByRole('spinbutton', { name: 'Required skill 1 level', exact: true }).press('Tab');
  await page.getByRole('tab', { name: 'Combat', exact: true }).click();
  await page.getByRole('button', { name: 'Tools', exact: true }).click();
  await page.getByRole('button', { name: 'Add melee tool', exact: true }).click();
  await page.getByLabel('Label', { exact: true }).last().fill('bayonet');
  await page.getByLabel('Damage amount', { exact: true }).last().fill('14');
  await page.getByRole('button', { name: 'Remove melee tool 3', exact: true }).click();
  await expect(page.getByLabel('Label', { exact: true })).toHaveCount(2);
  await page.getByRole('tab', { name: 'Crafting', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Resource 3 amount', exact: true })).toHaveValue('12');
  await expect(page.getByRole('spinbutton', { name: 'Required skill 1 level', exact: true })).toHaveValue('15');
  await page.getByRole('button', { name: 'Remove resource', exact: true }).last().click();
  await expect(page.getByRole('combobox', { name: 'Resource 3', exact: true })).toHaveCount(0);
});
