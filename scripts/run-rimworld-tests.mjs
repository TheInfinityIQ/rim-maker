import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(repo);
const game = path.resolve(process.env.RIMWORLD_DIR || path.join(repo, '..'));
const exe = path.join(game, 'RimWorldWin64.exe');
const managed = path.join(game, 'RimWorldWin64_Data', 'Managed');
const parser = new XMLParser({ ignoreAttributes: false });
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const xml = value => String(value).replace(/[<>&"']/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[ch]));
const runId = new Date().toISOString().replace(/[-:.TZ]/g, '') + crypto.randomBytes(3).toString('hex');
const output = path.join(repo, 'game-test-results', runId);
const testFolder = path.join(game, 'Mods', 'RimMakerRuntimeTest_' + runId);
const exportFolder = path.join(game, 'Mods', 'RimMakerRuntimeExports_' + runId);
const testPackage = 'rimmaker.runtime.tests.' + runId;
const exportPackage = 'rimmaker.runtime.exports.' + runId;
const originalFolders = [];
const selected = process.argv.find(arg => arg.startsWith('--only='))?.slice(7);
if (selected && !['originals', 'exports'].includes(selected)) throw new Error('Use --only=originals or --only=exports.');
if (!fs.existsSync(exe)) throw new Error('RimWorld installation not found. Set RIMWORLD_DIR to the installed game directory.');
const runningGame = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-Process -Name RimWorldWin64 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id'], { encoding: 'utf8', windowsHide: true });
if (runningGame.error || runningGame.signal) throw new Error('Could not check whether RimWorld is already running.');
if (/\d/.test(runningGame.stdout || '')) throw new Error('Close the running RimWorld instance before starting the isolated tests.');
fs.mkdirSync(output, { recursive: true });

function write(file, text) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }
function metadata(name, id) { return `<ModMetaData><name>${name}</name><author>RimMaker tests</author><packageId>${id}</packageId><supportedVersions><li>1.6</li></supportedVersions><description>Locally generated runtime test fixture.</description></ModMetaData>`; }
function prepare() {
  const result = spawnSync(process.execPath, ['scripts/prepare-halo-tests.mjs'], { stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) throw new Error('Preparing Halo source cases failed.');
  return JSON.parse(fs.readFileSync('e2e/.local/halo-cases.json', 'utf8'));
}
function compileHarness() {
  write(path.join(testFolder, 'About/About.xml'), metadata('RimMaker isolated runtime tests', testPackage));
  write(path.join(testFolder, 'Defs/RuntimeTarget.xml'), fs.readFileSync('tests/rimworld/Target.xml'));
  const assembly = path.join(testFolder, 'Assemblies/RimMaker.RuntimeTests.dll');
  fs.mkdirSync(path.dirname(assembly), { recursive: true });
  // Framework's compiler needs no NuGet packages or copies of the proprietary assemblies.
  const compiler = process.env.CSC_EXE || path.join(process.env.WINDIR || 'C:/Windows', 'Microsoft.NET/Framework64/v4.0.30319/csc.exe');
  const references = ['mscorlib.dll', 'System.dll', 'System.Core.dll', 'System.Xml.dll', 'System.Xml.Linq.dll', 'Assembly-CSharp.dll', 'UnityEngine.CoreModule.dll', 'UnityEngine.AudioModule.dll', 'netstandard.dll'];
  const args = ['/nologo', '/noconfig', '/nostdlib+', '/target:library', '/optimize+', '/out:' + assembly,
    ...references.map(name => '/r:' + path.join(managed, name)), path.join(repo, 'tests/rimworld/RuntimeTests.cs')];
  const result = spawnSync(compiler, args, { encoding: 'utf8', windowsHide: true });
  write(path.join(output, 'compile.log'), (result.stdout || '') + (result.stderr || '') + (result.error || ''));
  if (result.status !== 0) throw new Error('Runtime harness compilation failed:\n' + fs.readFileSync(path.join(output, 'compile.log'), 'utf8'));
}
function zipFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory()
    ? zipFiles(path.join(dir, item.name)) : item.name === 'recreated-mod.zip' ? [path.join(dir, item.name)] : []);
}
async function prepareExports(sources) {
  const zips = zipFiles(path.join(repo, 'test-results'));
  if (!zips.length) throw new Error('No browser exports found. Run npm run test:e2e:halo first.');
  const plans = [];
  const hashes = new Map();
  for (const file of zips) {
    const archive = await JSZip.loadAsync(fs.readFileSync(file));
    const gunEntry = archive.file('HaloTest/Defs/ThingDefs/HaloTestWeapons_Ranged.xml');
    if (!gunEntry) throw new Error('Unexpected browser export layout: ' + file);
    const defs = array(parser.parse(await gunEntry.async('string')).Defs.ThingDef);
    const gun = defs.find(def => def['@_ParentName'] === 'BaseHumanMakeableGun');
    const source = sources.find(source => source.gun.label === gun?.label);
    if (!source || plans.some(plan => plan.label === gun.label)) throw new Error('Missing, duplicate or stale browser weapon export: ' + file);
    const coverageFile = path.join(path.dirname(file), 'coverage.json');
    const coverage = fs.existsSync(coverageFile) ? JSON.parse(fs.readFileSync(coverageFile, 'utf8')) : null;
    if (coverage?.sourceSha256 !== source.sourceSha256) throw new Error('Export provenance is missing or stale; rerun the Halo browser suite: ' + file);
    plans.push({ source, label: gun.label, defName: gun.defName });
    for (const entry of Object.values(archive.files)) {
      if (entry.dir) continue;
      const relative = entry.name.replace(/^HaloTest\//, '');
      if (!entry.name.startsWith('HaloTest/') || relative.split('/').includes('..') || path.isAbsolute(relative)) throw new Error('Unsafe export path.');
      // Each case is a separate export with identical metadata and XML filenames.
      if (relative.startsWith('About/')) continue;
      const target = relative.startsWith('Defs/') ? relative.replace(/\.xml$/, '_' + plans.length + '.xml') : relative;
      const bytes = Buffer.from(await entry.async('uint8array'));
      const hash = crypto.createHash('sha256').update(bytes).digest('hex');
      if (hashes.has(target) && hashes.get(target) !== hash) throw new Error('Conflicting exported asset: ' + target);
      hashes.set(target, hash);
      const destination = path.resolve(exportFolder, target);
      if (!destination.startsWith(path.resolve(exportFolder) + path.sep)) throw new Error('Export path escapes its test fixture.');
      write(destination, bytes);
    }
  }
  if (plans.length !== sources.length) throw new Error(`Expected ${sources.length} exports; found ${plans.length}. Rerun the Halo browser suite.`);
  write(path.join(exportFolder, 'About/About.xml'), metadata('RimMaker exported Halo test weapons', exportPackage));
  return plans;
}
function createProfile(directory, packages) {
  const known = ['royalty', 'ideology', 'biotech', 'anomaly', 'odyssey'].map(pack => `<li>ludeon.rimworld.${pack}</li>`).join('');
  write(path.join(directory, 'Config/ModsConfig.xml'), `<ModsConfigData><version>${xml(fs.readFileSync(path.join(game, 'Version.txt'), 'utf8').trim())}</version><activeMods>${packages.map(id => `<li>${xml(id.toLowerCase())}</li>`).join('')}</activeMods><knownExpansions>${known}</knownExpansions></ModsConfigData>`);
  write(path.join(directory, 'Config/Prefs.xml'), '<Prefs><devMode>True</devMode><runInBackground>True</runInBackground></Prefs>');
}
function launch(directory, plan) {
  const planFile = path.join(directory, 'plan.xml');
  write(planFile, `<weapons>${plan.map(({ source, defName, label }) => {
    const verb = array(source.gun.verbs.li)[0];
    const catalog = JSON.parse(fs.readFileSync('src/utility/data/gameDefinitions.json', 'utf8'));
    const stock = Object.values(catalog.packs).flatMap(pack => pack.bullets).find(bullet => bullet.defName === verb.defaultProjectile);
    const type = source.bullet?.thingClass || (source.bullet ? 'Bullet' : stock?.thingClass);
    if (!type) throw new Error('Unrecognized projectile in source: ' + label);
    const properties = Object.entries(source.bullet?.projectile || {}).map(([name, value]) => {
      if (value && typeof value === 'object') throw new Error('Unsupported structured projectile assertion: ' + name);
      return `<projectileProperty name="${xml(name)}" value="${xml(value)}" />`;
    }).join('');
    return `<weapon label="${xml(label)}" defName="${xml(defName)}" projectileClass="${xml(type)}" burst="${verb.burstShotCount || 1}">${properties}</weapon>`;
  }).join('')}</weapons>`);
  const log = path.join(directory, 'Player.log');
  console.log('Launching isolated RimWorld run: ' + path.basename(directory));
  return new Promise(resolve => {
    const child = spawn(exe, ['-batchmode', '-quicktest', '-rimmaker-runtime-test', '-savedatafolder=' + directory,
      '-rimmaker-test-plan=' + planFile, '-logFile', log], { cwd: game, windowsHide: true, stdio: 'ignore' });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, Number(process.env.RIMWORLD_TEST_TIMEOUT_MS || 300000));
    child.once('error', error => { clearTimeout(timer); resolve({ exitCode: null, error: error.message, timedOut: false }); });
    child.once('exit', code => { clearTimeout(timer); resolve({ exitCode: code, timedOut }); });
  });
}
function summarizeRun(directory, processResult, expected) {
  const file = path.join(directory, 'runtime-results.xml');
  const report = fs.existsSync(file) ? parser.parse(fs.readFileSync(file, 'utf8')).runtimeTests : null;
  const cases = array(report?.case);
  const errors = array(report?.errors?.error);
  const log = fs.existsSync(path.join(directory, 'Player.log')) ? fs.readFileSync(path.join(directory, 'Player.log'), 'utf8') : '';
  // Include startup failures that may precede construction of the test mod.
  const startupErrors = log.split(/\r?\n/).filter(line => /Exception:|XML error:|Could not resolve cross-reference|Config error in|Could not load (?:UnityEngine\.)?Texture2D|Failed to find/.test(line));
  const passed = cases.filter(row => row['@_status'] === 'passed').length;
  return { run: path.basename(directory), expected, completed: cases.length, passed, failed: cases.length - passed,
    status: processResult.exitCode === 0 && !processResult.timedOut && passed === expected && errors.length === 0 && startupErrors.length === 0 ? 'passed' : 'failed',
    ...processResult, errors, startupErrors, warnings: array(report?.warnings?.warning), activeMods: array(report?.activeMods?.package), cases };
}
function removeOwnedFixture(directory) {
  // Only these exact fresh, uniquely named directories under this game's Mods folder are removed.
  const mods = path.resolve(game, 'Mods') + path.sep;
  const resolved = path.resolve(directory);
  if (!resolved.startsWith(mods) || !path.basename(resolved).endsWith(runId)) throw new Error('Refusing unsafe fixture cleanup.');
  fs.rmSync(resolved, { recursive: true, force: true });
}

const runs = [];
try {
  const sources = prepare();
  compileHarness();
  const exports = selected === 'originals' ? null : await prepareExports(sources);
  if (!selected || selected === 'originals') {
    const directory = path.join(output, 'originals');
    const originalPackages = [];
    const workshop = process.env.HALO_MODS_DIR || path.resolve(game, '..', '..', 'workshop/content/294100');
    for (const [id, name] of [['1542254108', 'unsc'], ['2198416243', 'forerunner']]) {
      const folder = path.join(game, 'Mods', 'RimMakerRuntimeOriginals_' + name + '_' + runId);
      const packageId = 'rimmaker.runtime.originals.' + name + '.' + runId;
      originalFolders.push(folder);
      fs.cpSync(path.join(workshop, id), folder, { recursive: true, errorOnExist: true, force: false });
      const about = path.join(folder, 'About/About.xml');
      write(about, fs.readFileSync(about, 'utf8').replace(/<packageId>[^<]+<\/packageId>/, `<packageId>${packageId}</packageId>`));
      originalPackages.push(packageId);
    }
    createProfile(directory, ['ludeon.rimworld', ...originalPackages, testPackage]);
    const result = await launch(directory, sources.map(source => ({ source, label: source.gun.label, defName: source.gun.defName })));
    runs.push(summarizeRun(directory, result, sources.length));
    console.log(`Original Halo packs: ${runs.at(-1).passed}/${sources.length} weapon checks passed; run ${runs.at(-1).status}.`);
  }
  if (exports) {
    const directory = path.join(output, 'exports');
    createProfile(directory, ['ludeon.rimworld', exportPackage, testPackage]);
    const result = await launch(directory, exports);
    runs.push(summarizeRun(directory, result, sources.length));
    console.log(`RimMaker exports: ${runs.at(-1).passed}/${sources.length} weapon checks passed; run ${runs.at(-1).status}.`);
  }
  const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  write(path.join(output, 'summary.json'), JSON.stringify({ runId, game, gameAssemblySha256: sha256(path.join(managed, 'Assembly-CSharp.dll')), harnessSourceSha256: sha256('tests/rimworld/RuntimeTests.cs'), sourceHashes: sources.map(source => ({ weapon: source.gun.label, hash: source.sourceSha256 })), runs }, null, 2));
  write(path.join(output, 'summary.md'), ['# RimWorld weapon runtime tests', '',
    'These tests run the actual installed game using an isolated profile and temporary test mods.', '',
    ...runs.map(run => `- **${run.run}: ${run.status}** — ${run.passed}/${run.expected} weapons passed; ${run.errors.length} captured game errors; ${run.startupErrors.length} startup error lines.`), '',
    ...runs.flatMap(run => run.cases.filter(row => row['@_status'] !== 'passed').map(row => `- ${run.run} / ${row['@_weapon']}: ${JSON.stringify(row.failure)}`)), '',
    'See summary.json and each run’s runtime-results.xml and Player.log for detailed checks, failures, warnings, burst counts, damage and observed effects.', '',
    'Scope: definition/reference loading, crafting product generation, equipping/dropping, texture resolution and sound playback requests, ranged warmup/burst timing, cooldown/refire and projectile lifecycles, controlled impact/area damage, incendiary fire creation, and all resolved weapon melee verbs. This does not certify balance, multiplayer, other mod combinations, a full crafting bill/job, perceptual audio/visual appearance, or every random effect or combat situation.', '',
  ].join('\n'));
  write(path.join(repo, 'game-test-results/latest.json'), JSON.stringify({ directory: output, runs: runs.map(({ run, status, passed, expected }) => ({ run, status, passed, expected })) }, null, 2));
  console.log('Runtime report: ' + path.join(output, 'summary.md'));
  process.exitCode = runs.length > 0 && runs.every(run => run.status === 'passed') ? 0 : 1;
} catch (error) {
  write(path.join(output, 'runner-error.txt'), error.stack || String(error));
  console.error(error.stack || error);
  process.exitCode = 1;
} finally {
  if (!process.env.RIMWORLD_KEEP_TEST_MODS) {
    removeOwnedFixture(testFolder);
    removeOwnedFixture(exportFolder);
    for (const folder of originalFolders) removeOwnedFixture(folder);
  }
}
