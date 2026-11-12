import { describe, it, expect } from 'vitest';
import { createWeapon } from '../weaponTypes';
import { automaticComparison, proposeBalance, applyBalanceProposal, undoBalanceProposal } from '../automaticBalance';

describe('automatic peer selection and explicit, reversible tuning', () => {
  it('chooses technology/type/role before reach and never selects by edited damage', () => {
    const weapon = createWeapon();
    expect(automaticComparison(weapon).reference.id).toBe('Gun_AssaultRifle');
    weapon.bullet.projectile.damageAmountBase = 100;
    expect(automaticComparison(weapon).reference.id).toBe('Gun_AssaultRifle');
    weapon.gun.techLevel = 'Spacer';
    expect(automaticComparison(weapon).reference.tech).toBe('Spacer');
    weapon.gun.techLevel = 'Archotech';
    expect(automaticComparison(weapon).reference).toBeNull();
  });
  it('fits an overpowered rifle across shared ranges by recovery only, without changing the source', () => {
    const weapon = createWeapon(); weapon.bullet.projectile.damageAmountBase = 22;
    const before = JSON.stringify(weapon), result = proposeBalance(weapon);
    expect(result.ready).toBe(true); expect(result.changed).toBe(true);
    expect(result.cooldown).toBeCloseTo(4.7333333333);
    expect(result.comparison.shared.map(r => r.distance)).toEqual([3, 12, 25]);
    for (const row of result.samples) expect(row.proposed).toBeCloseTo(row.reference, 5);
    expect(JSON.stringify(weapon)).toBe(before);
    expect(result.preview.bullet.projectile.damageAmountBase).toBe(22);
    expect(result.preview.gun.costList).toEqual(weapon.gun.costList);
  });
  it('treats power as a preview preference, bounds it and reports recovery-floor limits', () => {
    const weapon = createWeapon();
    expect(proposeBalance(weapon, 125).cooldown).toBeLessThan(proposeBalance(weapon, 100).cooldown);
    expect(proposeBalance(weapon, 75).cooldown).toBeGreaterThan(proposeBalance(weapon, 100).cooldown);
    expect(weapon.gun.statBases.RangedWeapon_Cooldown).toBe(1.7);
    expect(proposeBalance(weapon, 126).ready).toBe(false);
    weapon.bullet.projectile.damageAmountBase = 1;
    expect(proposeBalance(weapon).limited).toBe(true);
    expect(proposeBalance(weapon).cooldown).toBe(1 / 60);
  });
  it('requires a fresh explicit Apply and restores only the recovery field on Undo', () => {
    const weapon = createWeapon(); weapon.bullet.projectile.damageAmountBase = 22;
    const proposal = proposeBalance(weapon);
    weapon.gun.label = 'Edited after proposal';
    expect(applyBalanceProposal(weapon, proposal)).toBeNull();
    const current = proposeBalance(weapon), record = applyBalanceProposal(weapon, current);
    expect(weapon.gun.statBases.RangedWeapon_Cooldown).toBe(current.cooldown);
    weapon.gun.costList[0].value = 200;
    expect(undoBalanceProposal(weapon, record)).toBe(true);
    expect(weapon.gun.statBases.RangedWeapon_Cooldown).toBe(1.7);
    expect(weapon.gun.costList[0].value).toBe(200);
    const again = applyBalanceProposal(weapon, proposeBalance(weapon));
    weapon.gun.statBases.RangedWeapon_Cooldown = 10;
    expect(undoBalanceProposal(weapon, again)).toBe(false);
    expect(weapon.gun.statBases.RangedWeapon_Cooldown).toBe(10);
  });
  it('never invents proposals for special, modified, zero-output or melee mechanics', () => {
    expect(proposeBalance(createWeapon('grenade')).ready).toBe(false);
    expect(proposeBalance(createWeapon('melee')).ready).toBe(false);
    const zero = createWeapon(); zero.bullet.projectile.damageAmountBase = 0;
    expect(proposeBalance(zero).ready).toBe(false);
    const modified = createWeapon(); modified.gun.equippedStatOffsets.push({ defName: 'ShootingAccuracyPawn', value: .05 });
    expect(proposeBalance(modified).ready).toBe(false);
  });
});
