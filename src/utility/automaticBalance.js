import { balanceCatalog, technologyFor, referenceFor, assessDraft, referenceOutput } from './weaponBalance';

const distances = [3, 12, 25, 40];
export const balanceSignature = weapon => JSON.stringify({ kind: weapon.kind, template: weapon.templateDefName,
  mode: weapon.projectileMode, gun: weapon.gun, bullet: weapon.bullet });
const finite = value => typeof value === 'number' && Number.isFinite(value);

export function automaticComparison(weapon) {
  const original = referenceFor(weapon), tech = technologyFor(weapon);
  const candidates = balanceCatalog.items.filter(r => r.tech === tech && r.kind === weapon.kind);
  const range = Number(weapon.gun.verbs[0]?.range);
  // Lexicographic matching, not a weighted price/power score. Do not pick peers by draft damage.
  const rank = row => [row.role === original?.role ? 0 : 1,
    row.rates.some(r => r.skill === 10 && r.reachable && finite(r.rate)) ? 0 : 1,
    Number.isFinite(range) && row.range != null ? Math.abs(row.range - range) : 0,
    row.id === original?.id ? 0 : 1];
  candidates.sort((a, b) => {
    const x = rank(a), y = rank(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return a.id.localeCompare(b.id);
  });
  const reference = candidates[0] || null;
  const samples = reference ? distances.map(distance => ({ distance, draft: assessDraft(weapon, distance, 10), reference: referenceOutput(reference, distance, 10) })) : [];
  const shared = samples.filter(r => finite(r.draft.value) && finite(r.reference.value));
  return { reference, cohortSize: candidates.length, samples, shared,
    distance: shared.find(r => r.distance === 12)?.distance ?? shared[0]?.distance ?? 12,
    reason: reference ? `Matched automatically within ${tech}, preferring the starting template's role, measured coverage and closest reach. No price or damage-based match.` : `No official ${weapon.kind} reference in ${tech}. No other technology tier is silently substituted.` };
}

export function proposeBalance(weapon, power = 100) {
  const signature = balanceSignature(weapon), comparison = automaticComparison(weapon);
  const result = { signature, comparison, ready: false, changed: false, power, reason: '', preview: null, samples: [] };
  if (!finite(power) || power < 75 || power > 125) return { ...result, reason: 'Output preference must be between 75% and 125%.' };
  if (!comparison.reference) return { ...result, reason: comparison.reason };
  if (!comparison.shared.length) return { ...result, reason: assessDraft(weapon, comparison.distance, 10).reason || 'No shared verified primary-output scenarios. Native effect testing is required.' };
  const draftTotal = comparison.shared.reduce((sum, r) => sum + r.draft.value, 0);
  const referenceTotal = comparison.shared.reduce((sum, r) => sum + r.reference.value, 0);
  if (!(draftTotal > 0) || !(referenceTotal > 0) || !Number.isFinite(draftTotal + referenceTotal)) return { ...result, reason: 'Zero or invalid output cannot be tuned safely by changing recovery time.' };
  const current = comparison.shared[0].draft;
  const desiredCycle = current.cycle * draftTotal / (referenceTotal * power / 100);
  const fixed = current.warmup + (current.burst - 1) * current.spacing / 60;
  const ticks = Math.max(1, Math.round((desiredCycle - fixed) * 60));
  const cooldown = ticks / 60;
  if (!Number.isFinite(cooldown) || cooldown > 100000) return { ...result, reason: 'The required recovery time is outside the supported tuning range.' };
  const preview = weapon.clone();
  preview.gun.statBases.RangedWeapon_Cooldown = cooldown;
  const samples = comparison.shared.map(r => ({ distance: r.distance, reference: r.reference.value,
    current: r.draft.value, proposed: assessDraft(preview, r.distance, 10).value }));
  if (samples.some(r => !finite(r.proposed))) return { ...result, reason: 'The proposed settings could not be evaluated.' };
  return { ...result, ready: true, preview, samples, cooldown,
    changed: Math.abs(current.cooldown - cooldown) > 1e-8,
    before: weapon.gun.statBases.RangedWeapon_Cooldown,
    hadField: Object.hasOwn(weapon.gun.statBases, 'RangedWeapon_Cooldown'),
    limited: desiredCycle - fixed < 1 / 60,
    achieved: samples.reduce((sum, r) => sum + r.proposed, 0) / referenceTotal * 100,
    reason: 'Only recovery time is proposed. Reach, damage, implicit penetration, burst, accuracy, costs, research and identity stay unchanged. The target matches primary output across the shared captured ranges, not total combat strength.' };
}

export function applyBalanceProposal(weapon, proposal) {
  if (!proposal?.ready || !proposal.changed || proposal.signature !== balanceSignature(weapon) ||
    !finite(proposal.cooldown) || proposal.cooldown < 1 / 60 || proposal.cooldown > 100000) return null;
  // Recompute the proposed edit: callers cannot supply an arbitrary field/value patch.
  const verified = proposeBalance(weapon, proposal.power);
  if (!verified.ready || verified.cooldown !== proposal.cooldown) return null;
  const record = { before: verified.before, hadField: verified.hadField, after: verified.cooldown };
  weapon.gun.statBases.RangedWeapon_Cooldown = proposal.cooldown;
  return record;
}
export function undoBalanceProposal(weapon, record) {
  if (!record || weapon.gun.statBases.RangedWeapon_Cooldown !== record.after) return false;
  if (record.hadField) weapon.gun.statBases.RangedWeapon_Cooldown = record.before;
  else delete weapon.gun.statBases.RangedWeapon_Cooldown;
  return true;
}
