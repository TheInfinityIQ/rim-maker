import { buildModArchive } from './scripts/buildXML';
import { weaponDefName } from './definitionNames';
import { requiredExpansions } from './gameDefinitions';

// Use the same export path as downloaded mods, on a clone of the editable weapon.
export async function nativeShootingRequest(weapon, colonist, target, options = {}) {
  const copy = weapon.clone(), mod = 'RimMakerPreview';
  const origin = { ...colonist }, aim = { ...target };
  copy.gun.label ||= 'Native preview';
  copy.gun.description ||= 'Temporary RimMaker shooting preview.';
  const mass = copy.gun.statBases.Mass ?? copy.gun.statBases.mass;
  if (mass == null || mass === '' || !Number.isFinite(Number(mass))) throw new Error('Set Weapon Mass in Weapon → Stat Bases before recording. RimWorld requires an authored mass for weapons.');
  const def = weaponDefName(mod, copy.gun.label);
  const archive = await buildModArchive([copy], [], mod).generateAsync({ type: 'base64' });
  return { weapon: def, colonist: origin, target: aim, archive, ...options,
    expansions: requiredExpansions([weapon]).map(pack => pack.id.toLowerCase()) };
}

export function validateNativeReplay(replay) {
  if (replay?.engine !== 'RimWorld' || replay.schema !== 1 || !Array.isArray(replay.frames) || !replay.frames.length || replay.frames.length > 901
    || !Number.isFinite(replay.durationTicks) || replay.durationTicks < 0 || replay.durationTicks > 1802) throw new Error('The companion returned an invalid recording.');
  let previous = -1;
  const video = /^(rifle|rocket|inferno)\.webm$/.test(replay.video || '');
  if (replay.video && !video) throw new Error('Invalid example video.');
  for (const frame of replay.frames) {
    if (!Number.isInteger(frame.tick) || frame.tick < previous || frame.tick > replay.durationTicks || (!video && !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(frame.image))) throw new Error('The recording contains an invalid frame.');
    previous = frame.tick;
  }
  return replay;
}
