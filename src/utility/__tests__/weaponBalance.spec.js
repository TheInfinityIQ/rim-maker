import { describe, it, expect } from 'vitest';
import { createWeapon } from '../weaponTypes';
import { applyProjectilePreset } from '../projectileRules';
import { buildModArchive } from '../scripts/buildXML';
import { balanceCatalog, selectPeers, referenceOutput, assessDraft, summarizePeers, ingredientEffort, technologyFor } from '../weaponBalance';

describe('technology-first balance adviser', () => {
  it('preserves the entire official population, including special weapons and DLC uniques', () => {
    expect(balanceCatalog.items).toHaveLength(67);
    expect(new Set(balanceCatalog.items.map(r => r.id)).size).toBe(67);
    expect(balanceCatalog.items.filter(r => r.kind === 'melee')).toHaveLength(23);
    expect(balanceCatalog.items.filter(r => r.kind !== 'melee')).toHaveLength(44);
    expect(selectPeers('Industrial', 'ranged')).toHaveLength(30);
    expect(selectPeers('Spacer', 'ranged')).toHaveLength(7);
    expect(selectPeers('Spacer', 'ranged').filter(r => referenceOutput(r).value != null)).toHaveLength(2);
    expect(selectPeers('Archotech', 'ranged')).toEqual([]);
    const raw = JSON.stringify(balanceCatalog);
    for (const name of ['marketValue', 'ingredientValueProxy', 'costScore']) expect(raw).not.toContain(`"${name}"`);
  });
  it('matches all captured assault-rifle primary scenarios without mutating the draft', () => {
    const weapon = createWeapon(), before = JSON.stringify(weapon);
    const reference = balanceCatalog.items.find(r => r.id === 'Gun_AssaultRifle');
    for (const row of reference.rates) {
      const result = assessDraft(weapon, row.distance, row.skill);
      if (row.reachable) expect(result.value).toBeCloseTo(row.rate, 5);
      else { expect(result.value).toBeNull(); expect(result.reachable).toBe(false); }
    }
    expect(JSON.stringify(weapon)).toBe(before);
    expect(assessDraft(weapon).value).toBeCloseTo(5.28387825, 6);
  });
  it('responds to damage/timing but not fixed ingredient quantities or technology classification', () => {
    const weapon = createWeapon(), base = assessDraft(weapon);
    weapon.gun.costList[0].value *= 2; weapon.gun.techLevel = 'Spacer';
    expect(assessDraft(weapon).value).toBe(base.value);
    weapon.bullet.projectile.damageAmountBase *= 2;
    expect(assessDraft(weapon).value).toBeCloseTo(base.value * 2);
    expect(assessDraft(weapon).penetration).toBeCloseTo(base.penetration * 2);
    weapon.gun.statBases.RangedWeapon_Cooldown *= 2;
    expect(assessDraft(weapon).value).toBeLessThan(base.value * 2);
  });
  it('keeps unsupported, unreachable and real zero outcomes distinct', () => {
    const weapon = createWeapon();
    weapon.bullet.projectile.damageAmountBase = 0;
    expect(assessDraft(weapon).value).toBe(0);
    weapon.bullet.projectile.damageAmountBase = 'bad'; expect(assessDraft(weapon).value).toBeNull();
    applyProjectilePreset(weapon, 'inferno'); expect(assessDraft(weapon).value).toBeNull();
    expect(assessDraft(createWeapon('grenade')).value).toBeNull();
    expect(assessDraft(createWeapon('melee')).reason).toContain('tool-selection');
    const modified = createWeapon(); modified.gun.equippedStatOffsets.push({ defName: 'ShootingAccuracyPawn', value: .05 });
    expect(assessDraft(modified).reason).toContain('modifiers');
    const stuff = createWeapon(); stuff.gun.stuffCategories = ['Metallic']; expect(assessDraft(stuff).value).toBeNull();
    expect(summarizePeers([null, 0, 2, 4])).toEqual({ n: 3, min: 0, max: 4, median: 2 });
    expect(summarizePeers([null]).median).toBeNull();
  });
  it('multiplies each alternate ingredient route separately, retaining unknown inputs', () => {
    const rows = ingredientEffort([{ defName: 'Steel', value: 2 }, { defName: 'NoSuchResource', value: 10 }]);
    const one = ingredientEffort([{ defName: 'Steel', value: 1 }])[0];
    expect(rows[0].min).toBeCloseTo(one.min * 2); expect(rows[0].routes.length).toBe(one.routes.length);
    expect(rows[1].min).toBeNull();
    expect(ingredientEffort([{ defName: 'Steel', value: 'bad' }])[0].min).toBeNull();
  });
  it('exports deliberate technology changes and never comparison preferences', async () => {
    const weapon = createWeapon(); weapon.gun.label = 'Technology rifle';
    expect(technologyFor(weapon)).toBe('Industrial');
    weapon.gun.techLevel = 'Spacer';
    expect(technologyFor(weapon.clone())).toBe('Spacer');
    const zip = buildModArchive([weapon], [], 'BalanceTest');
    const xml = await zip.file('BalanceTest/Defs/ThingDefs/BalanceTestWeapons_Ranged.xml').async('string');
    expect(xml).toContain('<techLevel>Spacer</techLevel>');
    expect(xml).not.toContain('balance'); expect(xml).not.toContain('comparison');
    expect(weapon.gun.techLevel).toBe('Spacer');
  });
});
