import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import JSZip from 'jszip';
test('bench and research checkbox lists show game icons and export all selected IDs and DLC dependencies', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  async function closeChoices() {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).not.toBeVisible();
  }
  async function openChoices(picker) {
    await picker.click();
    const overlay = page.locator('.p-multiselect-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay).not.toHaveClass(/p-connected-overlay-enter/);
  }
  await page.goto('#/weapon');
  await page.getByRole('button', { name: 'Add your first weapon' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add weapons', exact: true }).click();
  await page.locator('#weaponName').fill('Recipe choices');
  await page.getByRole('tab', { name: 'Crafting', exact: true }).click();
  await page.getByRole('button', { name: 'Recipe maker', exact: true }).click();
  const benches = page.locator('[data-pc-name="multiselect"]').filter({ has: page.getByRole('combobox', { name: 'Crafting benches', exact: true }) });
  await openChoices(benches);
  const machining = page.getByRole('option').filter({ hasText: 'TableMachining' });
  await expect(machining).toHaveAttribute('aria-selected', 'true');
  await expect(machining.locator('[data-pc-section="box"]')).toBeVisible();
  await expect.poll(() => machining.locator('img').evaluate(img => img.complete && img.naturalWidth)).toBe(64);
  await page.locator('.p-multiselect-overlay').screenshot({ path: info.outputPath('bench-dropdown-1280.png') });
  await page.getByRole('searchbox').fill('ElectricSmithy');
  const smithy = page.getByRole('option').filter({ hasText: 'ElectricSmithy' });
  await smithy.click(); await expect(smithy).toHaveAttribute('aria-selected', 'true');
  await closeChoices();
  await page.getByRole('button', { name: 'Anomaly definitions', exact: true }).click();
  await openChoices(benches); await page.getByRole('searchbox').fill('BioferriteShaper');
  const shaper = page.getByRole('option').filter({ hasText: 'BioferriteShaper' });
  await expect.poll(() => shaper.locator('img').evaluate(img => img.complete && img.naturalWidth)).toBe(64);
  await shaper.click(); await expect(shaper).toHaveAttribute('aria-selected', 'true'); await closeChoices();
  const research = page.locator('[data-pc-name="multiselect"]').filter({ has: page.getByRole('combobox', { name: 'Required research', exact: true }) });
  await openChoices(research); await page.getByRole('searchbox').fill('BioferriteIgnition');
  const project = page.getByRole('option').filter({ hasText: 'BioferriteIgnition' });
  await project.click(); await expect(project).toHaveAttribute('aria-selected', 'true');
  await closeChoices();
  await expect(research).toContainText('bioferrite weaponry');
  await page.getByRole('tab', { name: 'Weapon', exact: true }).click();
  await page.getByRole('tab', { name: 'Crafting', exact: true }).click();
  await expect(benches).toContainText('electric smithy');
  await expect(research).toContainText('bioferrite weaponry');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('region', { name: 'Recipe maker', exact: true }).screenshot({ path: info.outputPath(`recipe-choices-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for (const picker of [benches, research]) {
      await expect.poll(() => picker.evaluate(root => {
        const clear = root.querySelector('[data-pc-section="clearicon"]').getBoundingClientRect();
        const chips = [...root.querySelectorAll('[data-pc-section="chipitem"]')];
        return chips.length > 0 && chips.every(chip => {
          const bounds = chip.getBoundingClientRect();
          const remove = chip.querySelector('.p-chip-remove-icon').getBoundingClientRect();
          return bounds.right <= clear.left - 2 && remove.right <= bounds.right && remove.left >= bounds.left;
        });
      })).toBe(true);
    }
  }
  await openChoices(research);
  const researchMenu = page.locator('.p-multiselect-overlay');
  await researchMenu.screenshot({ path: info.outputPath('research-dropdown-390.png') });
  const menuBounds = await researchMenu.boundingBox();
  expect(menuBounds.x).toBeGreaterThanOrEqual(0); expect(menuBounds.x + menuBounds.width).toBeLessThanOrEqual(390);
  await closeChoices();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export mod', exact: true }).click();
  const zip = await JSZip.loadAsync(await fs.readFile(await (await pending).path()));
  const xml = await zip.file('TestMod/Defs/ThingDefs/TestModWeapons_Ranged.xml').async('string');
  for (const id of ['TableMachining', 'ElectricSmithy', 'BioferriteShaper', 'BioferriteIgnition']) expect(xml).toContain(`<li>${id}</li>`);
  expect(xml).toContain('<researchPrerequisite>PrecisionRifling</researchPrerequisite>');
  expect(await zip.file('TestMod/About/About.xml').async('string')).toContain('<packageId>Ludeon.RimWorld.Anomaly</packageId>');
  await page.getByRole('button', { name: 'Anomaly definitions', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Export mod', exact: true })).toBeDisabled();
  await expect(benches).toContainText('disabled DLC');
  const benchInput = page.getByRole('combobox', { name: 'Crafting benches', exact: true });
  await benchInput.focus(); await benchInput.press('ArrowDown');
  await expect(benchInput).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Add custom bench definition', exact: true }).click();
  const custom = page.getByRole('dialog', { name: 'Custom crafting bench' });
  await expect(custom.getByRole('button', { name: 'Add definition', exact: true })).toBeDisabled();
  await custom.getByLabel('Definition ID', { exact: true }).fill('MyMod_Workbench');
  await custom.getByRole('button', { name: 'Add definition', exact: true }).click();
  await expect(custom).not.toBeVisible();
  await expect(benches).toContainText('MyMod_Workbench (custom reference)');
  expect(errors).toEqual([]);
});
