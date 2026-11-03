import { describe, expect, it } from 'vitest';
import { getExportDisabledReason } from '../exportValidation';

const namedWeapon = (label) => ({ gun: { label } });

describe('disabled export explanations', () => {
  it('explains the empty workbench', () => {
    expect(getExportDisabledReason([], 'TestMod')).toBe('Add at least one weapon before exporting.');
  });
  it('identifies every weapon that needs a name', () => {
    expect(getExportDisabledReason([namedWeapon(''), namedWeapon('Rifle'), namedWeapon('  ')], 'TestMod'))
      .toBe('Give Weapon 1 a name. Give Weapon 3 a name.');
  });
  it('explains both invalid folder and weapon names', () => {
    const reason = getExportDisabledReason([namedWeapon('Rifle 2')], 'My Mod');
    expect(reason).toContain('mod folder name must start with a letter');
    expect(reason).toContain('Weapon 1 (Rifle 2) must not end in a number');
  });
  it('blocks duplicate export while a download is being prepared', () => {
    expect(getExportDisabledReason([namedWeapon('Rifle')], 'TestMod', true)).toContain('being exported');
  });
  it('removes the explanation once the mod is ready', () => {
    expect(getExportDisabledReason([namedWeapon('Rifle'), namedWeapon('Carbine')], 'TestMod')).toBe('');
  });
  it('explains when two names would create the same exported definition', () => {
    expect(getExportDisabledReason([namedWeapon('Rifle/A'), namedWeapon('Rifle A')], 'TestMod')).toContain('distinct name');
  });
});
