import catalog from './data/gameDefinitions.json';

export const expansionPacks = Object.entries(catalog.packs).map(([id, pack]) => ({
  id, packageId: pack.packageId,
  icon: id === 'Core' ? null : `${import.meta.env.BASE_URL}expansions/ExpansionIcon_${id}.png`,
}));
export const gameVersion = catalog.gameVersion;

export function availableDefinitions(kind, enabled = ['Core']) {
  const active = new Set(['Core', ...enabled]);
  const result = new Map();
  for (const pack of expansionPacks) {
    if (!active.has(pack.id)) continue;
    for (const definition of catalog.packs[pack.id][kind] || []) {
      if (!definition.requires.every(id => active.has(id))) continue;
      if (definition.requiresAny?.length && !definition.requiresAny.some(id => active.has(id))) continue;
      if (kind === 'bullets' && !definition.selectable) continue;
      result.set(definition.defName, definition);
    }
  }
  return [...result.values()].sort((a, b) => a.label.localeCompare(b.label));
}

const indexes = Object.fromEntries(['bullets', 'things', 'stats', 'skills', 'tools', 'sounds', 'benches', 'research'].map(kind => [
  kind, new Map(Object.values(catalog.packs).flatMap(pack => (pack[kind] || []).map(row => [row.defName, row]))),
]));

export function referencedDefinitions(weapons) {
  const refs = new Set();
  function add(kind, value) {
    const row = indexes[kind].get(typeof value === 'object' ? value?.label : value);
    if (row) refs.add(row);
  }
  for (const weapon of weapons) {
    if (weapon.projectileMode === 'existing') add('bullets', weapon.gun.verbs[0]?.defaultProjectile);
    for (const cost of weapon.gun.costList) add('things', cost.defName);
    for (const stat of weapon.gun.equippedStatOffsets) add('stats', stat.defName);
    for (const skill of weapon.gun.recipeMaker.skillRequirements) add('skills', skill.defName);
    for (const bench of weapon.gun.recipeMaker.recipeUsers || []) add('benches', bench);
    add('research', weapon.gun.recipeMaker.researchPrerequisite);
    for (const project of weapon.gun.recipeMaker.researchPrerequisites || []) add('research', project);
    for (const tool of weapon.gun.tools) for (const capacity of tool.capacities) add('tools', capacity);
    if (!weapon.gun.soundInteractFile) add('sounds', weapon.gun.soundInteract);
    for (const verb of weapon.gun.verbs) {
      if (!verb.soundCastFile) add('sounds', verb.soundCast);
      if (!verb.soundCastTailFile) add('sounds', verb.soundCastTail);
    }
  }
  return [...refs];
}

export function requiredExpansions(weapons, enabled = expansionPacks.map(pack => pack.id)) {
  const required = new Set();
  for (const weapon of weapons) if (weapon.templatePack && weapon.templatePack !== 'Core') required.add(weapon.templatePack);
  for (const row of referencedDefinitions(weapons)) {
    row.requires.forEach(id => required.add(id));
    if (row.requiresAny?.length && !row.requiresAny.some(id => required.has(id))) {
      required.add(row.requiresAny.find(id => enabled.includes(id)) || row.requiresAny[0]);
    }
  }
  return expansionPacks.filter(pack => required.has(pack.id));
}

export function unavailableReferenceReason(weapons, enabled) {
  const active = new Set(['Core', ...enabled]);
  const templatePacks = [...new Set(weapons.filter(weapon => weapon.templatePack && !active.has(weapon.templatePack)).map(weapon => weapon.templatePack))];
  if (templatePacks.length) return `Selected weapon templates need disabled expansions: ${templatePacks.join(', ')}. Enable those expansions before exporting.`;
  const unavailable = referencedDefinitions(weapons).filter(row =>
    row.requires.some(id => !active.has(id)) || (row.requiresAny?.length && !row.requiresAny.some(id => active.has(id))),
  );
  return unavailable.length
    ? `Some selected definitions need disabled expansions: ${unavailable.map(row => `${row.label} (${row.pack})`).join(', ')}. Enable those expansions or change the selections.`
    : '';
}

export function definitionByName(kind, name) { return indexes[kind].get(name); }
