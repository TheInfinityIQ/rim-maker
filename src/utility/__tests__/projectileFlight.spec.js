import { it, expect } from 'vitest';
import { WeaponRanged } from '@/models/weapon';
import { flightAt, flightPlan, graphicSize } from '../projectileFlight';
it('uses game speed/100 tiles per tick and native tick-rounded linear travel', () => {
  const weapon = new WeaponRanged(), plan = flightPlan(weapon, { x: 0, y: 0 }, { x: 14, y: 0 }, weapon.bullet);
  expect(plan.flightTicks).toBe(20);
  expect(flightAt(plan, plan.warmup - 1)).toEqual([]);
  expect(flightAt(plan, plan.warmup)[0].x).toBe(0);
  expect(flightAt(plan, plan.warmup + 10)[0].x).toBeCloseTo(7);
  expect(flightAt(plan, plan.warmup + 20)).toEqual([]);
});
it('keeps burst timing, rejects zero speed, and previews arc height without scoring hits', () => {
  const weapon = new WeaponRanged(); weapon.gun.verbs[0].burstShotCount = 3; weapon.gun.verbs[0].ticksBetweenBurstShots = 10;
  weapon.bullet.projectile.arcHeightFactor = .2;
  const plan = flightPlan(weapon, { x: 0, y: 0 }, { x: 14, y: 0 }, weapon.bullet);
  expect(flightAt(plan, plan.warmup + 10)).toHaveLength(2);
  expect(flightAt(plan, plan.warmup + 10)[0].y).toBeCloseTo(-.2);
  weapon.bullet.projectile.speed = 0;
  expect(() => flightPlan(weapon, { x: 0, y: 0 }, { x: 14, y: 0 }, weapon.bullet)).toThrow('positive');
  expect(graphicSize({ drawSize: '(0.5, 1.5)' })).toEqual([.5, 1.5]);
  expect(graphicSize({})).toEqual([1, 1]);
});
