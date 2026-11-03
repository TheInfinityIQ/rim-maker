import { describe, expect, it } from 'vitest';
import reference from './fixtures/range-reference.json';
import { placementCell, rangeCells, rangeOutline, targetReach, weaponRange } from '../rangePreview';
import scene from '../../components/weapon-preview/firing-range.json';
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
  it('starts 100 tiles from the outer sandbag and measures reach from the moved colonist', () => {
    const weapon = new WeaponRanged(); weapon.gun.verbs[0].range = 99.9;
    expect(Math.hypot(scene.colonistStart.x - scene.sandbag.x, scene.colonistStart.y - scene.sandbag.y)).toBe(100);
    expect(targetReach(weapon, scene.sandbag, scene.colonistStart).within).toBe(false);
    weapon.gun.verbs[0].range = 100;
    expect(targetReach(weapon, scene.sandbag, scene.colonistStart).within).toBe(true);
    weapon.gun.verbs[0].range = 20;
    expect(targetReach(weapon, scene.sandbag, { x: scene.sandbag.x - 20, y: scene.sandbag.y }).within).toBe(true);
  });
  it('accepts clear starting ground and rejects blocked and out-of-map drops', () => {
    const blocked = new Set(scene.blocked.map(([x, y]) => `${x},${y}`));
    expect(placementCell(scene.colonistStart, scene.bounds, blocked).valid).toBe(true);
    const [x, y] = scene.blocked[0];
    expect(placementCell({ x, y }, scene.bounds, blocked).valid).toBe(false);
    expect(placementCell({ x: scene.bounds.maxX + 1, y: 0 }, scene.bounds, blocked).valid).toBe(false);
  });
});
