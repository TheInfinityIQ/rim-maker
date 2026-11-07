import { definitionByName } from './gameDefinitions';

export const projectilePresets = [
  { value: 'bullet', label: 'Normal bullet', definition: 'Bullet_AssaultRifle' },
  { value: 'explosive', label: 'Explosive rocket', definition: 'Bullet_Rocket' },
  { value: 'incendiary', label: 'Incendiary bolt', definition: 'Bullet_IncendiaryLauncher' },
  { value: 'inferno', label: 'Inferno shell', definition: 'Bullet_InfernoCannon' },
  { value: 'emp', label: 'EMP shell', definition: 'Bullet_Shell_EMP' },
  { value: 'smoke', label: 'Smoke shell', definition: 'Bullet_Shell_Smoke' },
  { value: 'firefoam', label: 'Firefoam shell', definition: 'Bullet_Shell_Firefoam' },
  { value: 'frag-grenade', label: 'Frag grenade', definition: 'Proj_GrenadeFrag' },
  { value: 'molotov', label: 'Molotov cocktail', definition: 'Proj_GrenadeMolotov' },
  { value: 'emp-grenade', label: 'EMP grenade', definition: 'Proj_GrenadeEMP' },
  { value: 'tox-grenade', label: 'Tox grenade', definition: 'Proj_GrenadeTox' },
];

export function projectileCausesExplosion(weapon) {
  const definition = weapon.projectileMode === 'existing'
    ? definitionByName('bullets', weapon.gun.verbs[0].defaultProjectile) : weapon.bullet;
  // Matches VerbProperties.CausesExplosion in the installed 1.6 assembly.
  return ['Projectile_Explosive', 'Projectile_DoomsdayRocket'].includes(definition?.thingClass?.split('.').pop());
}

export function syncProjectileVerb(weapon) {
  const verb = weapon.gun.verbs[0];
  if (!verb) return;
  if (projectileCausesExplosion(weapon)) {
    if (!(Number(verb.forcedMissRadius) > 0)) verb.forcedMissRadius = 1;
  } else delete verb.forcedMissRadius;
}

export function applyProjectilePreset(weapon, kind) {
  const choice = projectilePresets.find(preset => preset.value === kind);
  if (!choice) throw new Error('Unknown projectile preset');
  const definition = definitionByName('bullets', choice.definition);
  weapon.projectileKind = kind;
  weapon.bullet.thingClass = definition.thingClass;
  weapon.bullet.projectile = structuredClone(definition.projectile);
  // Preserve an uploaded texture while the stock profile supplies a default look.
  weapon.bullet.graphicData = { ...structuredClone(definition.graphicData), textureFile: weapon.bullet.graphicData.textureFile };
  syncProjectileVerb(weapon);
}
