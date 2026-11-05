import { describe, it, expect } from 'vitest';
import { WeaponRanged } from '@/models/weapon';
import { accuracyEstimate, weaponAccuracyAt, shooterAccuracy, parseTargetRanges, confidenceInterval } from '../weaponAccuracy';
import { applyProjectilePreset } from '../projectileRules';
import reference from '../../../public/previews/accuracy-reference.json';

function rifle() {
  const weapon = new WeaponRanged(); applyProjectilePreset(weapon, 'bullet');
  Object.assign(weapon.gun.statBases, { AccuracyTouch: .6, AccuracyShort: .7, AccuracyMedium: .65, AccuracyLong: .55 });
  weapon.gun.verbs[0].range = 30.9;
  return weapon;
}
describe('white-room rules checked against the actual installed game', () => {
  it('extracts the pawn skill curve and interpolates weapon range breakpoints', () => {
    expect(shooterAccuracy(0)).toBeCloseTo(.89); expect(shooterAccuracy(10)).toBeCloseTo(.97); expect(shooterAccuracy(20)).toBeCloseTo(.99);
    expect(weaponAccuracyAt(rifle(), 3)).toBeCloseTo(.6); expect(weaponAccuracyAt(rifle(), 12)).toBeCloseTo(.7);
    expect(weaponAccuracyAt(rifle(), 6)).toBeCloseTo(.6 + (.7 - .6) / 3);
    expect(weaponAccuracyAt(rifle(), 60)).toBeCloseTo(.55);
  });
  it.each(reference.rows.filter(row => row.reachable))('matches native ShotReport at $distance tiles and verifies damage/AP do not decay', row => {
    const estimate = accuracyEstimate(rifle(), row.distance, Number(reference.skill));
    expect(estimate.chance).toBeCloseTo(row.gameHitChance, 6);
    expect(estimate.damage).toBe(row.damageAtLaunch);
    expect(estimate.penetration).toBeCloseTo(row.penetrationAtLaunch, 6);
    expect(row.damageAtImpact).toBe(row.damageAtLaunch); expect(row.penetrationAtImpact).toBe(row.penetrationAtLaunch);
    const sigma = Math.sqrt(row.gameHitChance * (1 - row.gameHitChance) / row.trials);
    expect(Math.abs(row.hits / row.trials - row.gameHitChance)).toBeLessThan(5 * sigma + .01);
  });
  it('marks unreachable distances and avoids pretending ordinary percentages cover special projectiles', () => {
    expect(accuracyEstimate(rifle(), 40).chance).toBeNull();
    const weapon = rifle(); applyProjectilePreset(weapon, 'inferno');
    expect(accuracyEstimate(weapon, 12).chance).toBeNull();
    applyProjectilePreset(weapon, 'bullet'); weapon.gun.equippedStatOffsets.push({ defName: 'ShootingAccuracyPawn', value: .1 });
    expect(accuracyEstimate(weapon, 12).chance).toBeNull();
  });
  it('validates target ranges and reports sampling uncertainty', () => {
    expect(parseTargetRanges('40, 3, 12, 3').ranges).toEqual([3, 12, 40]);
    expect(parseTargetRanges('3, bad').error).toBeTruthy(); expect(parseTargetRanges('0, 101').error).toBeTruthy();
    const interval = confidenceInterval(100, 200); expect(interval[0]).toBeLessThan(.5); expect(interval[1]).toBeGreaterThan(.5);
    expect(confidenceInterval(0, 0)).toBeNull(); expect(confidenceInterval(0, 200)[0]).toBeCloseTo(0); expect(confidenceInterval(200, 200)[1]).toBeCloseTo(1);
  });
});
