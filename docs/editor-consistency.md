# Editor consistency contracts

The domain entities are RimWorld XML **Defs** (not HTML classes). The existing JavaScript models compose a weapon ThingDef and an optional projectile ThingDef, with nested property blocks. Legacy model names such as WeaponRanged remain compatible with prior code; they are not a reason to organize melee and ranged fields differently.

| Editor section | Owning model/definition | Contents |
| --- | --- | --- |
| Weapon | Weapon ThingDef | Identity, graphicData, soundInteract, statBases, equippedStatOffsets |
| Attacks | verbs and tools | Fire/throw timing and range, soundCast, soundCastTail, primary or secondary melee tools |
| Projectile | Separate projectile ThingDef | Existing/custom source, identity, thingClass, graphicData and projectile properties |
| Crafting | Weapon material/cost/recipe blocks | stuffCategories, costStuffCount, costList, recipeMaker benches/research/skills |
| Preview | View state; not exported | Range scene, firing visual, audio audition, accuracy graph, stock recordings and native test |

Every weapon family uses this ownership map. Melee omits Projectile and ranged verbs. Weapon mass and crafting workload stay in statBases for every type; melee does not have a second copy of those inputs in its preview. The former Files tab is replaced by media controls beside the definition/property that owns each asset. Existing editing and preview capabilities remain accessible.

## Template and media rules

The same picker offers 20 ranged templates, 7 melee templates and 4 grenade templates, filtered by enabled packs. Explicit custom creation retains a stated reference baseline. Source values come from inherited official XML; missing melee handling sound follows the reviewed game's `ThingDef.ResolveReferences` fallback to Standard_Pickup. Do not invent rifle audio for an unspecified non-rifle field. Some distinct SoundDefs intentionally use the same underlying game clip.

The template association identifies the starting definition, not a claim that edited values are still stock. Copy/clone preserves all authored properties and absent verb fields; a bow without a tail must not acquire GunTail_Medium during export. StatBases uses the game's actual case-sensitive field names.

`templateMedia.json` maps actual texture paths and SoundDef IDs to references. Missing reference media is disclosed and its game path remains intact. Uploaded files override their selected game references without erasing them. **Remove File** reveals that selection; **Use template sound/texture** separately restores the starting template. A native SoundDef audition is a resolved sample, not a recreation of every random grain, pitch, volume or environmental effect. Captured PCM is checked for non-silence before publication.

Weapon and projectile graphic forms and the firing scene share `referenceTextureUrl`, which resolves both template media and captured projectile textures. A known texture must not appear available in the scene but unavailable in its authoring form. The projectile regression journey covers the stock reference, custom upload, removal, template reset and exported texture path.

Audition controls share one per-weapon media controller, have stable play/stop buttons and remain cancellable while loading. Errors belong to the sound being auditioned. Leaving a tab or cached weapon stops sound; leaving Preview stops the firing animation and pauses recordings. Cosmetic/name/sound changes do not invalidate independent native accuracy measurements, while combat configuration changes do.

Use PrimeVue's supported filter-reset props: retained dropdown searches can otherwise hide a programmatically restored selection and display a misleading placeholder. Use layout CSS only for the app's own wrappers. Keep the theme preset responsible for component appearance.

Use `editor-field` for label/control groups and `choice-field` for a checkbox with text. Parallel fields share label spacing and align their controls; resource rows use compact selected values and keep full definition names in the options. The supported PrimeVue Pass Through configuration in `main.js` supplies consistent control line heights because the installed theme has no line-height token. Keep narrow grid tracks shrinkable so long definition names cannot expand the mobile page.

## Export rules

The definition-field audit keeps authored names/descriptions, numeric values, custom tag IDs and connection keys as direct inputs. Existing projectile, sound, skill, stat, capacity, technology, material, recipe and tag references use Select/MultiSelect controls. Texture paths are asset references; their editable Select offers captured game thumbnails and preserves arbitrary mod paths. Do not replace custom authoring with a closed official-only list.

The NPC tag explorer uses the official native catalog: faction → unit kind → tag. Group/default-member links and default-faction-only affiliation are labelled separately. PawnWeaponGenerator matches any shared tag (OR); never present general + specialist tags as an AND restriction. Diagram matches are candidates, not permission or spawn guarantees. The catalog includes unit labels and exact IDs; enabled DLC filters both factions and units.

All downloads and native requests use the same archive builder on clones. Export must not replace selected SoundDefs or game texture paths on editable objects. SoundDefs for uploaded clips are generated centrally. Uploaded assets are placed under `Textures/<mod>/<weapon>/<role>/` or `Sounds/<mod>/<weapon>/<role>/`, so equal filenames on different weapons or roles cannot overwrite one another. Source bytes remain unchanged. Reference assets are not bundled into exported mods.

Use searchable PrimeVue MultiSelect checkbox lists for definition references that allow multiple choices. Recipe benches show native game icons; bench and research options expose readable labels, exact definition IDs and source packs. Filter by enabled DLC, retain selected disabled/custom references, and explain blocked export rather than silently dropping them. Skill requirements retain a single skill selector plus a numeric minimum per row.

Template recipes, benches, research, quantities and skills must survive cloning and export. All selected research projects are required. Export bench/research lists with explicit replacement semantics and clear the scalar inherited research when no project remains. Native tests use the game's default valid stuff for a stuff-made ranged definition; arbitrary material combinations still require game validation.

## Representative regression journeys

`e2e/cohesion.spec.js` checks a mace, frag grenade and pump shotgun through select sound → upload → export → remove → template reset → change tabs, plus repeated downloads with equal filenames and bow defaults. Other browser suites preserve range/accuracy/media behavior and mixed-type exports. The local Halo suite recreates 19 installed mod weapons through the same forms and compares authored fields and uploaded bytes; its coverage reports retain explicit unsupported-field differences.

`weaponTypes.spec.js` verifies all templates and clone/export invariants. `test-template-media.mjs` verifies per-template references, hashes and non-silent decoded audio. The installed-game harness exercises all 31 templates' crafting products, equipping, attacks/projectiles, special effects and dropping. These are targeted checks, not certification of every custom field combination or other mod interaction.

Before broad testing, run a representative authoring journey and fix its first shared failure. Broad counts alone are not evidence that an interaction or default makes sense.
