// Open-lane visual flight only. Native combat remains responsible for hit rolls and impacts.
export function graphicSize(graphicData) {
  const values = String(graphicData?.drawSize || '(1,1)').match(/[\d.]+/g)?.map(Number);
  return values?.length === 2 && values.every(n => n > 0 && Number.isFinite(n)) ? values : [1, 1];
}
export function flightPlan(weapon, origin, target, projectile) {
  const verb = weapon.gun.verbs[0], p = projectile?.projectile || {};
  const distance = Math.hypot(target.x - origin.x, target.y - origin.y);
  const speed = Number(p.speed ?? 70);
  if (!Number.isFinite(speed) || speed <= 0) throw new Error('Set a positive projectile speed before firing.');
  const startingTicks = Math.max(.001, Math.fround(Math.fround(distance) / Math.fround(speed / 100)));
  const warmup = Math.max(0, Math.round((Number(verb.warmupTime) || 0) * 60));
  const count = Math.min(20, Math.max(1, Math.trunc(Number(verb.burstShotCount) || 1)));
  const gap = Math.max(1, Math.trunc(Number(verb.ticksBetweenBurstShots) || 1));
  const cooldown = Number(weapon.gun.statBases.RangedWeapon_Cooldown ?? weapon.gun.statBases.rangedWeapon_Cooldown ?? 1);
  return { origin: { ...origin }, target: { ...target }, startingTicks, flightTicks: Math.max(1, Math.ceil(startingTicks)),
    warmup, count, gap, lastShot: warmup + (count - 1) * gap, cooldown: Math.max(0, Math.round(cooldown * 60)),
    angle: Math.atan2(target.y - origin.y, target.x - origin.x) * 180 / Math.PI + 90,
    arc: Math.min(Number(p.arcHeightFactor) || 0, distance * .2) };
}
export function flightAt(plan, elapsedTicks) {
  const shots = [];
  for (let i = 0; i < plan.count; i++) {
    const age = Math.floor(elapsedTicks) - plan.warmup - i * plan.gap;
    if (age < 0 || age >= plan.flightTicks) continue;
    const t = Math.max(0, Math.min(1, 1 - (plan.flightTicks - age) / plan.startingTicks));
    shots.push({ id: i, x: plan.origin.x + (plan.target.x - plan.origin.x) * t,
      y: plan.origin.y + (plan.target.y - plan.origin.y) * t - plan.arc * 4 * t * (1 - t), angle: plan.angle });
  }
  return shots;
}
