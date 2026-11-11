import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import JSZip from 'jszip';

test('NPC tags are editable, explain their scope and survive export and section changes', async ({ page }, info) => {
  await page.goto('#/weapon');
  await page.getByRole('button', { name: 'Add your first weapon' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add weapons', exact: true }).click();
  await page.locator('#weaponName').fill('Tagged rifle');
  await page.getByRole('button', { name: 'NPC equipment tags', exact: true }).click();
  await expect(page.getByTestId('npc-tag-contexts')).toContainText('Faction types');
  await page.getByRole('button', { name: 'Clear tags', exact: true }).click();
  await expect(page.getByTestId('npc-tag-contexts')).toContainText('excluded');
  await page.getByLabel('Custom tag', { exact: true }).fill('Custom.Pulse');
  await page.getByRole('button', { name: 'Add tag', exact: true }).click();
  await expect(page.getByTestId('npc-tag-contexts')).toContainText('No faction-type tag matches');
  await page.getByRole('combobox', { name: 'Weapon tags', exact: true }).focus();
  await page.getByRole('combobox', { name: 'Weapon tags', exact: true }).press('ArrowDown');
  await page.getByRole('searchbox').fill('Gun');
  await page.getByRole('option', { name: 'Gun', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('npc-tag-contexts')).toContainText('Faction types');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('region', { name: 'NPC equipment tags', exact: true }).screenshot({ path: info.outputPath(`npc-tags-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.getByRole('tab', { name: 'Attacks', exact: true }).click();
  await page.getByRole('tab', { name: 'Weapon', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export mod', exact: true }).click();
  const zip = await JSZip.loadAsync(await fs.readFile(await (await pending).path()));
  const xml = await zip.file('TestMod/Defs/ThingDefs/TestModWeapons_Ranged.xml').async('string');
  expect(xml).toContain('<weaponTags Inherit="False">');
  expect(xml).toContain('<li>Custom.Pulse</li>');
  expect(xml).toContain('<li>Gun</li>');
  await page.getByRole('button', { name: 'Restore template tags', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Weapon tags', exact: true }).locator('..')).not.toContainText('Custom.Pulse');
});
