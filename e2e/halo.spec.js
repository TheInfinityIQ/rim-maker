import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import JSZip from 'jszip';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

const sourceFile = 'e2e/.local/halo-cases.json';
if (!fs.existsSync(sourceFile)) throw new Error('Run npm run test:e2e:halo to prepare the local Halo cases first.');
const cases = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const array = value => value === undefined ? [] : Array.isArray(value) ? value : [value];
const stats = { WorkToMake: 'workToMake', Mass: 'weaponMass', AccuracyTouch: 'accuracyTouch', AccuracyShort: 'accuracyShort', AccuracyMedium: 'accuracyMedium', AccuracyLong: 'accuracyLong', RangedWeapon_Cooldown: 'rangedCooldown' };
const verbs = { warmupTime: 'weaponTimeToAim', range: 'weaponRange', burstShotCount: 'weaponBurstShotCount', ticksBetweenBurstShots: 'weaponTicketsBetweenProjectileInShotBurst' };
const projectile = { damageAmountBase: 'bulletProjectileDamageAmountBase', speed: 'bulletProjectileSpeed', stoppingPower: 'bulletProjectileStoppingPower', armorPenetrationBase: 'bulletProjectileArmorPenetration', explosionRadius: 'bulletExplosionRadius', preExplosionSpawnChance: 'bulletFuelChance' };
function leaves(value, prefix = '') {
  return Object.entries(value || {}).flatMap(([key, child]) => {
    if (key.startsWith('@_')) return [];
    const name = prefix ? `${prefix}.${key}` : key;
    return child !== null && typeof child === 'object' ? leaves(child, name) : [[name, String(child)]];
  });
}
function equal(a, b) {
  if (a === undefined || b === undefined) return a === b;
  return String(a) === String(b) || (String(a).trim() !== '' && String(b).trim() !== '' && Number(a) === Number(b));
}
async function select(page, locator, text, query = text) {
  await locator.click();
  const search = page.getByRole('searchbox');
  if (await search.count()) await search.fill(query);
  await page.getByRole('option').filter({ hasText: text }).first().click();
}

for (const source of cases) test(`${source.pack}: ${source.gun.label}`, async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const { gun, bullet, assets } = source;
  const verb = array(gun.verbs.li)[0];
  const checked = new Set(['label', 'description']);
  await page.goto('#/weapon');
  await page.getByRole('button', { name: 'Add your first weapon' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add weapons', exact: true }).click();
  await page.locator('#mod-name').fill('HaloTest');
  await page.locator('#weaponName').fill(gun.label);
  await page.locator('#weaponDescription').fill(gun.description);
  await page.getByRole('tab', { name: 'Attacks', exact: true }).click();
  for (const [field, id] of Object.entries(verbs)) if (verb[field] !== undefined) {
    await page.locator('#' + id).fill(verb[field]); checked.add('verbs.li.' + field);
  }
  await page.getByRole('tab', { name: 'Weapon', exact: true }).click();
  await page.getByRole('button', { name: 'Stat Bases', exact: true }).click();
  for (const [field, id] of Object.entries(stats)) if (gun.statBases[field] !== undefined) {
    await page.locator('#' + id).fill(gun.statBases[field]); checked.add('statBases.' + field);
  }
  await page.getByRole('tab', { name: 'Projectile', exact: true }).click();
  if (bullet) {
    const profile = bullet.projectile.damageDef === 'Flame' ? 'Inferno shell' : bullet.thingClass === 'Projectile_Explosive' ? 'Explosive rocket' : 'Normal bullet';
    await select(page, page.locator('#projectile-kind'), profile);
    await page.locator('#bulletLabel').fill(bullet.label);
    for (const [field, id] of Object.entries(projectile)) if (bullet.projectile[field] !== undefined) await page.locator('#' + id).fill(bullet.projectile[field]);
  } else {
    await page.getByRole('button', { name: 'Use existing projectile', exact: true }).click();
    await select(page, page.locator('#existing-projectile'), 'rocket · Core · Area explosion', verb.defaultProjectile);
  }
  if (verb.forcedMissRadius !== undefined) {
    await page.getByRole('tab', { name: 'Attacks', exact: true }).click();
    await page.locator('#weaponForcedMissRadius').fill(verb.forcedMissRadius);
    checked.add('verbs.li.forcedMissRadius');
  }
  await page.getByRole('tab', { name: 'Crafting', exact: true }).click();
  await page.getByRole('button', { name: 'Recipe maker', exact: true }).click();
  const skillPanel = page.getByRole('region', { name: 'Recipe maker', exact: true });
  for (const [name, level] of Object.entries(gun.recipeMaker?.skillRequirements || {})) {
    await page.getByRole('button', { name: 'Add skill requirement', exact: true }).click();
    const row = skillPanel.locator('.resource-row').last();
    await select(page, row.getByRole('combobox'), name, name);
    await row.getByRole('spinbutton').fill(level); await row.getByRole('spinbutton').press('Tab');
    checked.add('recipeMaker.skillRequirements.' + name);
  }
  const costPanel = page.locator('[data-pc-name="panel"]').filter({ has: page.getByText('Cost List', { exact: true }) }).last();
  // Use the real remove/add controls and searchable PrimeVue resource selectors.
  while (await costPanel.locator('.resource-row').count()) await costPanel.locator('.resource-row').first().getByRole('button').click();
  for (const [name, quantity] of Object.entries(gun.costList)) {
    await costPanel.getByRole('button', { name: 'Add resource', exact: true }).click();
    const row = costPanel.locator('.resource-row').last();
    await row.getByRole('combobox').click();
    await page.getByRole('searchbox').fill(name);
    await page.getByRole('option').filter({ has: page.locator('small').filter({ hasText: new RegExp('^' + name + '$') }) }).click();
    await row.getByRole('spinbutton').fill(quantity);
    await row.getByRole('spinbutton').press('Tab');
    checked.add('costList.' + name);
  }
  for (const [kind, id] of [['gun','gunGraphicData'],['bullet','bulletGraphicData'],['shot','weaponGunSound'],['tail','weaponGunTailSound'],['interact','weaponInteractSound']]) {
    if (assets[kind]) { await page.getByRole('tab', { name: kind === 'gun' || kind === 'interact' ? 'Weapon' : kind === 'bullet' ? 'Projectile' : 'Attacks', exact: true }).click(); await page.locator(`#${id} input[type=file]`).setInputFiles(assets[kind]); }
  }
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export mod', exact: true }).click();
  const download = await downloadPromise;
  const downloadPath = info.outputPath('recreated-mod.zip');
  await download.saveAs(downloadPath);
  const archive = await JSZip.loadAsync(fs.readFileSync(downloadPath));
  const xml = await archive.file('HaloTest/Defs/ThingDefs/HaloTestWeapons_Ranged.xml').async('string');
  expect(XMLValidator.validate(xml)).toBe(true);
  const defs = array(parser.parse(xml).Defs.ThingDef);
  const outputGun = defs.find(def => def['@_ParentName'] === 'BaseHumanMakeableGun');
  const outputBullet = defs.find(def => def['@_ParentName'] === 'BaseBullet');
  for (const def of defs) expect(def.defName).toMatch(/^[A-Za-z0-9_-]*[A-Za-z_-]$/);
  const expectedLeaves = leaves(gun); const actualLeaves = new Map(leaves(outputGun));
  for (const [name, value] of expectedLeaves) if (checked.has(name)) expect(equal(value, actualLeaves.get(name)), name).toBe(true);
  const intentionalRenames = new Set(['defName','verbs.li.defaultProjectile']);
  if (assets.gun) intentionalRenames.add('graphicData.texPath');
  if (assets.shot) intentionalRenames.add('verbs.li.soundCast');
  if (assets.tail) intentionalRenames.add('verbs.li.soundCastTail');
  if (assets.interact) intentionalRenames.add('soundInteract');
  const gaps = expectedLeaves.filter(([name, value]) => !checked.has(name) && !intentionalRenames.has(name) && !equal(value, actualLeaves.get(name))).map(([field, expected]) => ({ field, expected, actual: actualLeaves.get(field) ?? null }));
  if (bullet) {
    expect(outputGun.verbs.li.defaultProjectile).toBe(outputBullet.defName);
    expect(outputBullet.thingClass).toBe(bullet.thingClass || 'Bullet');
    expect(outputBullet.label).toBe(bullet.label);
    const out = new Map(leaves(outputBullet.projectile));
    for (const [field, value] of leaves(bullet.projectile)) expect(equal(value, out.get(field)), 'projectile.' + field).toBe(true);
    const graphics = new Map(leaves(outputBullet.graphicData));
    for (const [field, value] of leaves(bullet.graphicData)) if (!(field === 'texPath' && assets.bullet) && !equal(value, graphics.get(field))) gaps.push({ field: 'projectile.graphicData.' + field, expected: value, actual: graphics.get(field) ?? null });
  } else expect(outputGun.verbs.li.defaultProjectile).toBe(verb.defaultProjectile);
  for (const [kind, file] of Object.entries(assets)) if (file) {
    const name = file.split(/[\\/]/).pop().replace(/[^A-Za-z0-9_.-]/g, '_');
    const role = { gun: 'weapon', bullet: 'projectile', shot: 'Shot', tail: 'Tail', interact: 'Interact' }[kind];
    const relative = `${outputGun.defName}/${role}/${name}`;
    const prefix = ['gun','bullet'].includes(kind) ? 'Textures' : 'Sounds';
    expect(Buffer.from(await archive.file(`HaloTest/${prefix}/HaloTest/${relative}`).async('uint8array'))).toEqual(fs.readFileSync(file));
    if (kind === 'gun' || kind === 'bullet') {
      const definition = kind === 'gun' ? outputGun : outputBullet;
      expect(definition.graphicData.texPath).toBe('HaloTest/' + relative.replace(/\.[^.]+$/, ''));
    }
  }
  const soundXml = await archive.file('HaloTest/Defs/SoundDefs/HaloTestSounds_RangedWeapon.xml').async('string');
  expect(XMLValidator.validate(soundXml)).toBe(true);
  const sounds = array(parser.parse(soundXml).Defs.SoundDef);
  for (const [kind, reference] of [['shot',outputGun.verbs.li.soundCast], ['tail',outputGun.verbs.li.soundCastTail], ['interact',outputGun.soundInteract]]) {
    if (!assets[kind]) continue;
    const sound = sounds.find(sound => sound.defName === reference);
    expect(sound, kind + ' sound reference').toBeTruthy();
    const clip = array(array(sound.subSounds.li)[0].grains.li)[0].clipPath;
    expect(clip).toBe(`HaloTest/${outputGun.defName}/${{ shot: 'Shot', tail: 'Tail', interact: 'Interact' }[kind]}/` + assets[kind].split(/[\\/]/).pop().replace(/[^A-Za-z0-9_.-]/g, '_').replace(/\.[^.]+$/, ''));
  }
  expect(errors).toEqual([]);
  const coverage = { weapon: gun.label, pack: source.pack, source: source.source, sourceSha256: source.sourceSha256,
    result: gaps.length ? 'partial-recreation' : 'matched-source-fields', supportedFieldsChecked: [...checked], differences: gaps,
    projectileFieldsChecked: bullet ? leaves(bullet.projectile).map(([field]) => field) : ['existing definition reference'],
    uploadedAssetsChecked: Object.keys(assets).filter(kind => assets[kind]),
    limitation: 'This compares original XML fields and uploaded asset bytes, not runtime inheritance or in-game behavior. Renamed IDs and asset paths are intentional.' };
  fs.writeFileSync(info.outputPath('coverage.json'), JSON.stringify(coverage, null, 2));
  await info.attach('Halo recreation coverage', { body: JSON.stringify(coverage, null, 2), contentType: 'application/json' });
  if (process.env.HALO_REQUIRE_FULL_PARITY === '1') expect(gaps, 'Full source parity gaps').toEqual([]);
});
