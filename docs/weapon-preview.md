# Reusable weapon preview

The Combat → Verbs panel embeds `src/components/weapon-preview/WeaponPreview.vue`. Its required `weapon` prop is the same reactive `WeaponRanged` instance edited by the existing form. Changing Total range updates the preview without a second model. PrimeVue owns the buttons and tags; application CSS owns the layout and scene.

The first version shows open-ground reach: a reference colonist, the white tile-edge range outline, a movable target, distance, and an in/out-of-range result. Arrow keys move one tile, Shift+arrow moves five, and pointer input selects the nearest tile. Zoom and Fit affect the view only. Minimum range is rendered if present in the model.

`target-change` emits target coordinates and reach information. Named `scene-overlay`, `controls`, and `footer` slots receive target/reach state (the overlay also receives the visible extent). Future projectile animations, uploaded weapon textures, and sound controls can share this component. Those media simulations are not part of this first version.

## Scene and game reference

`public/previews/firing-range.jpg` is a composed gameplay scene captured from the installed RimWorld 1.6.4871 engine in a disposable map. It includes terrain, plants, a path, and an equipped reference colonist. It is not a sprite/texture pack. The website's Ludeon attribution applies. Relevant terms: [RimWorld EULA](https://store.steampowered.com/eula/294100_eula_1), particularly gameplay user content and redistribution of extracted resources.

`firing-range.json` records pixel-to-tile calibration and the colonist's position. The overlay uses that calibration when cropping and zooming to keep tiles and colonist aligned.

To regenerate the scene on Windows with the game closed:

```sh
npm run capture:range-preview
```

The local helper compiles `tools/rimworld/RangePreviewCapture.cs` against installed assemblies. It creates an isolated Core-only profile and temporary capture mod, renders with the game's camera, and outputs a JPEG, calibration, game log, and range-reference counts under ignored `game-test-results/range-capture-*`. The temporary mod is removed afterward. A game window may briefly appear while rendering. Inspect the result before copying the JPEG to `public/previews`, calibration to `src/components/weapon-preview`, and reference counts to the unit-test fixture. The public image is not replaced automatically.

## Geometry and limits

The outline uses exposed edges of cells whose centers lie within the configured radius. Float rounding follows the installed game's `GenRadial` calculation. Ten reference radii, including 15.9, 33.5, and 79 tiles, are checked against counts exported from the running game. The game limits its own ring drawing to a precomputed radial pattern; the website extends the geometric rule to 200 tiles. Larger inputs retain distance checks but omit the expensive outline. The captured scene covers approximately 224 tiles; ranges above 105 can extend beyond it.

This is a range illustration. It does not simulate line of sight, cover, pawn stats, hit probability, projectile flight, sound, or the user's weapon appearance. The colonist and weapon in the background are a fixed reference. In-game behavior is covered separately by the runtime tests.

`npm run test:e2e` includes keyboard/pointer interaction, reactive range changes, image delivery, and desktop/mobile preview checks. Halo reconstruction tests verify exported settings independently.
