import catalog from './data/balanceCatalog.json';
import { accuracyEstimate, projectileDefinition } from './weaponAccuracy';

export const balanceCatalog = catalog;
export const technologyLevels = ['Neolithic', 'Medieval', 'Industrial', 'Spacer', 'Ultra', 'Archotech'];
export const balanceSkills = [0, 10, 20];
export const balanceDistances = [3, 12, 25, 40];
export const referenceFor = weapon => catalog.items.find(row => row.id === weapon?.templateDefName);
export const technologyFor = weapon => weapon?.gun.techLevel || referenceFor(weapon)?.tech || 'Industrial';
export const readableRole = role => role.replaceAll('.', ' · ').replaceAll('-', ' ');
export function selectPeers(tech, kind, role = '') {
  return catalog.items.filter(row => row.tech === tech && (kind === 'melee' ? row.kind === 'melee' : row.kind !== 'melee') && (!role || row.role === role));
}
export function referenceOutput(row, distance = 12, skill = 10) {
  if (row.kind === 'melee') return { value: row.melee, reason: row.melee == null ? 'Not measured' : '', reachable: true };
  const measurement = row.rates.find(r => r.distance === distance && r.skill === skill);
  if (!measurement) return { value: null, reason: 'Separate effects / generated traits', reachable: null };
  if (!measurement.reachable) return { value: null, reason: 'Out of range', reachable: false };
  return { value: measurement.rate, reason: '', reachable: true };
}
const number = (value, fallback = null) => value == null || value === '' ? fallback : Number.isFinite(Number(value)) ? Number(value) : null;
export function assessDraft(weapon, distance = 12, skill = 10) {
  const work = number(weapon.gun.statBases.WorkToMake);
  const base = { value: null, reason: '', chance: null, range: null, work: work != null && work >= 0 ? work : null, penetration: null };
  if (weapon.kind === 'melee') return { ...base, reason: 'Edited melee requires native tool-selection, material and quality evaluation. Reference DPS is shown for official weapons only.' };
  if (weapon.gun.verbs.length !== 1) return { ...base, reason: 'Multiple attacks need separate native evaluation.' };
  const verb = weapon.gun.verbs[0], projectile = projectileDefinition(weapon), properties = projectile?.projectile;
  base.range = number(verb.range);
  if (weapon.gun.stuffCategories?.length) return { ...base, reason: 'Choose and test the actual stuff in the native game; material-dependent draft output is not calculated here.' };
  if (!['Bullet', 'Arrow'].includes(properties?.damageDef) || properties?.extraDamages?.length || Number(properties?.explosionRadius) > 0 || properties?.postExplosionGasType != null || properties?.postExplosionSpawnThingDef || properties?.preExplosionSpawnThingDef || weapon.gun.comps?.some?.(c => /UniqueWeapon|Bladelink/.test(JSON.stringify(c)))) {
    return { ...base, reason: 'Special damage, explosion or generated traits need effect-specific native tests. No ordinary power estimate is assigned.' };
  }
  const estimate = accuracyEstimate(weapon, distance, skill);
  if (estimate.reason) return { ...base, reason: estimate.reason, reachable: estimate.reachable };
  const burst = number(verb.burstShotCount, 1), spacing = number(verb.ticksBetweenBurstShots, 15);
  const warmup = number(verb.warmupTime, 0), cooldown = number(weapon.gun.statBases.RangedWeapon_Cooldown, 1);
  const cycle = warmup + cooldown + (burst - 1) * spacing / 60;
  if (![burst, spacing, warmup, cooldown, estimate.damage, estimate.penetration, cycle].every(v => v != null && Number.isFinite(v)) || !Number.isInteger(burst) || burst < 1 || spacing < 0 || warmup < 0 || cooldown <= 0 || cycle <= 0 || estimate.damage < 0 || estimate.penetration < 0) {
    return { ...base, reason: 'Enter valid non-negative damage/timing and a positive cooldown and whole burst count.' };
  }
  const value = estimate.damage * burst * estimate.chance / cycle;
  if (!Number.isFinite(value)) return { ...base, reason: 'These inputs do not produce a finite estimate.' };
  return { ...base, value, chance: estimate.chance, damage: estimate.damage, penetration: estimate.penetration, burst, cycle, warmup, cooldown, spacing, reachable: true };
}
export function summarizePeers(values) {
  const sorted = values.filter(v => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
  const n = sorted.length;
  return { n, min: n ? sorted[0] : null, max: n ? sorted[n - 1] : null,
    median: n ? (sorted[Math.floor((n - 1) / 2)] + sorted[Math.floor(n / 2)]) / 2 : null };
}
export function comparisonExplanation(assessment, summary) {
  if (assessment.value == null) return assessment.reason;
  if (!summary.n) return 'No comparable recorded output in this bracket/scenario. Keep this estimate separate; do not infer a technology level from it.';
  const position = assessment.value > summary.max ? 'above' : assessment.value < summary.min ? 'below' : 'within';
  return `Your primary estimate is ${position} the observed peer range. ${summary.n < 5 ? 'This cohort is too small for a dependable balance band. ' : ''}This is a descriptive comparison, not a fairness grade. Check role, reach, penetration, utility and access before adjusting fields.`;
}
export function ingredientEffort(ingredients = []) {
  return ingredients.map(item => {
    const source = catalog.materials[item.defName], quantity = number(item.value);
    const routes = quantity != null && quantity > 0 ? (source?.routes || []).map(route => ({ ...route, hours: route.hours * quantity })).filter(route => Number.isFinite(route.hours)) : [];
    return { id: item.defName, label: source?.label || item.defName || 'Choose a resource', quantity, routes,
      min: routes.length ? Math.min(...routes.map(r => r.hours)) : null,
      max: routes.length ? Math.max(...routes.map(r => r.hours)) : null };
  });
}
