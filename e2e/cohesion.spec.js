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

test('editor fields align consistently at desktop and mobile widths', async ({ page }, info) => {
  const box = async locator => { const value = await locator.boundingBox(); expect(value).not.toBeNull(); return value; };
  const aligned = async (left, right, tolerance) => {
    // Dropdown exit animation / scroll anchoring can move both controls between two
    // separate boundingBox calls. Measure in one frame and wait for the final layout.
    await expect.poll(async () => {
      const other = await right.elementHandle();
      try { return await left.evaluate((element, target) => Math.abs(element.getBoundingClientRect().top - target.getBoundingClientRect().top), other); }
      finally { await other?.dispose(); }
    }).toBeLessThan(tolerance);
  };
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('#/weapon');
    await page.reload();
    await create(page, 'Ranged weapon', 'assault rifle', 'Layout rifle');
    await page.getByRole('button', { name: 'Stat Offsets', exact: true }).click();
    await page.getByRole('button', { name: 'Add stat offset', exact: true }).click();
    const stat = page.getByRole('combobox', { name: 'Equipped stat 1', exact: true });
    await stat.click(); await page.getByRole('searchbox').fill('ShootingAccuracyPawn');
    await page.getByRole('option').filter({ hasText: 'defName: ShootingAccuracyPawn)' }).click();
    const points = page.getByRole('spinbutton', { name: 'Equipped stat 1 percentage points', exact: true });
    if (width > 420) await aligned(stat.locator('..'), points, 2);
    await page.getByRole('region', { name: 'Stat Offsets', exact: true }).screenshot({ path: info.outputPath(`offsets-${width}.png`) });
    await page.getByRole('tab', { name: 'Attacks', exact: true }).click();
    await page.getByRole('button', { name: 'Tools', exact: true }).click();
    const ap = await box(page.getByRole('spinbutton', { name: 'Melee tool 1 armour penetration', exact: true }));
    const weight = await box(page.getByRole('spinbutton', { name: 'Melee tool 1 selection weight', exact: true }));
    if (width > 720) await aligned(page.getByRole('spinbutton', { name: 'Melee tool 1 armour penetration', exact: true }), page.getByRole('spinbutton', { name: 'Melee tool 1 selection weight', exact: true }), 2);
    await page.getByRole('region', { name: 'Tools', exact: true }).screenshot({ path: info.outputPath(`tools-${width}.png`) });
    await page.getByRole('tab', { name: 'Crafting', exact: true }).click();
    const choice = page.locator('.choice-field');
    const gap = await choice.evaluate(label => {
      const checkbox = label.querySelector('[data-pc-name="checkbox"]').getBoundingClientRect();
      const text = [...label.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.includes('Choose material'));
      const range = document.createRange(); range.selectNode(text);
      return range.getBoundingClientRect().left - checkbox.right;
    });
    expect(gap).toBeGreaterThanOrEqual(10);
    await page.getByRole('checkbox', { name: 'Choose material when crafting', exact: true }).check();
    await expect(page.getByRole('combobox', { name: 'Allowed material categories', exact: true })).toBeVisible();
    const resource = page.getByRole('combobox', { name: 'Resource 1', exact: true });
    const amount = page.getByRole('spinbutton', { name: 'Resource 1 amount', exact: true });
    const [r, a] = await Promise.all([box(resource.locator('..')), box(amount)]);
    expect(Math.abs(r.height - a.height)).toBeLessThan(3);
    if (width > 420) await aligned(resource.locator('..'), amount, 3);
    const background = locator => locator.evaluate(element => getComputedStyle(element).backgroundColor);
    expect(await background(resource.locator('..'))).toBe(await background(amount));
    await page.getByRole('button', { name: 'Recipe maker', exact: true }).click();
    await page.locator('.weapon-editor').screenshot({ path: info.outputPath(`crafting-${width}.png`) });
    for (const tab of ['Weapon', 'Attacks', 'Projectile', 'Crafting', 'Preview']) {
      await page.getByRole('tab', { name: tab, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  }
});

test('percentage-point offsets translate to exported decimals while other stats keep their units', async ({ page }, info) => {
  await page.goto('#/weapon');
  await create(page, 'Ranged weapon', 'assault rifle', 'Offset rifle');
  await page.getByRole('button', { name: 'Stat Offsets', exact: true }).click();
  await page.getByRole('button', { name: 'Add stat offset', exact: true }).click();
  async function selectStat(id) {
    await page.getByRole('combobox', { name: 'Equipped stat 1', exact: true }).click();
    await page.getByRole('searchbox').fill(id);
    await page.getByRole('option').filter({ hasText: `defName: ${id})` }).click();
  }
  await selectStat('ShootingAccuracyPawn');
  const points = page.getByRole('spinbutton', { name: 'Equipped stat 1 percentage points', exact: true });
  for (const [entered, stored] of [['5', '+0.05'], ['-2.5', '-0.025'], ['0', '0']]) {
    await points.fill(entered); await points.press('Tab');
    await expect(page.getByTestId('stat-offset-value-1')).toContainText(`Actual offset added: ${stored}`);
    const zip = await download(page);
    const xml = await zip.file('TestMod/Defs/ThingDefs/TestModWeapons_Ranged.xml').async('string');
    expect(xml).toContain(`<ShootingAccuracyPawn>${stored.replace('+', '')}</ShootingAccuracyPawn>`);
  }
  await points.fill('5'); await points.press('Tab');
  await page.getByRole('tab', { name: 'Attacks', exact: true }).click();
  await page.getByRole('tab', { name: 'Weapon', exact: true }).click();
  await expect(points).toHaveValue('5');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('region', { name: 'Stat Offsets', exact: true }).screenshot({ path: info.outputPath('percentage-offset-mobile.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await selectStat('MoveSpeed');
  const raw = page.getByRole('textbox', { name: 'Equipped stat 1 offset', exact: true });
  await expect(raw).toHaveValue('0.05');
  await raw.fill('0.2');
  await expect(page.getByTestId('stat-offset-value-1')).toContainText('Actual offset added: +0.2');
  const zip = await download(page);
  expect(await zip.file('TestMod/Defs/ThingDefs/TestModWeapons_Ranged.xml').async('string')).toContain('<MoveSpeed>0.2</MoveSpeed>');
});

test('projectile graphics use the same reference in the form, preview and export', async ({ page }) => {
  await page.goto('#/weapon');
  await create(page, 'Ranged weapon', 'assault rifle', 'Reference rifle');
  await page.getByRole('tab', { name: 'Projectile', exact: true }).click();
  const graphic = page.getByRole('img', { name: 'Projectile graphic', exact: true });
  await expect(graphic).toHaveAttribute('src', /previews\/projectiles\/a733f8ce45b3\.png$/);
  await expect.poll(() => graphic.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('combobox', { name: 'Projectile graphic path', exact: true }).fill('MyMod/CustomBullet');
  await expect(graphic).toHaveCount(0);
  await page.locator('#bulletGraphicData input[type=file]').setInputFiles('public/previews/projectiles/a733f8ce45b3.png');
  await expect(graphic).toHaveAttribute('src', /^blob:/);
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(page.getByTestId('projectile-texture-unavailable')).toHaveCount(0);
  const uploaded = await download(page);
  expect(Object.keys(uploaded.files).some(file => file.endsWith('/projectile/a733f8ce45b3.png'))).toBe(true);
  await page.getByRole('tab', { name: 'Projectile', exact: true }).click();
  await page.locator('#bulletGraphicData').getByRole('button', { name: 'Remove File', exact: true }).click();
  await expect(graphic).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Projectile graphic path', exact: true })).toHaveValue('MyMod/CustomBullet');
  await page.getByRole('region', { name: 'Projectile graphic', exact: true }).getByRole('button', { name: 'Use template texture', exact: true }).click();
  await expect(graphic).toHaveAttribute('src', /previews\/projectiles\/a733f8ce45b3\.png$/);
  const restored = await download(page);
  const xml = await restored.file('TestMod/Defs/ThingDefs/TestModWeapons_Ranged.xml').async('string');
  expect(xml).toContain('<texPath>Things/Projectile/Bullet_Small</texPath>');
  expect(Object.keys(restored.files).some(file => file.endsWith('/projectile/a733f8ce45b3.png'))).toBe(false);
});

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
  await page.getByRole('combobox', { name: 'Weapon graphic path', exact: true }).fill('MyMod/UniqueBow');
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(page.getByTestId('preview-equipped-texture')).toHaveCount(0);
  await expect(page.getByTestId('preview-texture-name')).toHaveText('MyMod/UniqueBow');
  await page.getByRole('tab', { name: 'Projectile', exact: true }).click();
  await page.getByRole('combobox', { name: 'Projectile graphic path', exact: true }).fill('MyMod/UniqueArrow');
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(page.getByTestId('projectile-texture-unavailable')).toBeVisible();
  await create(page, 'Melee weapon', 'longsword', 'Test blade');
  await expect(page.getByRole('tab', { name: 'Projectile', exact: true })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Weapon', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Attacks', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Crafting', exact: true }).click();
  await page.getByRole('button', { name: 'Recipe maker', exact: true }).click();
  const benches = page.locator('[data-pc-name="multiselect"]').filter({ has: page.getByRole('combobox', { name: 'Crafting benches', exact: true }) });
  await benches.click();
  const electric = page.getByRole('option').filter({ hasText: 'ElectricSmithy' });
  await expect(electric).toHaveAttribute('aria-selected', 'true');
  await electric.click(); await electric.click();
  await expect(electric).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('option').filter({ hasText: 'FueledSmithy' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');
  const zip = await download(page);
  const xml = await zip.file('TestMod/Defs/ThingDefs/TestModWeapons_Ranged.xml').async('string');
  expect(xml).toContain('<li>ElectricSmithy</li>'); expect(xml).toContain('<li>FueledSmithy</li>');
});
