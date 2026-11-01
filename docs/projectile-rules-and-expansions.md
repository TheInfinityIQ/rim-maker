# Projectile rules and expansion definitions

Implemented against RimWorld **1.6.4871 rev590**. Assembly inspected with ILSpy: `RimWorldWin64_Data/Managed/Assembly-CSharp.dll`, SHA-256 `5cf1b5be399d5b1c9c56ca72c9d35b4ecf307feacf5859d04acf5a1aa5926356a`. Decompiled files and the DLL remain local and are not distributed in this repository.

## Impact classes, not just damage types

| Runtime class | Actual behavior in the inspected assembly | Editor handling |
| --- | --- | --- |
| `RimWorld.Bullet` | Applies direct `DamageInfo` to the hit target, handles extra damage and stagger, and has ground-impact behavior | Custom normal-bullet profile; stock projectile reuse |
| `Verse.Projectile_Explosive` | Explodes on impact or after `explosionDelay`; consumes radius, damage, penetration, effects, fire, gas, and pre/post spawning properties | Custom explosive, incendiary, inferno, EMP, smoke, and firefoam profiles; stock reuse |
| `RimWorld.Projectile_DoomsdayRocket` | A main blast plus three additional flame explosions; extra behavior is hardcoded | Reuse the original definition; do not recreate as a generic explosive |
| `Verse.Projectile_HellsphereCannon` | Uses its own impact routine with a hardcoded 4.9-tile blast radius | Reuse the original definition; a generic radius slider would misrepresent its behavior |
| `RimWorld.FireArrow` | Spreads fuel and starts a fire, with water checks and special effects | Reuse the original definition |
| `RimWorld.Projectile_Liquid` | Affects extra cells and may place filth or replace terrain, with distinct drawing/impact behavior | Reuse the original definition |
| `Verse.Projectile_SpawnsThing` | Spawns `spawnsThingDef`, optionally looks for adjacent free space, and handles faction assignment | Reuse the original definition |
| `Verse.Projectile_SpawnsPawnZeroAge` | Generates a pawn using a pawn-kind definition and fixed zero ages | Reuse the original definition |
| `RimWorld.Beam` | Inherits bullet impact but overrides launch/position for immediate impact and optional beam mote | Reuse the original definition |
| `RimWorld.Spark` | Special fire effect | Inventoried, excluded from the ammunition dropdown |

`Verb_ShootBeam` and `Verb_SpewFire` are separate weapon firing paths. A launched projectile with `Flame` damage does not reproduce a continuous beam or flame spray. This update does not claim custom editors for those verbs or for the hardcoded special classes above.

### Assault rifle versus inferno cannon

Core's `Bullet_AssaultRifle` inherits the ordinary bullet class and supplies Bullet damage, damage amount 11, and speed 70. Core's `Bullet_InfernoCannon` instead uses `Projectile_Explosive`, Flame damage, speed 45, explosion radius 2.4, pre-explosion fuel spawning with chance 0.27, and the incendiary AI hint. Its omitted damage amount means the engine uses the damage definition's default, not zero.

The custom profiles retain these distinctions. Smoke retains `postExplosionGasType`; firefoam retains its spawn/effect settings. Shell profiles retain their overhead-flight settings, exposed as a separate control. Switching a custom profile deliberately replaces its old behavior properties with the selected stock starting profile, while preserving an uploaded texture.

## Export rules

- Existing projectile mode emits only a weapon reference to the original `defName`. It does not emit an empty or rewritten projectile, so specialized runtime behavior remains supplied by the game.
- Custom mode emits a separate projectile, its explicit impact class and properties, and a matching weapon reference. Unique projectile names are independent of texture uploads.
- Cloning preserves the impact class and avoids changing the user's live texture paths.
- The game-derived profile provides a stock texture when no custom projectile image is uploaded.
- Referenced expansion definitions produce `modDependencies` and `loadAfter` entries in `About.xml`. Merely enabling a content pack does not add an unused dependency.
- Deselecting an expansion keeps entered values. Export is disabled with an explanation if a selected definition needs a disabled expansion.

The generated metadata targets the catalog's game version, 1.6. Automated checks validate the exported structure and references; actual combat behavior still requires an in-game test.

## Data extraction

Run with Python 3 (standard library only):

```sh
python scripts/extract_game_definitions.py --game-dir "C:/Program Files (x86)/Steam/steamapps/common/RimWorld"
python -m unittest discover -s scripts -p "test_*.py"
```

The generated `src/utility/data/gameDefinitions.json` records the version, assembly hash, owning pack, package requirements, source XML path, and dropdown metadata. The extractor resolves named parents and nested XML inheritance, honors explicit `Inherit="False"` list replacement, includes names without underscores, and scans all definition directories in the six official content packs. Unresolved parents fail extraction rather than silently producing an incomplete catalog.

The catalog contains 76 concrete projectile definitions before selection filtering. Core is always included; the five official expansion symbols toggle additional projectile, sound, resource, stat, skill, and tool-capacity choices. Catalog conditions are checked against enabled packs. The original `.linq` queries and JSON files remain for historical reference, but the workbench uses the generated catalog.

This is a static official XML snapshot. It does **not** apply `Patches` or reproduce a player's loaded mods and conditional child-node processing; exact active-mod extraction would require querying the game's loaded `DefDatabase`. Specialized projectile choices are labeled by behavior, rather than treating all 76 entries as interchangeable bullets.

The expansion symbols are original, unmodified game textures, used with the attribution in the site footer. No paid gameplay assets beyond the requested identifying symbols, executable code, game DLLs, or decompiled source are shipped.
