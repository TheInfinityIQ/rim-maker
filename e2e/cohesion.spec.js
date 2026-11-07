import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
async function create(page, kind, template, label) {
  const first = page.getByRole('button', { name: 'Add your first weapon' });
  await (await first.count() ? first : page.getByRole('complementary', { name: 'Mod weapons' }).getByRole('button', { name: 'Add weapons', exact: true })).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Weapon type', exact: true }).click();
  await page.getByRole('option', { name: kind, exact: true }).click();
  await dialog.getByRole('combobox', { name: 'Starting template', exact: true }).click();
  await page.getByRole('searchbox').fill(template);
  await page.getByRole('option', { name: template, exact: true }).click();
  await dialog.getByRole('button', { name: 'Add weapons', exact: true }).click();
  await page.locator('#weaponName').fill(label);
}
async function download(page) {
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export mod', exact: true }).click();
  return JSZip.loadAsync(await fs.readFile(await (await pending).path()));
}
async function chooseSound(page, value) {
  await page.getByRole('combobox', { name: 'Weapon interact sound', exact: true }).click();
  await page.getByRole('searchbox').fill(value); await page.getByRole('option', { name: value, exact: true }).click();
}

test('sound replacement, reset and export respect the chosen template and user selection for every weapon family', async ({ page }) => {
  await page.goto('#/weapon');
  const audio = await fs.readFile('public/previews/assault-rifle-shot.wav');
  for (const [kind, template, label, sound] of [['Melee weapon', 'mace', 'Test mace', 'Standard_Pickup'], ['Grenade', 'frag grenades', 'Test grenade', 'Interact_Grenade'], ['Ranged weapon', 'pump shotgun', 'Test shotgun', 'Interact_Shotgun']]) {
    await create(page, kind, template, label);
    const select = page.getByRole('combobox', { name: 'Weapon interact sound', exact: true });
    await expect(select).toContainText(sound);
    await page.getByRole('button', { name: 'Play weapon interact sound', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Stop weapon interact sound', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Stop weapon interact sound', exact: true }).click();
    await chooseSound(page, 'Interact_Autopistol');
    await page.locator('#weaponInteractSound input[type=file]').setInputFiles({ name: 'replacement.wav', mimeType: 'audio/wav', buffer: audio });
    await expect(select).toContainText('Interact_Autopistol');
    const zip = await download(page);
    expect(await zip.file('TestMod/Defs/SoundDefs/TestModSounds_RangedWeapon.xml').async('string')).toContain('_Interact</defName>');
    await page.locator('#weaponInteractSound').getByRole('button', { name: 'Remove File', exact: true }).click();
    await expect(select).toContainText('Interact_Autopistol');
    const reset = page.locator('#weaponInteractSound').getByRole('button', { name: 'Use template sound', exact: true });
    await expect(reset).toHaveAttribute('title', sound);
    await reset.click();
    await expect(select).toContainText(sound);
    await page.getByRole('button', { name: 'Play weapon interact sound', exact: true }).click();
    await page.getByRole('tab', { name: 'Attacks', exact: true }).click();
    await page.getByRole('tab', { name: 'Weapon', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Play weapon interact sound', exact: true })).toBeVisible();
  }
});

test('identical upload filenames remain separate and repeated exports preserve original selections', async ({ page }) => {
  await page.goto('#/weapon');
  const files = [await fs.readFile('public/previews/assault-rifle-shot.wav'), await fs.readFile('public/previews/assault-rifle-interact.wav')];
  for (const [i, template] of ['revolver', 'assault rifle'].entries()) {
    await create(page, 'Ranged weapon', template, i === 0 ? 'First weapon' : 'Second weapon');
    await page.locator('#weaponInteractSound input[type=file]').setInputFiles({ name: 'same-name.wav', mimeType: 'audio/wav', buffer: files[i] });
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const zip = await download(page), sounds = array(parser.parse(await zip.file('TestMod/Defs/SoundDefs/TestModSounds_RangedWeapon.xml').async('string')).Defs.SoundDef);
    expect(new Set(sounds.map(sound => sound.defName)).size).toBe(2);
    const clips = sounds.map(sound => array(array(sound.subSounds.li)[0].grains.li)[0].clipPath);
    expect(new Set(clips).size).toBe(2);
    for (const [i, clip] of clips.entries()) expect(Buffer.from(await zip.file(`TestMod/Sounds/${clip}.wav`).async('uint8array'))).toEqual(files[i]);
  }
  await page.locator('#weaponInteractSound').getByRole('button', { name: 'Remove File', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Weapon interact sound', exact: true })).toContainText('Interact_Rifle');
});

test('template defaults, field ownership and preview lifecycle remain coherent', async ({ page }, info) => {
  await page.goto('#/weapon');
  await create(page, 'Ranged weapon', 'greatbow', 'Test bow');
  await expect(page.getByRole('combobox', { name: 'Weapon interact sound', exact: true })).toContainText('Bow_Large');
  await page.getByRole('tab', { name: 'Attacks', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Firing sound', exact: true })).toContainText('Bow_Large');
  await expect(page.getByRole('combobox', { name: 'Firing tail sound', exact: true })).not.toContainText('GunTail_Medium');
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(page.getByTestId('preview-shot-name')).toHaveText('Bow_Large');
  await page.getByRole('button', { name: 'White room', exact: true }).click();
  await page.getByRole('button', { name: 'Fire weapon', exact: true }).click();
  await page.getByRole('tab', { name: 'Weapon', exact: true }).click();
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(page.getByTestId('visual-fire-state')).toHaveText('Ready');
  await page.getByRole('tab', { name: 'Weapon', exact: true }).click();
  await page.getByRole('button', { name: 'Stat Bases', exact: true }).click();
  await expect(page.locator('#weaponMass')).toHaveValue('3');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.weapon-editor').screenshot({ path: info.outputPath('cohesive-weapon-mobile.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('textbox', { name: 'Weapon graphic path', exact: true }).fill('MyMod/UniqueBow');
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(page.getByTestId('preview-equipped-texture')).toHaveCount(0);
  await expect(page.getByTestId('preview-texture-name')).toHaveText('MyMod/UniqueBow');
  await page.getByRole('tab', { name: 'Projectile', exact: true }).click();
  await page.getByRole('textbox', { name: 'Projectile graphic path', exact: true }).fill('MyMod/UniqueArrow');
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(page.getByTestId('projectile-texture-unavailable')).toBeVisible();
  await create(page, 'Melee weapon', 'longsword', 'Test blade');
  await expect(page.getByRole('tab', { name: 'Projectile', exact: true })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Weapon', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Attacks', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Crafting', exact: true }).click();
  await page.getByRole('button', { name: 'Recipe maker', exact: true }).click();
  const benches = page.getByRole('textbox', { name: 'Crafting benches', exact: true });
  await benches.fill('ElectricSmithy');
  await benches.press('End');
  await benches.pressSequentially(', FueledSmithy');
  await expect(benches).toHaveValue('ElectricSmithy, FueledSmithy');
  await benches.press('Tab');
  const zip = await download(page);
  const xml = await zip.file('TestMod/Defs/ThingDefs/TestModWeapons_Ranged.xml').async('string');
  expect(xml).toContain('<li>ElectricSmithy</li>'); expect(xml).toContain('<li>FueledSmithy</li>');
});
