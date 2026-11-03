# RimMaker

A browser-based RimWorld ranged weapon mod editor, built with Vue 3, PrimeVue 4, and Vite.

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

The editor preserves the original sections:

- Details: weapon identity and equipped stat offsets.
- Combat: verbs, tools, stat bases, and projectiles.
- Crafting: resource costs and skill requirements.
- Files: weapon/projectile textures and shooting, tail, and interaction sounds.

Tabs stay mounted, and weapon forms are cached when switching weapons. Work is held in memory; export before refreshing or closing the page. The generated definition catalog and mod metadata target RimWorld 1.6; combat behavior still requires in-game testing.

## Game definitions and expansion selection

The workbench uses `src/utility/data/gameDefinitions.json`, extracted from the installed Core and expansion XML with named-parent inheritance. The expansion-symbol toggles control the available dropdown definitions. Core stays enabled; selected expansion references determine export dependencies.

See [projectile rules and extraction instructions](docs/projectile-rules-and-expansions.md) for the assembly findings, custom projectile profiles, special-case handling, regeneration command, and limitations. The old LINQPad queries are historical; they are not the active data source.

## Deployment

See [the game data and projectile review](docs/game-data-and-projectile-review.md) for the extraction scripts' current coverage and projectile implementation gaps against RimWorld 1.6.4871.

GitHub Actions builds and publishes `dist` to GitHub Pages on pushes to `main`. Keep Vite's `/rim-maker/` base path and Vue Router's hash history for project-page hosting.
