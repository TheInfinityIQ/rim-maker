import rules from './data/accuracyRules.json';
import { definitionByName } from './gameDefinitions';
import { targetReach } from './rangePreview';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const f = Math.fround;
function interpolate(points, x) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) if (x <= points[i][0]) {
    const [a, b] = points[i - 1], [c, d] = points[i];
    return f(f(b) + f(f(f(d) - f(b)) * f(f(x - a) / f(c - a))));
  }
  return points.at(-1)[1];
}
export function projectileDefinition(weapon) {
  return weapon.projectileMode === 'existing' ? definitionByName('bullets', weapon.gun.verbs[0].defaultProjectile) : weapon.bullet;
}
export function parseTargetRanges(text) {
  const tokens = String(text).split(',').map(s => s.trim());
  if (!tokens.length || tokens.length > 8 || tokens.some(s => !/^\d+$/.test(s) || Number(s) < 1 || Number(s) > 100)) return { ranges: [], error: 'Enter one to eight whole-tile distances from 1 to 100, separated by commas.' };
  return { ranges: [...new Set(tokens.map(Number))].sort((a, b) => a - b), error: '' };
}
export function shooterAccuracy(skill) { return interpolate(rules.shooterCurve, clamp(Number(skill) || 0, 0, 20)); }
export function weaponAccuracyAt(weapon, distance) {
  const stats = weapon.gun.statBases;
  const values = ['AccuracyTouch', 'AccuracyShort', 'AccuracyMedium', 'AccuracyLong'].map((name, i) => {
    const lower = name[0].toLowerCase() + name.slice(1), value = stats[name] ?? stats[lower];
    return [rules.rangeKnots[i], clamp(value == null || value === '' ? rules.weaponAccuracyDefault : Number(value), .01, 1)];
  });
  return clamp(interpolate(values, distance), .01, 1);
}
export function accuracyEstimate(weapon, distance, skill = 10) {
  const projectile = projectileDefinition(weapon), properties = projectile?.projectile;
  const verb = weapon.gun.verbs[0];
  const reachable = targetReach(weapon, { x: distance, y: 0 }).within;
  const className = projectile?.thingClass?.split('.').at(-1);
  let reason = '';
  if (!reachable) reason = 'Outside weapon range';
  else if (verb.verbClass !== 'Verb_Shoot' || verb.canGoWild === false || className !== 'Bullet' || [properties?.flyOverhead, properties?.alwaysFreeIntercept].some(value => value === true || value === 'true')) reason = 'Special projectile: measure native impacts/effects';
  else if (Number(verb.forcedMissRadius) > .5) reason = 'Forced scatter: ordinary hit percentage does not describe this shot';
  else if (weapon.gun.equippedStatOffsets?.length || Object.keys(weapon.gun.statBases).some(key => /ShootingAccuracy|RangedWeapon_.*Multiplier/i.test(key))) reason = 'Additional modifiers require the native engine test';
  const shooter = shooterAccuracy(skill);
  const fromShooter = Math.max(f(Math.pow(f(shooter), f(distance))), f(rules.minimumAimChance));
  const equipment = weaponAccuracyAt(weapon, distance);
  if (!Number.isFinite(equipment)) reason = 'Enter numeric weapon accuracy values';
  const chance = clamp(Math.max(f(f(fromShooter) * f(equipment)), f(rules.minimumAimChance)), 0, 1);
  const damageDef = rules.damageDefs[properties?.damageDef];
  const explicitDamage = properties?.damageAmountBase;
  const damage = explicitDamage == null || explicitDamage === '' ? damageDef?.damage : Number(explicitDamage);
  const explicitAP = properties?.armorPenetrationBase;
  let penetration = explicitAP == null || explicitAP === '' ? (explicitDamage != null ? -1 : damageDef?.penetration) : Number(explicitAP);
  if (penetration < 0) penetration = damage * .015;
  if (!damageDef?.armourCategory) penetration = 0;
  return { distance, reachable, chance: reason ? null : chance, reason, shooterAccuracy: shooter, equipmentAccuracy: equipment,
    damage: Number.isFinite(damage) && damage >= 0 && !/modifiers/.test(reason) ? damage : null, penetration: Number.isFinite(penetration) && !/modifiers/.test(reason) ? penetration : null };
}
export function confidenceInterval(hits, trials) {
  if (!Number.isInteger(trials) || trials < 1 || hits < 0 || hits > trials) return null;
  const z = 1.959963984540054, p = hits / trials, denominator = 1 + z * z / trials;
  const center = (p + z * z / (2 * trials)) / denominator;
  const spread = z * Math.sqrt(p * (1 - p) / trials + z * z / (4 * trials * trials)) / denominator;
  return [Math.max(0, center - spread), Math.min(1, center + spread)];
}
export const accuracyGameVersion = rules.gameVersion;
