import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { createServer } from 'vite';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = path.resolve(process.env.RIMWORLD_DIR || path.join(repo, '..'));
const runId = Date.now().toString();
const packageId = 'rimmaker.resource.icons.' + runId;
const mod = path.join(game, 'Mods', 'RimMakerResourceIcons_' + runId);
const output = path.join(repo, 'game-test-results', 'resource-icons-' + runId);
const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); };
const catalog = JSON.parse(fs.readFileSync(path.join(repo, 'src/utility/data/gameDefinitions.json'), 'utf8'));
const benches = process.argv.includes('--benches');
const collection = benches ? 'benches' : 'things';
const resources = new Map(Object.values(catalog.packs).flatMap(pack => (pack[collection] || []).map(row => [row.defName, row])));
const compileOnly = process.argv.includes('--compile-only');
if (!fs.existsSync(path.join(game, 'RimWorldWin64.exe'))) throw new Error('Set RIMWORLD_DIR to your installed RimWorld folder.');
try {
  write(path.join(mod, 'About/About.xml'), `<ModMetaData><name>RimMaker resource icons</name><author>RimMaker</author><packageId>${packageId}</packageId><supportedVersions><li>1.6</li></supportedVersions><description>Temporary local icon capture.</description></ModMetaData>`);
  fs.mkdirSync(path.join(mod, 'Assemblies'), { recursive: true });
  if (process.argv.includes('--verify-recipes')) {
    const vite = await createServer({ root: repo, server: { middlewareMode: true }, appType: 'custom' });
    try {
      const { createWeapon } = await vite.ssrLoadModule('/src/utility/weaponTypes.js');
      const { buildModArchive } = await vite.ssrLoadModule('/src/utility/scripts/buildXML.js');
      const { weaponDefName } = await vite.ssrLoadModule('/src/utility/definitionNames.js');
      const multi = createWeapon(), cleared = createWeapon(); multi.gun.label = 'Multi recipe'; cleared.gun.label = 'Cleared recipe';
      multi.gun.recipeMaker.recipeUsers = ['TableMachining', 'ElectricSmithy'];
      multi.gun.recipeMaker.researchPrerequisite = 'PrecisionRifling'; multi.gun.recipeMaker.researchPrerequisites = ['Machining'];
      cleared.gun.recipeMaker.recipeUsers = []; cleared.gun.recipeMaker.researchPrerequisite = null; cleared.gun.recipeMaker.researchPrerequisites = [];
      const zip = buildModArchive([multi, cleared], [], 'RecipeChecks');
      for (const entry of Object.values(zip.files)) if (!entry.dir && !entry.name.includes('/About/')) write(path.join(mod, ...entry.name.split('/').slice(1)), await entry.async('nodebuffer'));
      write(path.join(output, 'recipe-checks.xml'), `<checks><weapon id="${weaponDefName('RecipeChecks', multi.gun.label)}"><bench>TableMachining</bench><bench>ElectricSmithy</bench><research>PrecisionRifling</research><research>Machining</research></weapon><weapon id="${weaponDefName('RecipeChecks', cleared.gun.label)}"/></checks>`);
    } finally { await vite.close(); }
  }
  const managed = path.join(game, 'RimWorldWin64_Data/Managed');
  const refs = ['mscorlib', 'System', 'System.Core', 'System.Xml', 'System.Xml.Linq', 'Assembly-CSharp', 'UnityEngine.CoreModule', 'UnityEngine.IMGUIModule', 'UnityEngine.ImageConversionModule', 'netstandard'];
  const compiled = spawnSync(process.env.CSC_EXE || 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe', ['/nologo', '/noconfig', '/nostdlib+', '/target:library', '/out:' + path.join(mod, 'Assemblies/ResourceIcons.dll'), ...refs.map(name => '/r:' + path.join(managed, name + '.dll')), ...['ResourceIconCapture.cs', 'RecipeChoicesChecks.cs'].map(file => path.join(repo, 'tools/rimworld', file))], { encoding: 'utf8', windowsHide: true });
  if (compiled.status !== 0) throw new Error(compiled.stdout + compiled.stderr);
  if (compileOnly) console.log('Resource icon capture compiled against the installed game.');
  else {
    const packs = Object.entries(catalog.packs).map(([, pack]) => pack.packageId);
    write(path.join(output, 'Config/ModsConfig.xml'), `<ModsConfigData><version>${catalog.gameVersion.split(' ')[0]}</version><activeMods>${[...packs, packageId].map(id => `<li>${id}</li>`).join('')}</activeMods><knownExpansions>${packs.slice(1).map(id => `<li>${id}</li>`).join('')}</knownExpansions></ModsConfigData>`);
    write(path.join(output, 'Config/Prefs.xml'), '<Prefs><runInBackground>True</runInBackground><uiScale>1</uiScale><volumeMaster>0</volumeMaster><volumeMusic>0</volumeMusic></Prefs>');
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
    if (process.argv.includes('--verify-recipes') && !fs.existsSync(path.join(output, 'recipe-check-results.xml'))) throw new Error('Native recipe checks did not finish.');
    const report = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' }).parse(fs.readFileSync(path.join(output, 'icons.xml'), 'utf8')).icons;
    const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
    const manifest = { schema: 1, gameVersion: report.gameVersion, assemblySha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(managed, 'Assembly-CSharp.dll'))).digest('hex'), renderer: 'RimWorld Widgets.DefIcon', size: 64, icons: {}, missing: array(report.missing).map(row => row.defName) };
    for (const icon of array(report.icon)) {
      const png = fs.readFileSync(path.join(output, icon.defName + '.png'));
      const hash = crypto.createHash('sha256').update(png).digest('hex');
      const file = hash.slice(0, 16) + '.png';
      write(path.join(repo, benches ? 'public/benches' : 'public/resources', file), png);
      manifest.icons[icon.defName] = { file, sha256: hash, pack: resources.get(icon.defName).pack, source: resources.get(icon.defName).source, texture: icon.texture };
    }
    const required = benches ? ['TableMachining', 'ElectricSmithy'] : ['Steel', 'ComponentIndustrial'];
    if (required.some(id => !manifest.icons[id])) throw new Error('Required default icons are missing.');
    write(path.join(repo, 'src/utility/data', benches ? 'bench-icons.json' : 'resource-icons.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Captured ${Object.keys(manifest.icons).length}/${resources.size} resource icons; ${manifest.missing.length} unavailable. Output: ${output}`);
  }
} finally {
  const resolved = path.resolve(mod);
  if (!resolved.startsWith(path.resolve(game, 'Mods') + path.sep) || path.basename(resolved) !== 'RimMakerResourceIcons_' + runId) throw new Error('Unsafe icon capture cleanup path.');
  fs.rmSync(resolved, { recursive: true, force: true });
}
