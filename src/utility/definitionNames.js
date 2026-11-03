export function weaponDefName(modName, label) {
  const name = label.trim().normalize('NFKD').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'Unnamed';
  return `${modName}_${name}_Weapon`;
}
