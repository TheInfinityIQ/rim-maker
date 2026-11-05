import { describe, expect, it } from 'vitest';
import { WeaponRanged } from '@/models/weapon';
import { accuracyEstimate, coverPassChance } from '../weaponAccuracy';
import rules from '../data/accuracyOverlays.json';
import reference from '../../../public/previews/accuracy-overlay-reference.json';
const rifle = new WeaponRanged();
Object.assign(rifle.gun.statBases, { AccuracyTouch: .6, AccuracyShort: .7, AccuracyMedium: .65, AccuracyLong: .55 });
rifle.gun.verbs[0].range = 30.9;

describe('overlay rules verified against native RimWorld ShotReport', () => {
  it('records the same installed assembly for extracted rules and native references', () => {
    expect(reference.assemblySha256).toBe(rules.assemblySha256);
    expect(reference.engine).toBe('RimWorld');
  });
  it.each(reference.rows)('matches skill $skill, $quality, $weather, $cover at $distance tiles', row => {
    expect(Number(row.bodySize)).toBe(1);
    const estimate = accuracyEstimate(rifle, Number(row.distance), Number(row.skill), { quality: row.quality, weather: row.weather, cover: row.cover });
    expect(estimate.chance).toBeCloseTo(Number(row.chance), 6);
    expect(estimate.passCoverChance).toBeCloseTo(Number(row.passCover), 6);
  });
  it('applies the native aim floor before cover and preserves range and special-projectile limits', () => {
    expect(accuracyEstimate(rifle, 25, 0, { quality: 'Awful', weather: 'Fog', cover: 'Sandbags' }).chance).toBeCloseTo(.0201 * .45, 7);
    expect(coverPassChance(1, 'Sandbags')).toBe(1);
    expect(coverPassChance(2, 'Sandbags')).toBeGreaterThan(coverPassChance(3, 'Sandbags'));
    expect(coverPassChance(3, 'Sandbags')).toBeGreaterThan(coverPassChance(4, 'Sandbags'));
    expect(accuracyEstimate(rifle, 40, 20, { quality: 'Legendary' }).chance).toBeNull();
    const special = new WeaponRanged(); special.bullet.thingClass = 'Projectile_Explosive';
    expect(accuracyEstimate(special, 12, 20, { weather: 'Fog' }).chance).toBeNull();
  });
});
