import { weaponDefName } from './definitionNames';

export function getExportDisabledReason(weapons, modName, exporting = false) {
  if (exporting) return 'Your mod is being exported. Please wait.';

  const reasons = [];
  if (!weapons.length) reasons.push('Add at least one weapon before exporting.');
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(modName)) {
    reasons.push('The mod folder name must start with a letter and use only letters, numbers, and underscores.');
  }
  const names = new Set();
  weapons.forEach((weapon, index) => {
    const label = weapon.gun.label.trim();
    if (!label) reasons.push(`Give Weapon ${index + 1} a name.`);
    else if (/[0-9]$/.test(label)) reasons.push(`Weapon ${index + 1} (${label}) must not end in a number.`);
    const id = weaponDefName(modName, label);
    if (label && names.has(id)) reasons.push(`Weapon ${index + 1} (${label}) needs a distinct name; its exported definition would duplicate another weapon.`);
    names.add(id);
  });
  return reasons.join(' ');
}
