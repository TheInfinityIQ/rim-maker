import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const game = path.resolve(process.env.RIMWORLD_DIR || '..');
if (!fs.existsSync(path.join(game, 'RimWorldWin64.exe'))) throw new Error('Set RIMWORLD_DIR to the installed RimWorld directory.');
const existing = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Get-Process -Name RimWorldWin64 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id'], { encoding: 'utf8', windowsHide: true });
if (/\d/.test(existing.stdout || '')) throw new Error('Close RimWorld before capturing an isolated preview scene.');
const runId = Date.now().toString();
const mod = path.join(game, 'Mods', 'RimMakerRangeCapture_' + runId);
const output = path.resolve('game-test-results', 'range-capture-' + runId);
const packageId = 'rimmaker.range.capture.' + runId;
const write = (file, content) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };
write(path.join(mod, 'About/About.xml'), `<ModMetaData><name>RimMaker range capture</name><author>RimMaker</author><packageId>${packageId}</packageId><supportedVersions><li>1.6</li></supportedVersions><description>Temporary gameplay scene capture.</description></ModMetaData>`);
try {
  const managed = path.join(game, 'RimWorldWin64_Data/Managed');
  fs.mkdirSync(path.join(mod, 'Assemblies'), { recursive: true });
  const refs = ['mscorlib', 'System', 'System.Core', 'Assembly-CSharp', 'UnityEngine.CoreModule', 'UnityEngine.ImageConversionModule', 'netstandard'];
  const compiled = spawnSync('C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe', ['/nologo', '/noconfig', '/nostdlib+', '/target:library', '/out:' + path.join(mod, 'Assemblies/Capture.dll'), ...refs.map(name => '/r:' + path.join(managed, name + '.dll')), path.resolve('tools/rimworld/RangePreviewCapture.cs')], { encoding: 'utf8', windowsHide: true });
  if (compiled.status !== 0) throw new Error(compiled.stdout + compiled.stderr);
  const known = ['royalty', 'ideology', 'biotech', 'anomaly', 'odyssey'].map(name => `<li>ludeon.rimworld.${name}</li>`).join('');
  write(path.join(output, 'Config/ModsConfig.xml'), `<ModsConfigData><version>1.6.4871</version><activeMods><li>ludeon.rimworld</li><li>${packageId}</li></activeMods><knownExpansions>${known}</knownExpansions></ModsConfigData>`);
  write(path.join(output, 'Config/Prefs.xml'), '<Prefs><devMode>True</devMode><runInBackground>True</runInBackground></Prefs>');
  const status = await new Promise((resolve, reject) => {
    const child = spawn(path.join(game, 'RimWorldWin64.exe'), ['-quicktest', '-screen-fullscreen', '0', '-screen-width', '1024', '-screen-height', '768', '-savedatafolder=' + output, '-rimmaker-capture=' + output, '-logFile', path.join(output, 'Player.log')], { cwd: game, windowsHide: true, stdio: 'ignore' });
    const timer = setTimeout(() => { child.kill(); reject(new Error('Capture timed out.')); }, 240000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); resolve(code); });
  });
  if (status !== 0) throw new Error('Game capture failed. See ' + output);
  console.log(output);
} finally {
  const resolved = path.resolve(mod);
  if (!resolved.startsWith(path.resolve(game, 'Mods') + path.sep) || !path.basename(resolved).endsWith(runId)) throw new Error('Unsafe capture fixture cleanup.');
  fs.rmSync(resolved, { recursive: true, force: true });
}
