# Game data and projectile review

Reviewed against the local RimWorld **1.6.4871 rev590** XML on November 1, 2026.

This is a source review, not an in-game compatibility certification. The counts below come from unpatched XML in the installed Core, Royalty, Ideology, Biotech, Anomaly, and Odyssey `Defs` directories. Scalar inheritance through `ThingDef` parents was followed to identify concrete `category=Projectile` definitions. Active expansion selection, XML patches, mods, and runtime C# processing can change the loaded definitions. Some entries are effects or ability projectiles rather than appropriate ammunition for ordinary guns.

## Existing extraction scripts

`src/utility/scripts` contains six `.linq` LINQPad queries. They use a hardcoded Windows installation path, read Core XML only, and print JSON for manual copying. They are not connected to an npm refresh command and do not record a source version or expansion requirements in the generated files.

| Query | What it currently does | Limitation |
| --- | --- | --- |
| `getSoundDefs.linq` | Reads Core `Defs/SoundDefs`; groups names by the prefix before `_` | Drops names with no underscore; misses definitions outside that directory and all expansion definitions |
| `getBulletDefs.linq` | Reads Core `ThingDefs_Misc/Weapons`; selects only immediate `ParentName='BaseBullet'` children | Misses other parents, inherited properties, turrets, shells, and expansions. Assumes local `projectile` and `graphicData` elements exist before dereferencing them |
| `getStatDefs.linq` | Reads Core `Stats_Pawns*.xml` | Covers pawn stat files only; does not resolve inherited fields |
| `getThingDefs.linq` | Contains the same pawn-stat extraction logic as `getStatDefs.linq` | Does not reproduce the shipped `things.json` resource list |
| `getSkillDefs.linq` | Reads Core `SkillDef` entries | No expansion support or provenance |
| `getToolCapacityDefs.linq` | Reads Core `ToolCapacityDef` entries | No expansion support or provenance |

The sound selector explicitly promotes the `Shot`, `Interact`, and `GunTail` groups in `src/utility/scripts/dataUtility.js`.

### Sound inventory

- Shipped `sounds.json`: **504** named sounds.
- Installed Core XML: **596** named `SoundDef` entries, including five outside the `SoundDefs` directory. The existing query's directory contains **591**.
- All **three** Core tails are already in the shipped file: `GunTail_Light`, `GunTail_Medium`, and `GunTail_Heavy`.
- `Shot_MiniSlug` is one missing weapon-related sound. Many other omitted Core names have no underscore and are intentionally excluded by the old query's logic.
- The inventory also found named sound definitions in Royalty (60), Ideology (98), Biotech (175), Anomaly (171), and Odyssey (131). These should not be offered without expansion provenance and dependency handling.

Do not rerun `getThingDefs.linq` into `things.json`: it would replace resources with pawn stats.

## Projectile coverage

The shipped `bullets.json` contains **21** entries. All are Core projectiles. The installed XML inventory contains:

| Content pack | Concrete projectile definitions |
| --- | ---: |
| Core | 41 |
| Royalty | 2 |
| Ideology | 0 |
| Biotech | 12 |
| Anomaly | 14 |
| Odyssey | 7 |
| Total | 76 |

The 20 Core entries absent from the dropdown include arrows and pila, frag/EMP/Molotov grenade projectiles, turret rounds, mortar shells (including incendiary, EMP, smoke, firefoam, and antigrain), rocket/firefoam projectiles, and the special `Spark` effect. Their omission follows from the old query's directory and immediate-parent filters.

### Existing projectile reuse versus custom projectile creation

| Behavior | Current state |
| --- | --- |
| Select an existing inferno shell | Present: `Bullet_InfernoCannon` is in the dropdown. Core defines it as `Projectile_Explosive` with `Flame` damage and radius 2.4 |
| Select existing incendiary, EMP, or smoke launcher ammunition | Present in the dropdown: `Bullet_IncendiaryLauncher`, `Bullet_EMPLauncher`, and `Bullet_SmokeLauncher` |
| Create a basic custom bullet | Fields exist for name, damage, stopping power, armor penetration, and speed; export has the wiring issues below |
| Create a custom explosive projectile | Incomplete. `WeaponRangedProjectileBomb` exists but is not constructed by the editor. The conditional radius field is therefore not reachable from ordinary weapon creation |
| Create a custom incendiary/EMP/smoke projectile | Incomplete. Custom damage is hardcoded to `Bullet`; no damage-type selector or corresponding effects controls exist |
| Create an explosive ranged weapon or grenade | Not implemented: `FormExplosiveRangedWeapon.vue` and `FormGrenadeWeapon.vue` are empty and those options are marked in development |
| Specialized projectile behavior | Incomplete. XML includes liquid, spawning, hellsphere, doomsday, fire-arrow, and beam classes; there are no dedicated custom editors for them |
| Flamethrower/beam weapon behavior | Not covered by projectile editing alone. Some weapons use specialized verb behavior rather than ordinary launched projectiles |

### Export issues requiring a separate implementation pass

1. `WeaponRangedBullet.clone()` reconstructs the bullet without preserving a `thingClass` assigned by `addThingClass()`. Custom explosive behavior cannot rely on that property surviving export.
2. Custom projectile names and the weapon's `defaultProjectile` reference are assigned inside the projectile-texture upload branch in `buildXML.js`. A custom projectile should be linked even when using an existing texture.
3. The existing/custom projectile choice is local UI state in `FormBullet.vue`; the export model does not explicitly represent that choice. `WeaponRanged.buildXML()` always emits a custom projectile definition, even when an existing projectile is selected.

These findings distinguish an available dropdown entry from verified, complete weapon export. No claim is made that every listed projectile can currently be used safely in an exported mod.

## Recommended implementation order

1. Replace the manual queries with an extractor that follows XML inheritance, scans all relevant definition directories, and records game version, content-pack provenance, and unresolved references. Keep a read-only comparison mode. Use loaded `DefDatabase` data when exact active-mod and patch results are required.
2. Represent existing versus custom projectile selection explicitly in the model. Fix cloning, independent custom definition naming, and weapon references before expanding the form.
3. Add custom bullet, explosive, incendiary, EMP, smoke, and firefoam modes with suitable thing classes and properties. Validate emitted XML and test it in-game.
4. Treat spawning/liquid/beam and specialized verbs separately; do not assume a different `damageDef` reproduces their behavior.

The data files and projectile implementation were audited, not regenerated or expanded, in this change. The shipped user-facing change is the disabled export explanation.
