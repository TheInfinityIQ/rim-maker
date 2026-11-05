import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = path.resolve(process.env.RIMWORLD_DIR || path.join(repo, '..'));
const data = JSON.parse(fs.readFileSync(path.join(repo, 'src/utility/data/accuracyOverlays.json'), 'utf8'));
const runId = Date.now().toString(), packageId = 'rimmaker.overlay.reference.' + runId;
const mod = path.join(game, 'Mods', 'RimMakerOverlayReference_' + runId);
const output = path.join(repo, 'game-test-results', 'overlay-reference-' + runId);
const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); };
const baseline = { skill: 10, quality: 'Normal', weather: 'Clear', cover: '' };
const cases = [baseline, ...data.qualities.map(row => ({ ...baseline, quality: row.id })), ...[0, 5, 10, 15, 20].map(skill => ({ ...baseline, skill })), ...data.weather.map(row => ({ ...baseline, weather: row.id })), ...data.cover.map(row => ({ ...baseline, cover: row.id })), { skill: 0, quality: 'Awful', weather: 'Fog', cover: 'Sandbags' }];
try {
  write(path.join(mod, 'About/About.xml'), `<ModMetaData><name>RimMaker accuracy overlay reference</name><author>RimMaker</author><packageId>${packageId}</packageId><supportedVersions><li>1.6</li></supportedVersions></ModMetaData>`);
  fs.mkdirSync(path.join(mod, 'Assemblies'), { recursive: true });
  const managed = path.join(game, 'RimWorldWin64_Data/Managed');
  const refs = ['mscorlib', 'System', 'System.Core', 'System.Xml', 'System.Xml.Linq', 'Assembly-CSharp', 'Unity.Mathematics', 'UnityEngine.CoreModule', 'UnityEngine.ImageConversionModule', 'UnityEngine.AudioModule', 'netstandard'];
  const compiled = spawnSync(process.env.CSC_EXE || 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe', ['/nologo', '/noconfig', '/nostdlib+', '/target:library', '/out:' + path.join(mod, 'Assemblies/Reference.dll'), ...refs.map(name => '/r:' + path.join(managed, name + '.dll')), ...['ShootingPreview.cs', 'AccuracyRange.cs', 'AccuracyOverlayReference.cs'].map(file => path.join(repo, 'tools/rimworld', file))], { encoding: 'utf8', windowsHide: true });
  if (compiled.status !== 0) throw new Error(compiled.stdout + compiled.stderr);
  const packs = ['ludeon.rimworld', ...['royalty', 'ideology', 'biotech', 'anomaly', 'odyssey'].map(id => 'ludeon.rimworld.' + id)];
  write(path.join(output, 'Config/ModsConfig.xml'), `<ModsConfigData><version>${data.gameVersion}</version><activeMods>${[...packs, packageId].map(id => `<li>${id}</li>`).join('')}</activeMods><knownExpansions>${packs.slice(1).map(id => `<li>${id}</li>`).join('')}</knownExpansions></ModsConfigData>`);
  write(path.join(output, 'Config/Prefs.xml'), '<Prefs><runInBackground>True</runInBackground></Prefs>');
  write(path.join(output, 'cases.xml'), `<cases>${cases.map(row => `<case ${Object.entries(row).map(([key, value]) => `${key}="${value}"`).join(' ')}/>`).join('')}</cases>`);
  const code = await new Promise((resolve, reject) => {
    const child = spawn(path.join(game, 'RimWorldWin64.exe'), ['-quicktest', '-screen-fullscreen', '0', '-screen-width', '800', '-screen-height', '800', '-savedatafolder=' + output, '-rimmaker-overlay-reference=' + output, '-logFile', path.join(output, 'Player.log')], { cwd: game, windowsHide: true, stdio: 'ignore' });
    const timer = setTimeout(() => child.kill(), 240000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', status => { clearTimeout(timer); resolve(status); });
  });
  if (fs.existsSync(path.join(output, 'capture-error.txt'))) throw new Error(fs.readFileSync(path.join(output, 'capture-error.txt'), 'utf8'));
  if (code !== 0) throw new Error('Native comparison capture failed: ' + output);
  const result = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' }).parse(fs.readFileSync(path.join(output, 'reference.xml'), 'utf8')).reference;
  const reference = { engine: 'RimWorld', gameVersion: result.gameVersion, assemblySha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(managed, 'Assembly-CSharp.dll'))).digest('hex'), weapon: 'Gun_AssaultRifle', accuracy: [.6, .7, .65, .55], rows: result.row };
  write(path.join(repo, 'public/previews/accuracy-overlay-reference.json'), JSON.stringify(reference, null, 2) + '\n');
  console.log(`Captured ${reference.rows.length} native ShotReport comparisons. ${output}`);
} finally {
  const resolved = path.resolve(mod);
  if (!resolved.startsWith(path.resolve(game, 'Mods') + path.sep) || path.basename(resolved) !== 'RimMakerOverlayReference_' + runId) throw new Error('Unsafe reference cleanup path.');
  fs.rmSync(resolved, { recursive: true, force: true });
}
