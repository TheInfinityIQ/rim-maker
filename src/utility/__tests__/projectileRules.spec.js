import { describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { WeaponRanged } from '@/models/weapon';
import { useDefinitionStore } from '@/stores/definitions';
import { availableDefinitions, definitionByName, requiredExpansions, unavailableReferenceReason } from '../gameDefinitions';
import { applyProjectilePreset, projectilePresets } from '../projectileRules';
import { buildModArchive } from '../scripts/buildXML';

function weapon() {
  const result = new WeaponRanged();
  result.gun.label = 'Test rifle';
  result.gun.defName = 'Test_Rifle';
  return result;
}
async function exportedXml(item) {
  const archive = buildModArchive([item], [], 'Test');
  const xml = await archive.file('Test/Defs/ThingDefs/TestWeapons_Ranged.xml').async('string');
  const parsed = new DOMParser().parseFromString(xml, 'application/xml');
  expect(parsed.querySelector('parsererror')).toBeNull();
  return { archive, parsed };
}

describe('expansion definitions', () => {
  it('starts with Core and adds/removes expansion dropdown entries reactively', () => {
    setActivePinia(createPinia());
    const store = useDefinitionStore();
    expect(store.enabledPacks).toEqual(['Core']);
    expect(store.bullets.some(row => row.defName === 'Bullet_ToxicNeedleGun')).toBe(false);
    store.enabled.Biotech = true;
    expect(store.bullets.some(row => row.defName === 'Bullet_ToxicNeedleGun')).toBe(true);
    expect(store.tools.length).toBeGreaterThan(availableDefinitions('tools').length);
    store.enabled.Biotech = false;
    expect(store.bullets.some(row => row.defName === 'Bullet_ToxicNeedleGun')).toBe(false);
  });
  it('includes inherited arrows and mortar shells, but excludes the Spark effect', () => {
    const names = availableDefinitions('bullets').map(row => row.defName);
    expect(names).toContain('Arrow_Short');
    expect(names).toContain('Bullet_Shell_Incendiary');
    expect(names).not.toContain('Spark');
  });
  it('keeps a selected DLC reference intact and explains why export needs it re-enabled', () => {
    const item = weapon();
    item.projectileMode = 'existing';
    item.gun.verbs[0].defaultProjectile = 'Bullet_ToxicNeedleGun';
    expect(unavailableReferenceReason([item], ['Core'])).toContain('Biotech');
    expect(unavailableReferenceReason([item], ['Core', 'Biotech'])).toBe('');
    expect(item.gun.verbs[0].defaultProjectile).toBe('Bullet_ToxicNeedleGun');
  });
  it('adds dependencies for referenced definitions, not merely enabled content packs', async () => {
    const item = weapon();
    item.projectileMode = 'existing';
    item.gun.verbs[0].defaultProjectile = 'Bullet_ToxicNeedleGun';
    expect(requiredExpansions([item]).map(pack => pack.id)).toEqual(['Biotech']);
    const { archive } = await exportedXml(item);
    const about = new DOMParser().parseFromString(await archive.file('Test/About/About.xml').async('string'), 'application/xml');
    expect(about.querySelector('modDependencies packageId').textContent.toLowerCase()).toBe('ludeon.rimworld.biotech');
    expect(about.querySelector('supportedVersions li').textContent).toBe('1.6');
    item.gun.verbs[0].defaultProjectile = 'Bullet_AssaultRifle';
    expect(requiredExpansions([item])).toEqual([]);
  });
  it('adds sound definitions only from enabled expansions', () => {
    const core = new Set(availableDefinitions('sounds').map(row => row.defName));
    const expanded = availableDefinitions('sounds', ['Core', 'Anomaly']);
    expect(expanded.some(row => row.pack === 'Anomaly' && !core.has(row.defName))).toBe(true);
    expect(expanded.some(row => row.pack === 'Odyssey')).toBe(false);
  });
});

describe('projectile behavior and export', () => {
  it.each(projectilePresets)('exports the $label profile with its proper class and links it without a texture upload', async preset => {
    const item = weapon();
    applyProjectilePreset(item, preset.value);
    const original = definitionByName('bullets', preset.definition);
    const { parsed } = await exportedXml(item);
    const definitions = [...parsed.querySelectorAll('Defs > ThingDef')];
    expect(definitions).toHaveLength(2);
    const bullet = definitions.find(node => node.getAttribute('ParentName') === 'BaseBullet');
    const gun = definitions.find(node => node.getAttribute('ParentName') === 'BaseHumanMakeableGun');
    expect(bullet.querySelector('thingClass').textContent).toBe(original.thingClass);
    expect(bullet.querySelector('projectile > damageDef').textContent).toBe(original.projectile.damageDef);
    expect(gun.querySelector('defaultProjectile').textContent).toBe(bullet.querySelector('defName').textContent);
    expect(bullet.querySelector('graphicData > texPath').textContent).toBeTruthy();
    if (original.projectile.explosionRadius) expect(Number(bullet.querySelector('explosionRadius').textContent)).toBe(original.projectile.explosionRadius);
    if (original.projectile.preExplosionSpawnThingDef) expect(bullet.querySelector('preExplosionSpawnThingDef').textContent).toBe(original.projectile.preExplosionSpawnThingDef);
    if (original.projectile.postExplosionGasType) expect(bullet.querySelector('postExplosionGasType').textContent).toBe(original.projectile.postExplosionGasType);
  });
  it('uses specialized projectiles by reference without emitting an extra custom bullet', async () => {
    const item = weapon();
    item.projectileMode = 'existing';
    item.gun.verbs[0].defaultProjectile = 'Bullet_DoomsdayRocket';
    const { parsed } = await exportedXml(item);
    expect(parsed.querySelectorAll('ThingDef')).toHaveLength(1);
    expect(parsed.querySelector('defaultProjectile').textContent).toBe('Bullet_DoomsdayRocket');
  });
  it('keeps user-owned texture references and names intact during export cloning', async () => {
    const item = weapon();
    applyProjectilePreset(item, 'inferno');
    const originalPath = item.bullet.graphicData.texPath;
    await exportedXml(item);
    expect(item.bullet.graphicData.texPath).toBe(originalPath);
    expect(item.bullet.defName).toBe('');
    expect(item.clone().bullet.thingClass).toBe('Projectile_Explosive');
  });
  it('exports legal and distinct weapon/projectile IDs for punctuation and numeric labels', async () => {
    const weapons = ['M41 SSR MAV/AW', 'Rifle 12', 'Grenade launcher'].map(label => {
      const item = weapon(); item.gun.label = label; return item;
    });
    const archive = buildModArchive(weapons, [], 'Test');
    const parsed = new DOMParser().parseFromString(await archive.file('Test/Defs/ThingDefs/TestWeapons_Ranged.xml').async('string'), 'application/xml');
    const ids = [...parsed.querySelectorAll('ThingDef > defName')].map(node => node.textContent);
    expect(new Set(ids).size).toBe(6);
    ids.forEach(id => expect(id).toMatch(/^[A-Za-z0-9_-]*[A-Za-z_-]$/));
    [...parsed.querySelectorAll('defaultProjectile')].forEach(node => expect(ids).toContain(node.textContent));
  });
  it('keeps explosive aiming valid for custom and stock ammunition and removes it for direct bullets', async () => {
    const item = weapon();
    applyProjectilePreset(item, 'explosive');
    item.gun.verbs[0].forcedMissRadius = 0.01;
    expect((await exportedXml(item)).parsed.querySelector('forcedMissRadius').textContent).toBe('0.01');
    applyProjectilePreset(item, 'bullet');
    expect((await exportedXml(item)).parsed.querySelector('forcedMissRadius')).toBeNull();
    item.projectileMode = 'existing'; item.gun.verbs[0].defaultProjectile = 'Bullet_Rocket';
    expect(Number((await exportedXml(item)).parsed.querySelector('forcedMissRadius').textContent)).toBeGreaterThan(0);
  });
});
