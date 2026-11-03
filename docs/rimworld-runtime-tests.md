# RimWorld runtime weapon tests

This suite launches the real installed RimWorld executable and a locally compiled C# test mod. It tests the original Halo UNSC/Forerunner packs and the ZIPs produced by the browser reconstruction suite in separate game sessions. It targets the installed RimWorld 1.6 assemblies, not a simulated engine.

## Run on Windows

Close other RimWorld instances, then run from the repository:

```sh
npm run test:e2e:halo
npm run test:ingame:halo
```

The first command must finish successfully and leave all 19 exported ZIPs and coverage reports in `test-results`. The runtime runner rejects missing/duplicate cases, changed source XML, conflicting media, timeouts, missing result files, failed assertions, and captured game errors. A nonzero exit code means the run did not pass.

For a focused investigation:

```sh
npm run test:ingame:halo -- --only=originals
npm run test:ingame:halo -- --only=exports
```

`RIMWORLD_DIR` can point to another installation; `HALO_MODS_DIR` can point to another Workshop `294100` directory. `CSC_EXE` can override the .NET Framework compiler path. `RIMWORLD_TEST_TIMEOUT_MS` controls the timeout per game launch (default five minutes). The game and its assemblies are local prerequisites and are never downloaded or committed by the suite.

## Isolation and fixtures

Each run creates its own save-data directory under ignored `game-test-results/<run-id>/`. Its `ModsConfig.xml` enables Core, the selected test content, and the harness. Installed expansions are marked known so the game does not automatically enable them in a fresh profile. The user's normal preferences, active mods, and saved colonies are not edited.

The runner temporarily copies the original packs into uniquely named local test-mod directories, changing only their temporary package identifiers. This makes Workshop content available even when Steam is unavailable to an automated game process. Their gameplay XML and media remain unchanged.

Browser exports are combined in a separate temporary fixture. Their gameplay XML and media are preserved; definition XML filenames and package metadata are adjusted only to place the separate ZIPs in one test package. Different bytes at the same media path fail preparation. All fixture directories live under the installed game's `Mods` directory and are removed after the run. Set `RIMWORLD_KEEP_TEST_MODS=1` only when inspecting a failure; the unique fixture names are then retained.

The launcher requests batch mode with graphics enabled, so texture/material loading is exercised. It requests a hidden window. Unity can still display its startup window on some systems.

## Checks per weapon

- Resolve the weapon and projectile definitions, projectile class, explicit source projectile properties, and burst size in the actual game's definition database.
- Find its generated crafting recipe and workbench and invoke the game's recipe-product generation, including quality creation.
- Equip a fresh, combat-capable pawn; resolve weapon/projectile textures and materials and request interaction, shot, and tail sound playback.
- Use the weapon's actual firing verb, pawn ticks, and projectile ticks. Check adjusted warmup and burst spacing, count launched projectiles, require the burst/projectile lifecycle to finish, and fire a second complete burst after cooldown.
- Launch an additional controlled projectile to avoid random aiming misses hiding impact failures. Require target damage, adjacent damage for a sufficiently large explosion, and no adjacent damage for direct impacts.
- For flame ammunition, require actual fire creation on flammable targets, allowing up to 16 impacts for chance-based effects. Record observed fires and the resolved pre-explosion spawn definition.
- Exercise every melee verb resolved from the equipped weapon, require damage, then drop the weapon and verify ownership/spawn state.

Each case uses a fresh pawn, full food/rest, a fixed random seed, a clear roofless firing lane, and disposable high-hit-point targets. The harness advances actual game ticks; it does not replace projectile impact methods or disable error logging.

## Reports and limits

`game-test-results/latest.json` identifies the latest finished run. Its directory contains `summary.md`, `summary.json`, compiler output, separate `originals`/`exports` game logs, plans, and `runtime-results.xml` files. Detailed results include passed checks, exceptions, burst counts/ticks, direct/adjacent damage, fire observations, loaded packages, warnings, and game/source hashes.

A passing run means these scenarios completed without detected game errors. It does not certify every combat situation, balance, other mod combinations, multiplayer, expansion combinations, save/reload, the entire crafting bill/reservation/job workflow, or the perceived appearance/sound of effects. Random fuel-spawn distributions are not statistically certified. XML parity differences from the browser report remain relevant even when the runtime checks pass.

These tests are local. GitHub's hosted checks run unit tests and browser smoke tests; they do not have the user's licensed RimWorld installation or Halo media.

## Export problems exposed by the first runtime pass

The engine found issues that XML well-formedness checks could not detect: custom projectile IDs ended in digits, punctuation in weapon labels leaked into definition IDs, and explosive ammunition lacked its required positive `forcedMissRadius`. RimMaker now generates legal IDs tied to each weapon, detects name collisions, and provides the explosive aiming control through PrimeVue. Export also validates that setting when building the archive. These fixes are covered by unit, browser, and runtime checks.
