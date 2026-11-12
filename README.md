# RimMaker

A browser-based RimWorld ranged weapon, melee weapon and grenade mod editor, built with Vue 3, PrimeVue 4, and Vite.

See [weapon types and apparel](docs/weapons-and-apparel.md) for the new melee/grenade templates, supported editing/export rules, the installed weapon inventory, and armour/wearable implementation research. The Equipment guide is available in the site's navigation; apparel creation is not implemented yet. `npm run test:ingame:weapon-types` runs all 31 starting templates through the installed game in an isolated profile.

## Development

```sh
npm ci
npm run dev
npm run test:unit -- --run
npm run build
```

See [browser recreation tests](docs/browser-recreation-tests.md) for Playwright click-through tests, local Halo weapon reconstruction cases, and exported XML comparison reports.

See [RimWorld runtime tests](docs/rimworld-runtime-tests.md) for isolated in-game checks of the original Halo packs and browser-exported weapons (`npm run test:ingame:halo`).

## Colony Console theme

Component appearance belongs in `src/theme/colonyConsole.js`, a PrimeVue `definePreset` extension of Aura. Use primitive, semantic, and component design tokens for colors, surfaces, borders, focus rings, spacing, and component typography. The `.colony-console` class on the document root activates its dark color scheme.

Use PrimeVue components and their supported props for interactions, including tabs, dialogs, inputs, panels, buttons, and menus. Do not override `.p-*` styles, use deep selectors, or use `!important` to force component appearance. Check token names against the installed theme; newer documentation can describe a different PrimeVue version.

`src/assets/colony-console.css` owns the application shell, responsive layout, branding, ordinary content, and the RimWorld-style scrollbar. Layout wrappers can use grid or flex while the contained PrimeVue controls keep their theme styling.

The editor groups fields by their owning definitions and property blocks:

- Weapon: identity, graphicData, handling SoundDef, statBases and equipped stat offsets.
- Attacks: verbs with firing/throwing sounds, and primary/secondary melee tools.
- Projectile: its separate ThingDef, graphicData and projectile properties; omitted for melee.
- Crafting: stuff/materials, costList and recipeMaker with benches, research and skills.
- Preview: reusable scene, media audition, accuracy comparisons and native recordings.

All three weapon types offer game-derived templates and an explicit custom baseline. Ranged templates now include 20 guns, bows and launchers. The template's actual textures, projectiles, sounds, stats and recipes stay associated with it. Upload removal retains the prior selected game reference; template reset is a separate action. Export works on clones and isolates uploaded assets by weapon and role.

See [editor consistency contracts](docs/editor-consistency.md) for the field ownership map and cross-feature regression journeys. Preview embeds the [raid village scene](docs/weapon-preview.md) and [native shooting examples](docs/native-shooting-preview.md). Start `npm run preview:engine` locally for an actual game recording.

The [white-room range](docs/white-room-accuracy.md) adds selectable target distances, game-derived hit percentages, and native repeated-shot measurements with confidence intervals. Pawns and weapon/projectile sprites retain fixed tile dimensions when zoomed; stock assets support firing before uploads are supplied.

Tabs stay mounted, and weapon forms are cached when switching weapons. Work is held in memory; export before refreshing or closing the page. The generated definition catalog and mod metadata target RimWorld 1.6; combat behavior still requires in-game testing.

## Game definitions and expansion selection

The workbench uses `src/utility/data/gameDefinitions.json`, extracted from the installed Core and expansion XML with named-parent inheritance. The expansion-symbol toggles control the available dropdown definitions. Core stays enabled; selected expansion references determine export dependencies.

See [projectile rules and extraction instructions](docs/projectile-rules-and-expansions.md) for the assembly findings, custom projectile profiles, special-case handling, regeneration command, and limitations. The old LINQPad queries are historical; they are not the active data source.

## Deployment

See [the game data and projectile review](docs/game-data-and-projectile-review.md) for the extraction scripts' current coverage and projectile implementation gaps against RimWorld 1.6.4871.

GitHub Actions builds and publishes `dist` to GitHub Pages on pushes to `main`. Keep Vite's `/rim-maker/` base path and Vue Router's hash history for project-page hosting.
# Website plan and balance adviser

The [website plan](docs/website-plan.md) maps the pages, editing flows, ownership rules, balance methodology, release checks and deferred features.

Use **Balance** or the workbench's **Balance** tab for automatic reference selection and a three-way reference/current/proposed comparison. There are no required balance inputs; an optional power-preference slider changes the preview only. The user's approved flow is Preview → Apply adjustments, with Undo. Supported ordinary-bullet proposals tune recovery time to the selected reference across shared captured ranges; this is not full-weapon or universal auto-balance. Special effects and edited melee still require native evaluation. The advanced reference browser is under Equipment guide. Technology is authored under Weapon → Details and exports as `ThingDef/techLevel`; comparison preferences never export.

The main Balance route uses the actual selected workbench draft through a shared session store. With no draft, it shows a non-applicable assault-rifle demonstration. Its small shooting scenes reuse the existing game assets and flight equations and are explicitly labelled travel illustrations, not complete hit/impact simulations.

`src/utility/data/balanceCatalog.json` is a portable numerical extract from the accepted native research. It includes all 67 references and 537 ingredient entries, with unknowns and scope limits preserved. `scripts/build_balance_catalog.py` regenerates it when the research bundle is available under `docs/agent-reference/weapon-balance/`. No game DLLs, decompiled bodies or valuation-derived power weights are included.
