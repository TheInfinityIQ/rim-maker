import { describe, expect, it } from 'vitest';
import reference from './fixtures/range-reference.json';
import { rangeCells, rangeOutline, targetReach, weaponRange } from '../rangePreview';
import { WeaponRanged } from '@/models/weapon';

describe('RimWorld range preview', () => {
  it.each(reference.radii)('matches the actual 1.6 GenRadial count at $radius tiles', ({ radius, cells }) => {
    expect(rangeCells(radius)).toHaveLength(cells);
  });
  it('draws the exposed tile edges rather than a smooth circle', () => {
    // Radius zero contains only the colonist's tile: four one-tile boundary segments.
    expect(rangeOutline(0).match(/M/g)).toHaveLength(4);
    expect(rangeOutline(1).match(/M/g)).toHaveLength(12);
  });
  it('uses fractional range at the diagonal boundary and respects minimum range', () => {
    const weapon = new WeaponRanged(); weapon.gun.verbs[0].range = 1.4;
    expect(targetReach(weapon, { x: 1, y: 1 }).within).toBe(false);
    weapon.gun.verbs[0].range = 1.5;
    expect(targetReach(weapon, { x: 1, y: 1 }).within).toBe(true);
    weapon.gun.verbs[0].minRange = 2;
    expect(targetReach(weapon, { x: 1, y: 0 }).within).toBe(false);
  });
  it('handles unfinished and extreme inputs without unbounded geometry work', () => {
    const weapon = new WeaponRanged();
    for (const value of ['', null, '-2', 'not a range', Infinity]) {
      weapon.gun.verbs[0].range = value;
      expect(weaponRange(weapon)).toBeNull();
    }
    expect(rangeCells(100000)).toEqual([]);
    expect(rangeOutline(NaN)).toBe('');
  });
});
