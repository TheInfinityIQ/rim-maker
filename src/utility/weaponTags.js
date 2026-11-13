import catalog from './data/weaponTagCatalog.json';

export const normalizeWeaponTags = tags => [...new Set((tags || []).map(tag => String(tag).trim()).filter(Boolean))];

// The native PawnWeaponGenerator uses Any/Contains, not an AND requirement.
export function weaponTagTree(selected = [], enabledPacks = ['Core'], matchingOnly = true) {
  const active = new Set(['Core', ...enabledPacks]), wanted = new Set(selected), factions = new Map();
  for (const row of catalog.tags) for (const kind of row.pawnKinds) {
    if (!active.has(kind.pack)) continue;
    const links = new Set([...kind.factions, kind.defaultFaction].filter(Boolean));
    for (const id of links) {
      const faction = catalog.factions[id];
      if (!faction || !active.has(faction.pack)) continue;
      if (!factions.has(id)) factions.set(id, { key: id, title: faction.label, detail: `${id} · ${faction.pack}`, label: `${faction.label} · ${id} · ${faction.pack}`, icon: 'pi pi-flag', units: new Map() });
      const branch = factions.get(id);
      if (!branch.units.has(kind.defName)) branch.units.set(kind.defName, {
        key: `${id}/${kind.defName}`, label: `${kind.label || kind.defName} · ${kind.defName} · ${kind.factions.includes(id) ? 'group/default-member association' : 'default faction only'}`,
        title: kind.label || kind.defName, detail: `${kind.defName} · ${kind.factions.includes(id) ? 'group/default-member association' : 'default faction only'}`, icon: 'pi pi-user', children: [],
      });
      branch.units.get(kind.defName).children.push({ key: `${id}/${kind.defName}/${row.tag}`, label: row.tag, tag: row.tag, matched: wanted.has(row.tag), icon: wanted.has(row.tag) ? 'pi pi-check-circle' : 'pi pi-circle' });
    }
  }
  return [...factions.values()].map(({ units, ...branch }) => ({ ...branch,
    children: [...units.values()].filter(unit => !matchingOnly || unit.children.some(tag => tag.matched)).sort((a,b) => a.label.localeCompare(b.label)),
  })).filter(branch => branch.children.length).sort((a,b) => a.label.localeCompare(b.label));
}

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
