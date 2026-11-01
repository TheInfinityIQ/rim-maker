import { definitionByName } from './gameDefinitions';

export const projectilePresets = [
  { value: 'bullet', label: 'Normal bullet', definition: 'Bullet_AssaultRifle' },
  { value: 'explosive', label: 'Explosive rocket', definition: 'Bullet_Rocket' },
  { value: 'incendiary', label: 'Incendiary bolt', definition: 'Bullet_IncendiaryLauncher' },
  { value: 'inferno', label: 'Inferno shell', definition: 'Bullet_InfernoCannon' },
  { value: 'emp', label: 'EMP shell', definition: 'Bullet_Shell_EMP' },
  { value: 'smoke', label: 'Smoke shell', definition: 'Bullet_Shell_Smoke' },
  { value: 'firefoam', label: 'Firefoam shell', definition: 'Bullet_Shell_Firefoam' },
];

export function applyProjectilePreset(weapon, kind) {
  const choice = projectilePresets.find(preset => preset.value === kind);
  if (!choice) throw new Error('Unknown projectile preset');
  const definition = definitionByName('bullets', choice.definition);
  weapon.projectileKind = kind;
  weapon.bullet.thingClass = definition.thingClass;
  weapon.bullet.projectile = structuredClone(definition.projectile);
  // Preserve an uploaded texture while the stock profile supplies a default look.
  weapon.bullet.graphicData = { ...structuredClone(definition.graphicData), textureFile: weapon.bullet.graphicData.textureFile };
}
