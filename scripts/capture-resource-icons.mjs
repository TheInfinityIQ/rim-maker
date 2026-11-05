import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = path.resolve(process.env.RIMWORLD_DIR || path.join(repo, '..'));
const runId = Date.now().toString();
const packageId = 'rimmaker.resource.icons.' + runId;
const mod = path.join(game, 'Mods', 'RimMakerResourceIcons_' + runId);
const output = path.join(repo, 'game-test-results', 'resource-icons-' + runId);
const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); };
const catalog = JSON.parse(fs.readFileSync(path.join(repo, 'src/utility/data/gameDefinitions.json'), 'utf8'));
const resources = new Map(Object.values(catalog.packs).flatMap(pack => pack.things.map(row => [row.defName, row])));
const compileOnly = process.argv.includes('--compile-only');
if (!fs.existsSync(path.join(game, 'RimWorldWin64.exe'))) throw new Error('Set RIMWORLD_DIR to your installed RimWorld folder.');
try {
  write(path.join(mod, 'About/About.xml'), `<ModMetaData><name>RimMaker resource icons</name><author>RimMaker</author><packageId>${packageId}</packageId><supportedVersions><li>1.6</li></supportedVersions><description>Temporary local icon capture.</description></ModMetaData>`);
  fs.mkdirSync(path.join(mod, 'Assemblies'), { recursive: true });
  const managed = path.join(game, 'RimWorldWin64_Data/Managed');
  const refs = ['mscorlib', 'System', 'System.Core', 'System.Xml', 'System.Xml.Linq', 'Assembly-CSharp', 'UnityEngine.CoreModule', 'UnityEngine.IMGUIModule', 'UnityEngine.ImageConversionModule', 'netstandard'];
  const compiled = spawnSync(process.env.CSC_EXE || 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe', ['/nologo', '/noconfig', '/nostdlib+', '/target:library', '/out:' + path.join(mod, 'Assemblies/ResourceIcons.dll'), ...refs.map(name => '/r:' + path.join(managed, name + '.dll')), path.join(repo, 'tools/rimworld/ResourceIconCapture.cs')], { encoding: 'utf8', windowsHide: true });
  if (compiled.status !== 0) throw new Error(compiled.stdout + compiled.stderr);
  if (compileOnly) console.log('Resource icon capture compiled against the installed game.');
  else {
    const packs = Object.entries(catalog.packs).map(([, pack]) => pack.packageId);
    write(path.join(output, 'Config/ModsConfig.xml'), `<ModsConfigData><version>${catalog.gameVersion.split(' ')[0]}</version><activeMods>${[...packs, packageId].map(id => `<li>${id}</li>`).join('')}</activeMods><knownExpansions>${packs.slice(1).map(id => `<li>${id}</li>`).join('')}</knownExpansions></ModsConfigData>`);
    write(path.join(output, 'Config/Prefs.xml'), '<Prefs><runInBackground>True</runInBackground><uiScale>1</uiScale></Prefs>');
    write(path.join(output, 'resources.xml'), `<resources>${[...resources.keys()].map(name => {
      if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error('Unsafe resource definition name.');
      return `<resource defName="${name}"/>`;
    }).join('')}</resources>`);
    const code = await new Promise((resolve, reject) => {
      const child = spawn(path.join(game, 'RimWorldWin64.exe'), ['-screen-fullscreen', '0', '-screen-width', '800', '-screen-height', '800', '-savedatafolder=' + output, '-rimmaker-resource-icons=' + output, '-logFile', path.join(output, 'Player.log')], { cwd: game, windowsHide: true, stdio: 'ignore' });
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; child.kill(); }, 240000);
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', status => { clearTimeout(timer); if (timedOut) reject(new Error('Icon capture timed out: ' + output)); else resolve(status); });
    });
    const errorFile = path.join(output, 'capture-error.txt');
    if (fs.existsSync(errorFile)) throw new Error(fs.readFileSync(errorFile, 'utf8'));
    if (code !== 0 || !fs.existsSync(path.join(output, 'icons.xml'))) throw new Error('Icon capture failed: ' + output);
    const report = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' }).parse(fs.readFileSync(path.join(output, 'icons.xml'), 'utf8')).icons;
    const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
    const manifest = { schema: 1, gameVersion: report.gameVersion, assemblySha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(managed, 'Assembly-CSharp.dll'))).digest('hex'), renderer: 'RimWorld Widgets.DefIcon', size: 64, icons: {}, missing: array(report.missing).map(row => row.defName) };
    for (const icon of array(report.icon)) {
      const png = fs.readFileSync(path.join(output, icon.defName + '.png'));
      const hash = crypto.createHash('sha256').update(png).digest('hex');
      const file = hash.slice(0, 16) + '.png';
      write(path.join(repo, 'public/resources', file), png);
      manifest.icons[icon.defName] = { file, sha256: hash, pack: resources.get(icon.defName).pack, source: resources.get(icon.defName).source, texture: icon.texture };
    }
    if (!manifest.icons.Steel || !manifest.icons.ComponentIndustrial) throw new Error('Required default resource icons are missing.');
    write(path.join(repo, 'src/utility/data/resource-icons.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Captured ${Object.keys(manifest.icons).length}/${resources.size} resource icons; ${manifest.missing.length} unavailable. Output: ${output}`);
  }
} finally {
  const resolved = path.resolve(mod);
  if (!resolved.startsWith(path.resolve(game, 'Mods') + path.sep) || path.basename(resolved) !== 'RimMakerResourceIcons_' + runId) throw new Error('Unsafe icon capture cleanup path.');
  fs.rmSync(resolved, { recursive: true, force: true });
}
