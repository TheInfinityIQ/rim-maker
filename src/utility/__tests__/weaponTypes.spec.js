import { describe, it, expect } from 'vitest';
import { createWeapon, weaponTemplates } from '../weaponTypes';
import { buildModArchive } from '../scripts/buildXML';
import { requiredExpansions } from '../gameDefinitions';
import { getExportDisabledReason } from '../exportValidation';
import { projectileCausesExplosion } from '../projectileRules';

describe('melee and grenade editing and export', () => {
  it.each(weaponTemplates)('exports a valid $defName starting template without changing the editable model', async template => {
    const weapon = createWeapon(template.kind, template.defName);
    weapon.gun.label = 'Template test';
    const before = JSON.stringify(weapon);
    const archive = buildModArchive([weapon], [], 'WeaponTest');
    const xml = await archive.file('WeaponTest/Defs/ThingDefs/WeaponTestWeapons_Ranged.xml').async('string');
    const dom = new DOMParser().parseFromString(xml, 'application/xml');
    expect(dom.querySelector('parsererror')).toBeNull();
    expect(JSON.stringify(weapon)).toBe(before);
    expect(xml).toContain(`ParentName="${template.parent}"`);
    if (template.kind === 'melee') {
      expect(dom.querySelector('projectile')).toBeNull();
      expect(dom.querySelector('verbClass')).toBeNull();
      expect(dom.querySelectorAll('tools > li')).toHaveLength(template.tools.length);
      expect(xml).toContain('<costStuffCount>');
    } else {
      expect(dom.querySelector('verbClass').textContent).toBe('Verb_LaunchProjectile');
      expect(dom.querySelector('rangedFireRulepack').textContent).toBe('Combat_RangedFire_Thrown');
      expect(dom.querySelector('thingCategories > li').textContent).toBe('Grenades');
      expect(Number(dom.querySelector('forcedMissRadius').textContent)).toBe(1.9);
      expect(projectileCausesExplosion(weapon)).toBe(true);
      if (weapon.bullet.projectile.explosionDelay) expect(xml).toContain(`<explosionDelay>${weapon.bullet.projectile.explosionDelay}</explosionDelay>`);
      if (template.extra.comps) expect(dom.querySelector('comps > li[Class="CompProperties_Explosive"]')).not.toBeNull();
    }
  });
  it('combines guns, melee and grenades with unique IDs and expansion dependencies', async () => {
    const weapons = [createWeapon(), createWeapon('melee'), createWeapon('grenade', 'Weapon_GrenadeTox')];
    ['Carbine', 'Sword', 'Tox grenade'].forEach((label, i) => { weapons[i].gun.label = label; });
    const zip = buildModArchive(weapons, [], 'MixedArmory');
    expect((await zip.file('MixedArmory/About/About.xml').async('string')).toLowerCase()).toContain('ludeon.rimworld.biotech');
    const dom = new DOMParser().parseFromString(await zip.file('MixedArmory/Defs/ThingDefs/MixedArmoryWeapons_Ranged.xml').async('string'), 'application/xml');
    const ids = [...dom.querySelectorAll('Defs > ThingDef > defName')].map(node => node.textContent);
    expect(ids).toHaveLength(5); expect(new Set(ids).size).toBe(5);
    expect(requiredExpansions(weapons).map(pack => pack.id)).toContain('Biotech');
  });
  it('preserves added melee properties and rejects invalid attacks or materials', () => {
    const weapon = createWeapon('melee'); weapon.gun.label = 'Custom blade';
    Object.assign(weapon.gun.tools[1], { power: 42, armorPenetration: .5, chanceFactor: 2, capacities: ['Stab', 'Cut'] });
    expect(weapon.clone().gun.tools[1]).toEqual(weapon.gun.tools[1]);
    expect(getExportDisabledReason([weapon], 'Armory')).toBe('');
    weapon.gun.tools[1].cooldownTime = 0;
    expect(getExportDisabledReason([weapon], 'Armory')).toContain('positive damage/cooldown');
    weapon.gun.stuffCategories = [];
    expect(getExportDisabledReason([weapon], 'Armory')).toContain('material categories');
  });
});
