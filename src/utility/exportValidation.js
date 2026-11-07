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
    if (weapon.kind === 'melee') {
      const tools = weapon.gun.tools || [];
      if (!tools.length) reasons.push(`Weapon ${index + 1} needs at least one melee attack.`);
      if (tools.length && !tools.some(tool => tool.chanceFactor == null || Number(tool.chanceFactor) > 0)) reasons.push(`Weapon ${index + 1} needs a melee attack with positive selection weight.`);
      tools.forEach((tool, attack) => {
        if (!tool.capacities?.length || !(Number(tool.power) > 0) || !(Number(tool.cooldownTime) > 0)) reasons.push(`Weapon ${index + 1}, melee attack ${attack + 1}: choose capacities and positive damage/cooldown.`);
      });
      if (weapon.gun.stuffCategories && (!weapon.gun.stuffCategories.length || !(Number(weapon.gun.costStuffCount) > 0))) reasons.push(`Weapon ${index + 1}: choose material categories and a positive material count.`);
    }
  });
  return reasons.join(' ');
}
