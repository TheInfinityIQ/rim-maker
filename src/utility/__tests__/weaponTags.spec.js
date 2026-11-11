import { describe, expect, it } from 'vitest';
import { createWeapon } from '../weaponTypes';
import { buildModArchive } from '../scripts/buildXML';
import { normalizeWeaponTags, weaponTagOptions, weaponTagContexts } from '../weaponTags';

describe('NPC equipment tags', () => {
  it('keeps exact case, removes duplicates and retains custom tags across pack filters', () => {
    expect(normalizeWeaponTags([' Gun ', 'Gun', 'gun', '', 'Custom.Pulse'])).toEqual(['Gun', 'gun', 'Custom.Pulse']);
    expect(weaponTagOptions(['Core'], ['Custom.Pulse'])).toContain('Custom.Pulse');
    expect(weaponTagContexts(['Gun'], ['Core']).map(row => row.id)).toContain('OutlanderRough');
    expect(weaponTagContexts(['SpacerGun'], ['Core']).map(row => row.id)).not.toContain('Empire');
    expect(weaponTagContexts(['SpacerGun'], ['Core', 'Royalty']).map(row => row.id)).toContain('Empire');
    expect(weaponTagContexts(['Custom.Pulse'])).toEqual([]);
  });
  it.each(['ranged', 'melee', 'grenade'])('exports the selected %s tags repeatedly without consuming the editor values', async kind => {
    const weapon = createWeapon(kind); weapon.gun.label = 'Tag fixture';
    weapon.gun.weaponTags = ['Gun', 'Custom.Pulse'];
    const clone = weapon.clone(); clone.gun.weaponTags.push('Separate');
    expect(weapon.gun.weaponTags).toEqual(['Gun', 'Custom.Pulse']);
    for (let i = 0; i < 2; i++) {
      const zip = buildModArchive([weapon], [], 'TagTest');
      const xml = await zip.file('TagTest/Defs/ThingDefs/TagTestWeapons_Ranged.xml').async('string');
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const tags = doc.querySelector('weaponTags');
      expect(tags.getAttribute('Inherit')).toBe('False');
      expect([...tags.querySelectorAll('li')].map(node => node.textContent)).toEqual(['Gun', 'Custom.Pulse']);
      expect(weapon.gun.weaponTags).toEqual(['Gun', 'Custom.Pulse']);
    }
    weapon.gun.weaponTags = [];
    const cleared = await buildModArchive([weapon], [], 'TagTest').file('TagTest/Defs/ThingDefs/TagTestWeapons_Ranged.xml').async('string');
    const doc = new DOMParser().parseFromString(cleared, 'application/xml');
    expect(doc.querySelector('weaponTags').getAttribute('Inherit')).toBe('False');
    expect(doc.querySelectorAll('weaponTags > li')).toHaveLength(0);
  });
});
