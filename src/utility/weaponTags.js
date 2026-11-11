import catalog from './data/weaponTagCatalog.json';

export const normalizeWeaponTags = tags => [...new Set((tags || []).map(tag => String(tag).trim()).filter(Boolean))];

export function weaponTagOptions(enabledPacks = ['Core'], selected = []) {
  const active = new Set(['Core', ...enabledPacks]);
  const tags = catalog.tags.filter(row => !row.pawnKinds.length || row.pawnKinds.some(kind => active.has(kind.pack))).map(row => row.tag);
  return normalizeWeaponTags([...tags, ...selected]).sort((a, b) => a.localeCompare(b));
}

export function weaponTagContexts(tags, enabledPacks = ['Core']) {
  const active = new Set(['Core', ...enabledPacks]), wanted = new Set(tags || []), matches = new Map();
  for (const row of catalog.tags) {
    if (!wanted.has(row.tag)) continue;
    for (const kind of row.pawnKinds) {
      if (!active.has(kind.pack)) continue;
      for (const id of kind.factions) {
        const faction = catalog.factions[id];
        if (!faction || !active.has(faction.pack)) continue;
        if (!matches.has(id)) matches.set(id, { id, ...faction, tags: new Set() });
        matches.get(id).tags.add(row.tag);
      }
    }
  }
  return [...matches.values()].map(row => ({ ...row, tags: [...row.tags].sort() })).sort((a, b) => a.label.localeCompare(b.label));
}
