import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import JSZip from 'jszip';
async function pick(page, label, option) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

test('technology library retains special DLC references, sparse groups and empty tiers', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('#/reference/balance');
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

test('automatic comparison previews, applies and undoes on the actual shared draft', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('#/weapon');
  await page.getByRole('button', { name: 'Add your first weapon' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add weapons', exact: true }).click();
  await page.locator('#weaponName').fill('Balanced rifle');
  await page.getByRole('tab', { name: 'Projectile', exact: true }).click();
  await page.locator('#bulletProjectileDamageAmountBase').fill('22');
  await page.getByRole('tab', { name: 'Balance', exact: true }).click();
  await expect(page.getByTestId('auto-current')).toContainText('10.57');
  await expect(page.getByTestId('auto-proposed')).toContainText('5.28');
  await expect(page.getByTestId('auto-reference')).toContainText('Gun_AssaultRifle');
  await expect(page.getByTestId('automatic-balance').getByRole('combobox')).toHaveCount(0);
  await expect(page.getByTestId('automatic-balance').getByRole('textbox')).toHaveCount(0);
  await page.getByRole('link', { name: 'Balance', exact: true }).click();
  await expect(page.getByTestId('auto-current')).toContainText('Balanced rifle');
  await expect(page.getByTestId('auto-current')).toContainText('10.57');
  await page.getByRole('button', { name: 'Apply adjustments', exact: true }).click();
  await expect(page.getByTestId('auto-current')).toContainText('5.28');
  await page.getByRole('button', { name: 'Undo adjustment', exact: true }).click();
  await expect(page.getByTestId('auto-current')).toContainText('10.57');
  const slider = page.getByRole('slider', { name: 'Power level', exact: true });
  await slider.focus(); await slider.press('ArrowRight');
  await expect(page.getByText('Power level: 105%', { exact: false })).toBeVisible();
  await expect(page.getByTestId('auto-current')).toContainText('10.57');
  await page.getByRole('button', { name: 'Play comparison', exact: true }).click();
  await expect.poll(() => page.getByTestId('balance-projectile').count()).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Stop comparison', exact: true }).click();
  await expect(page.getByTestId('balance-projectile')).toHaveCount(0);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({ path: info.outputPath(`automatic-balance-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.getByRole('button', { name: 'Apply adjustments', exact: true }).click();
  await page.getByRole('link', { name: 'Workbench', exact: true }).click();
  await expect(page.getByTestId('auto-current')).toContainText('4.45');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export mod', exact: true }).click();
  const zip = await JSZip.loadAsync(await fs.readFile(await (await pending).path()));
  const xml = await zip.file('TestMod/Defs/ThingDefs/TestModWeapons_Ranged.xml').async('string');
  expect(xml).toContain('<RangedWeapon_Cooldown>4.45</RangedWeapon_Cooldown>');
  expect(xml).toContain('<damageAmountBase>22</damageAmountBase>');
  expect(xml).not.toContain('balancePower');
  expect(errors).toEqual([]);
});

test('special weapons retain honest unknown output and can still export', async ({ page }) => {
  await page.goto('#/weapon');
  await page.getByRole('button', { name: 'Add your first weapon' }).click();
  await pick(page, 'Weapon type', 'Grenade');
  await page.getByRole('dialog').getByRole('button', { name: 'Add weapons', exact: true }).click();
  await page.locator('#weaponName').fill('Test grenade');
  await page.getByRole('tab', { name: 'Balance', exact: true }).click();
  await expect(page.getByTestId('auto-proposed')).toContainText('Native evaluation needed');
  await expect(page.getByTestId('auto-proposed')).toContainText('effect-specific native tests');
  await expect(page.getByRole('button', { name: 'Apply adjustments', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Export mod', exact: true })).toBeEnabled();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export mod', exact: true }).click();
  const zip = await JSZip.loadAsync(await fs.readFile(await (await pending).path()));
  const xml = await zip.file('TestMod/Defs/ThingDefs/TestModWeapons_Ranged.xml').async('string');
  expect(xml).toContain('<damageDef>Bomb</damageDef>');
});


test('empty session gets a no-setup demonstration, not an editable fictitious draft', async ({ page }) => {
  await page.goto('#/balance');
  await expect(page.getByText('This is an assault-rifle demonstration.', { exact: false })).toBeVisible();
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Apply adjustments', exact: true })).toBeDisabled();
});
