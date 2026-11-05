# Native shooting examples and custom weapon recordings

Combat → Verbs → Shooting example contains three recordings made by the installed RimWorld engine: assault rifle, triple rocket launcher, and inferno cannon. Playback defaults to quarter speed and includes pause, restart, a jump to the first shot, single-frame stepping, and a timeline. These stock recordings do **not** change when weapon fields change.

To record the current edited weapon, expand **Shoot your weapon in RimWorld** and connect the local companion:

```sh
npm ci
npm run preview:engine
```

Run these commands from a local checkout of RimMaker, with Node.js and RimWorld 1.6 installed. On Windows the game is located in the parent folder by default; set `RIMWORLD_DIR` when the checkout is elsewhere. The helper compiles its own source against the locally installed game assemblies with the Windows .NET Framework compiler. No game assemblies or decompiled implementations are included in this repository.

Copy the connection key printed in the terminal into the website, click **Connect companion**, position the colonist and aim marker, and click **Shoot target in RimWorld**. Set **Weapon Mass** in **Combat → Stat Bases** first: RimWorld requires an authored mass on a weapon, and the preview explains missing values before launching. At the initial 100-tile position, most weapons cannot reach the sandbags: move the colonist closer first. The browser may ask for permission to access the local computer. Keep the companion terminal open. Recording can take a few minutes and a temporary game window can appear. The companion listens only on `127.0.0.1:47328`, accepts the RimMaker Pages origin and local development origins, and requires its per-session connection key. The key stays in component memory and is not sent to GitHub or stored in browser storage.

Each shot uses a newly generated, isolated game profile and a uniquely named temporary mod. It leaves the user's normal saves, mod selection, and running game process alone. Only the process started for that recording can be terminated by its five-minute timeout. Owned temporary mods are removed afterward; the generated scene, frames, XML, error output, and logs remain under ignored `game-test-results/shooting-*`.

## What the game computes

The browser uses the same XML/asset exporter as downloaded mods, operating on a clone. Blank weapon names and descriptions receive temporary preview text so unfinished descriptive fields do not cause native definition errors; editable data and combat properties remain unchanged. Custom gun and projectile textures and sounds are included, and required installed expansions are loaded. Other installed mods and their assemblies are not loaded. Missing expansion content, unresolved definitions, invalid targets, or native errors are reported rather than silently replacing mechanics with an animation.

The recorder creates a native BaseGen settlement or controlled white-room range, positions a combat-capable colonist with the selected Shooting skill (default 10) and a Normal-quality weapon, turns off Fire at will, and issues RimWorld's `AttackStatic` job for one attack. Native jobs, stances, verbs, projectile classes, collisions, hit/miss rolls, cover, damage workers, explosions, fire, smoke, and other effects execute inside the game. The browser's separate immediate flight preview and controlled accuracy calculator do not replace these native outcomes. The engine also decides whether the selected target is shootable. In the village, buildings at the aim tile are targeted as things; empty tiles are targeted as ground. In the white room it shoots the selected human-sized range board.

The village is generated afresh; its layout can differ from the static placement reference. A cloth sandbag line is placed at the reference coordinates. The result is one real native outcome for the recorded pawn, map, loaded definitions, and random state. It is not a guarantee of the same outcome for another colonist, seed, environment, game version, or mod list. Pawn age, traits, and the native aiming-delay factor can affect timing even at the same Shooting skill.

The game is paused between manually advanced ticks. Frame timestamps and projectile samples use the actual `TickManager.TicksGame` difference, not wall-clock animation time. The camera uses native map, dynamic-thing, and fleck rendering; the recording samples every two game ticks. Short effects between samples might not appear in a frame. Replay speed changes playback only. Combat simulation speed, projectile speed, damage, and timing remain the native values. Recording ends three game seconds after burst, stance cooldown, and active projectiles finish, or at thirty game seconds. Long-lived fire and other ongoing effects can continue beyond the clip; incomplete clips are marked.

Recordings are silent. The separate **Test fire** sound audition uses preview samples and does not reproduce the game's complete mixer, pitch variation, or environmental reverb.

## Regenerate and verify

```sh
npm run preview:engine -- --compile-only
npm run preview:engine -- --example=rifle
npm run preview:engine -- --example=rocket
npm run preview:engine -- --example=inferno
node --test scripts/test-native-shooting.mjs
npm run test:unit -- --run
npm run test:e2e
```

Example commands write public replay assets. Set `FFMPEG_EXE` to a local FFmpeg executable to encode the small WebM videos (the local `imageio-ffmpeg` installation is also discovered). The companion itself does not require FFmpeg: custom recordings return the captured image frames directly. To encode an existing native recording without launching the game again, use `node scripts/preview-engine.mjs --pack=rifle --input=game-test-results/shooting-...`.

Inspect the images and `replay.xml` before publishing. Metadata records the game version and assembly SHA-256, weapon and projectile definitions/classes, native adjusted warmup/cooldown, observed projectile ticks/positions, fire count, and completion status. Game errors cause the request to fail.

An optional real-engine browser test runs against a locally started companion:

```powershell
$env:RIMMAKER_NATIVE_KEY = 'key printed by the companion'
npx playwright test shooting-preview.spec.js --grep 'real companion'
```

The regular browser suite needs no game installation. It verifies the shipped recordings contain visible terrain, replay controls, connection/authentication flow, exported request contents, and stale-recording notices; its companion response is mocked. The optional check launches the actual game through the actual website request path.
