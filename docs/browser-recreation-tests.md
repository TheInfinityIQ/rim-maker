# Browser recreation tests

The Playwright suite uses a real Chromium browser against a local production build. It clicks controls, fills fields, uses PrimeVue dropdowns, uploads local mod files, clicks Export, and opens the downloaded ZIP. It does not inject Vue state or call the export function to bypass the interface.

## Run

```sh
npm ci
npx playwright install chromium
npm run test:e2e
npm run test:e2e:halo
npm run test:e2e:report
```

`test:e2e` is the standalone smoke test. `test:e2e:halo` prepares 19 cases from the locally installed Halo UNSC Weapon Pack (1542254108) and Halo Forerunner Weapons Mod (2198416243), then runs their reconstruction attempts. Set `HALO_MODS_DIR` to the directory containing those Workshop IDs if your installation is elsewhere. Missing mods or an empty case list fail preparation; no cases are silently skipped.

The fixtures are derived from the original XML, with a source SHA-256 recorded. They are not created by RimMaker's serializer. Local fixture manifests, Halo media, ZIPs, traces, and reports are excluded from Git.

## What a passing recreation test means

Each test compares entered name, description, available accuracy/work/mass/cooldown stats, aiming/range/burst settings, resource costs, crafting skill requirements, and projectile properties with the source mod. Uploaded texture and sound bytes must survive the download unchanged, weapon/projectile references must connect, and generated sound definitions must point at the uploaded clips. Browser exceptions fail the test.

Source IDs and uploaded asset paths are expected to change. Those are normalized only where their target references or asset bytes are checked.

The difference list compares explicit XML fields, including list order. A reported difference is a review item; it does not necessarily change gameplay. Melee tool controls are not exercised yet, so their source differences are coverage gaps rather than proven missing editor features.

**This does not certify a complete weapon recreation.** The report separately records original explicit fields that differ or were not covered, such as research prerequisites, market values, weapon tags, tool values, muzzle flash, forced miss radius, targeting settings, and graphics settings. Some have controls that need additional test coverage; others require editor features. Custom sound tuning and inherited/game-default behavior require separate checks. Additional output fields are not currently compared against a fully resolved runtime definition.

Use `npm run test:e2e:halo:strict` to fail any case with original source-field differences. This is the future parity target, not an expected-green baseline while gaps remain.

## Outputs

- `playwright-report/index.html`: interactive run report and failure traces/screenshots.
- `test-results/halo-summary.md`: readable supported-field and source-difference summary.
- `test-results/halo-summary.json`: detailed expected versus exported values.
- Per-case `recreated-mod.zip` and `coverage.json`: inspectable exports and comparison evidence.

The suite does not install the recreated mod into RimWorld or run a combat simulation.

GitHub Actions runs the standalone smoke test on pushes and pull requests. Halo reconstruction tests run locally, where the installed mod files are available.
