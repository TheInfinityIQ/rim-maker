import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import JSZip from 'jszip';
async function pick(page, label, option) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

test('technology library retains special DLC references, sparse groups and empty tiers', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('#/balance');
  await expect(page.getByTestId('balance-coverage')).toContainText('30 definitions');
  await page.locator('.p-paginator-page').filter({ hasText: /^3$/ }).click();
  await pick(page, 'Compare with technology', 'Spacer');
  await expect(page.getByTestId('balance-coverage')).toContainText('7 definitions');
  await expect(page.getByTestId('balance-coverage')).toContainText('2 comparable outputs');
  await expect(page.getByRole('combobox', { name: 'Role comparison', exact: true })).toContainText('All roles in this bracket');
  await page.locator('[data-reference-id="Gun_BeamRepeater"]').click();
  await expect(page.getByTestId('balance-reference-detail')).toContainText('Gun_BeamRepeater');
  await expect(page.getByTestId('balance-reference-detail')).toContainText('Odyssey');
  await expect(page.getByTestId('balance-reference-detail')).toContainText('Minimum shield energy');
  await pick(page, 'Role comparison', 'general rifle');
  await expect(page.getByTestId('balance-coverage')).toContainText('2 definitions');
  await pick(page, 'Role comparison', 'All roles in this bracket');
  await page.getByLabel('Find a reference', { exact: true }).fill('unique charge');
  await expect(page.locator('[data-reference-id]')).toHaveCount(1);
  await page.getByLabel('Find a reference', { exact: true }).fill('');
  await expect(page.locator('[data-reference-id]')).toHaveCount(7);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({ path: info.outputPath(`balance-library-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await pick(page, 'Compare with technology', 'Archotech');
  await expect(page.getByTestId('balance-coverage')).toContainText('0 definitions');
  await expect(page.getByText('No official weapons match this bracket and role.')).toBeVisible();
  await pick(page, 'Compare with technology', 'Medieval');
  await pick(page, 'Balance weapon group', 'Melee');
  await expect(page.getByTestId('balance-coverage')).toContainText('5 definitions');
  expect(errors).toEqual([]);
});

test('draft updates, explains directions, preserves filters, and exports only deliberate game fields', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('#/weapon');
  await page.getByRole('button', { name: 'Add your first weapon' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add weapons', exact: true }).click();
  await page.locator('#weaponName').fill('Balanced rifle');
  await page.getByRole('tab', { name: 'Balance', exact: true }).click();
  await expect(page.getByTestId('draft-assessment')).toContainText('5.28 primary input');
  await pick(page, 'Compare with technology', 'Spacer');
  await page.getByRole('button', { name: 'Explain balance', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('too small');
  await page.getByRole('button', { name: 'Edit projectile settings', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Projectile', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.locator('#bulletProjectileDamageAmountBase').fill('22');
  await page.getByRole('tab', { name: 'Balance', exact: true }).click();
  await expect(page.getByTestId('draft-assessment')).toContainText('10.57 primary input');
  await expect(page.getByRole('combobox', { name: 'Compare with technology', exact: true })).toContainText('Spacer');
  await expect(page.getByTestId('draft-assessment')).toContainText('Authored technology: Industrial');
  await page.getByRole('button', { name: 'Explain balance', exact: true }).click();
  await page.getByRole('button', { name: 'Edit technology level', exact: true }).click();
  await pick(page, 'Weapon technology level', 'Spacer');
  await page.getByRole('tab', { name: 'Balance', exact: true }).click();
  await expect(page.getByTestId('draft-assessment')).toContainText('Authored technology: Spacer');
  await pick(page, 'Balance distance', '40');
  await expect(page.getByTestId('draft-assessment')).toContainText('Outside weapon range');
  await pick(page, 'Balance distance', '12');
  await page.getByRole('button', { name: 'Explain balance', exact: true }).click();
  await page.getByRole('button', { name: 'Edit cooldown', exact: true }).click();
  await expect(page.locator('#rangedCooldown')).toBeVisible();
  await expect(page.locator('#rangedCooldown')).toBeFocused();
  await page.getByRole('tab', { name: 'Balance', exact: true }).click();
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({ path: info.outputPath(`balance-draft-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.getByRole('link', { name: 'Balance library', exact: true }).click();
  await page.getByRole('link', { name: 'Workbench', exact: true }).click();
  await expect(page.getByTestId('draft-assessment')).toContainText('10.57');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export mod', exact: true }).click();
  const zip = await JSZip.loadAsync(await fs.readFile(await (await download).path()));
  const xml = await zip.file('TestMod/Defs/ThingDefs/TestModWeapons_Ranged.xml').async('string');
  expect(xml).toContain('<techLevel>Spacer</techLevel>');
  expect(xml).toContain('<damageAmountBase>22</damageAmountBase>');
  expect(xml).not.toContain('comparison'); expect(xml).not.toContain('balanceScore');
  expect(errors).toEqual([]);
});

test('special weapons retain honest unknown output and can still export', async ({ page }) => {
  await page.goto('#/weapon');
  await page.getByRole('button', { name: 'Add your first weapon' }).click();
  await pick(page, 'Weapon type', 'Grenade');
  await page.getByRole('dialog').getByRole('button', { name: 'Add weapons', exact: true }).click();
  await page.locator('#weaponName').fill('Test grenade');
  await page.getByRole('tab', { name: 'Balance', exact: true }).click();
  await expect(page.getByTestId('draft-assessment')).toContainText('Output not estimated');
  await expect(page.getByTestId('draft-assessment')).toContainText('effect-specific native tests');
  await expect(page.getByRole('button', { name: 'Export mod', exact: true })).toBeEnabled();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export mod', exact: true }).click();
  const zip = await JSZip.loadAsync(await fs.readFile(await (await pending).path()));
  const xml = await zip.file('TestMod/Defs/ThingDefs/TestModWeapons_Ranged.xml').async('string');
  expect(xml).toContain('<damageDef>Bomb</damageDef>');
});
