# White-room range and pawn scale

The Preview tab switches between the raid village and a white-room gun range. The white room accepts one to eight comma-separated integer distances from 1 to 100 tiles. Select a board or use the scene's arrow keys to aim. The firing line stays fixed. Other boards are faded distance guides; native tests place only the selected target, so nearer boards cannot intercept shots intended for a farther test.

The accuracy graph plots chance to hit on Y (0–100%) and range in tiles on X. Its line uses the same verified calculation as the table, sampling the distance curve and including exact interpolation knots and range limits. It updates with Shooting skill, weapon accuracy and verb settings. Configured target distances are selectable circle markers and keyboard-accessible PrimeVue buttons; selecting either also aims the scene. Hatched areas indicate unreachable distances, not zero accuracy. Unsupported special-projectile cases have no fabricated curve. Fresh native target-event/effect-coverage rates appear as separate diamond markers with Wilson 95% intervals and are never joined into an assumed continuous curve. The table remains the numeric alternative.

Invalid distance drafts show an inline error and preserve the last valid targets/graph while disabling native measurement. Valid changes replace the markers. Aiming at another existing marker preserves independent white-room measurements; changing skill, weapon or target-distance configuration makes them stale. The graph adjusts its coordinate width to keep axis labels readable on phones.

## Comparison overlays

Four PrimeVue toggles enable optional dashed comparison curves, with MultiSelect controls for individual cases. All are off initially. Shooting skill offers 0, 5, 10, 15 and 20; weapon quality offers all seven tiers; weather lists the official WeatherDefs for enabled content packs; cover offers sandbags, barricades, granite chunks and a mature oak. Clear overlays hides them in one action without discarding selected comparisons. Colours and dash patterns stay stable as other comparisons are toggled. The legend provides numeric values at the hovered range or selected target, so colour is not the only way to compare results.

Each curve changes **one condition** from the stated baseline. The scene, numeric report, damage/AP values, native trials and their measured diamonds retain their original controlled baseline (selected Shooting skill, Normal quality, Clear, no cover). They are not silently changed by display comparisons. Special classes/scatter/modifiers remain unsupported for ordinary hit percentages across all overlays.

Quality factors are extracted from `AccuracyBase/StatPart_Quality`: 0.8, 0.9, 1, 1.1, 1.2, **1.35**, 1.5. Factors apply to each weapon accuracy stat before its 0.01–1 clamp and range interpolation. High-quality curves may overlap when the stat is capped. Weather uses `WeatherDef.accuracyMultiplier` in fully transitioned weather, with at least one of shooter/target outdoors. The game blends weather during transitions and ignores its penalty if both are roofed; these comparisons hold weather steady and show only its accuracy factor, not prolonged weather damage, blindness or other changes to the standardized pawn.

Cover fixes one cardinally adjacent obstacle between shooter and a standing human-sized target, with no other obstacles. It uses the source definition's `fillPercent` and the reviewed `CoverUtility` distance factors: 0.3333 when the shooter is less than 1.9 tiles from cover, 0.66666 below 2.9, otherwise 1. Cover is omitted if it would occupy the shooter. Pass-cover chance multiplies the aim chance **after** the native 0.0201 aim floor, so final hit probability can be lower than 2.01%. This is not a general visibility or multi-obstacle solution; alternate angles, corner peeking, doors and blocked lines require their own geometry.

`scripts/extract-accuracy-overlays.py` extracts the XML inputs into `accuracyOverlays.json`. `node scripts/capture-accuracy-overlay-reference.mjs` runs an isolated native game with official packs and healthy adult pawns to capture **252 actual ShotReport values**, covering every weather, every quality, skills in steps of five, four cover presets, ranges 1/2/3/4/12/25, and a combined floor/cover case. Results in `public/previews/accuracy-overlay-reference.json` record the assembly hash. Unit checks compare both total hit chance and pass-cover chance to six decimal places. Reference capture does not simulate hundreds of projectile impacts; it directly verifies the analytic hit report used by the graph. Existing native projectile trials remain independent validation of firing outcomes.

The pawn image has a constant world span of `2 / 0.75` tiles. This follows the native `PawnCacheRenderer.RenderPawn` capture camera's `orthographicSize = 1 / cameraZoom` with the original capture zoom of 0.75. The transparent margins are part of that span; the pawn's visible body occupies its normal fraction. Zoom changes its screen pixels, never its world size. An independent invisible pointer target stays usable when zoomed out. Gun and projectile meshes use their `graphicData.drawSize`, or the game's default `(1,1)`.

## Firing without uploads

**Fire weapon** animates the selected projectile in the placement scene. Stock assault-rifle texture, firing/tail/handling clips, and extracted stock projectile textures supply defaults. Uploaded gun textures, projectile textures and sound files override their corresponding media. The resource extractor prepares 26 catalog texture paths; an unavailable browser reference texture falls back to the stock small bullet. Native recordings still resolve the exported paths in the actual game and report missing/invalid resources.

This immediate display is an **open-lane visual preview**, not an impact simulation. It uses the reviewed projectile speed rule (`speed / 100` tiles per game tick), tick-rounded travel, configured warmup/burst spacing, arc height, tint, draw size, and a selectable playback rate. A small dark halo keeps white projectile textures visible on a light floor. It does not roll misses, collide with village buildings, or award hits. Native shooting/measurement remains the source for combat outcomes. Very large visual bursts are capped at 20 shots; large/slow definitions can exceed native recording or benchmark time limits.

Firing, firing-sound audition and handling-sound audition use stable start/stop buttons, including during asynchronous audio preparation. Cancellation prevents pending decoded audio or firing animations from starting later. Auditioning a different sound stops the current firing preview; reset and scenario changes stop it too. Failed audio loads can be retried. Upload inputs allow choosing the same file again after removal; custom projectile textures can be reset to the selected game's texture. Core numeric text fields request the appropriate mobile keyboard, and repeated crafting, skill, stat-offset and melee inputs have distinct accessible labels.

## Calculated hit chance

The ordinary percentage reproduces the installed game's `ShotReport` and `VerbProperties.GetHitChanceFactor` for the stated controlled case: a healthy adult shooter, selected Shooting skill, no traits/apparel/genes affecting accuracy, Normal weapon quality, standing human-sized target, no cover/gas, and clear weather. `scripts/extract-accuracy-rules.py` extracts the XML pawn skill curve, damage defaults, and source/hash provenance. The independent implementation follows the reviewed assembly's interpolation and float rules.

- Weapon accuracy interpolates the close/short/medium/long values at 3, 12, 25, and 40 tiles, clamping to 0.01–1. Missing authored values use the native stat default of 1, not the form's placeholder text.
- A healthy unmodified adult with Shooting 10 has base per-tile accuracy 0.97. The shooter factor raises this to shot distance and applies the native 0.0201 floor. The final aim calculation applies its own floor.
- Range and minimum-range restrictions are shown separately. Fresh native results take precedence over the browser calculation, including special effective-range rules.
- Additional equipped offsets/modifiers, special verbs/classes, overhead projectiles and forced scatter are not given an ordinary browser hit percentage. Their native outcomes are measured instead.

These conditions are deliberately narrower than all possible colonies. Injuries, posture, cover, weather, smoke, xenotypes, quality, external patches and custom mod code can change a real fight. The companion loads Core and needed installed expansions plus the test export, not the user's unrelated active mods.

## Native measurements

Connect `npm run preview:engine`, then choose **Measure accuracy in RimWorld**. The current weapon export, ranges, skill and sample size are sent to the local companion. Samples may be 100, 200, 500 or 1000 independent projectiles per reachable range. The bench uses a stationary target with native size factor 1 and no armour. Its high durability prevents changing target geometry during repeated trials. Each trial resets the shooter's position, health/needs/draft state and removes prior projectiles, explosions, fires, filth and gas. A shooter killed by a danger-close blast is replaced with another standardized shooter for the next independent trial; destroyed test equipment/targets are also replaced. Weather remains clear.

The actual `Verb_LaunchProjectile` implementation launches each independent projectile, and actual `TickManager.DoSingleTick` calls run travel, interception, damage workers, explosions and effects. Independent trials intentionally bypass warmup/cooldown: this measures per-projectile accuracy, not fire rate or burst-group correlations. Even-dispersal bursts and verbs without this launch interface are rejected rather than assigned fabricated results. **Shoot target in RimWorld** separately records a normal native `AttackStatic` job, including warmup, burst and cooldown, with Fire at will disabled.

Ordinary native target events count trials reaching the target's pre-damage/effect handler. This does not guarantee injury or a successful status effect on every type of pawn. Smoke/firefoam-style post-explosion effects use native gas/filth presence on the target tile 30 ticks after impact. Special results also include exact impact-centre counts and blast-footprint overlaps; spatial overlap alone is not an injury probability. Counts are shown with a Wilson 95% binomial interval so a finite sample is not presented as the exact population probability.

The native report reads each projectile's damage and armour penetration at launch and just before impact. The standard projectile properties have no firing-distance input: standard bullets retain their damage and AP over distance. These are primary projectile values, not summed secondary damage or final injury. Armour/body parts and damage workers can change injury, and explosion damage falloff uses distance from the explosion centre. If a specialized projectile changes its reported properties in flight, the UI displays launch → impact values.

## Verification

`public/previews/accuracy-reference.json` contains 900 actual stock assault-rifle trials: 300 at each of 3, 12 and 25 tiles; 40 tiles is recorded as unreachable for its native 30.9 range. Source unit checks compare the independent calculator with native `ShotReport` probabilities to six decimal places and check that damage 11 / AP 0.165 remain unchanged in flight. Further optional browser tests export a new weapon, measure it at four distances through the actual companion, record a white-room shot, and exercise explosive and smoke profiles.

```sh
python scripts/extract-accuracy-rules.py
python scripts/extract-preview-projectiles.py
npm run preview:engine -- --accuracy-example
npm run test:unit -- --run
npm run test:e2e
```

The projectile texture extractor requires the local UnityPy environment; CI does not run asset extraction. Set `RIMMAKER_NATIVE_KEY` to a locally started companion's key to enable the optional actual-game browser checks. Native outputs and screenshots remain under ignored `game-test-results/`.
