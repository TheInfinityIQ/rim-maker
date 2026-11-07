import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { XMLParser } from 'fast-xml-parser';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = path.resolve(process.env.RIMWORLD_DIR || path.join(repo, '..'));
const runId = Date.now().toString(), packageId = 'rimmaker.weapon.types.' + runId;
const mod = path.join(game, 'Mods', 'RimMakerWeaponTypes_' + runId);
const output = path.join(repo, 'game-test-results', 'weapon-types-' + runId);
const write = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); };
let vite;
try {
  vite = await createServer({ root: repo, server: { middlewareMode: true }, appType: 'custom' });
  const { createWeapon, weaponTemplates } = await vite.ssrLoadModule('/src/utility/weaponTypes.js');
  const { buildModArchive } = await vite.ssrLoadModule('/src/utility/scripts/buildXML.js');
  const { weaponDefName } = await vite.ssrLoadModule('/src/utility/definitionNames.js');
  const weapons = weaponTemplates.map(template => { const weapon = createWeapon(template.kind, template.defName); weapon.gun.label = template.label; return weapon; });
  const zip = buildModArchive(weapons, [], 'WeaponTypeTest');
  for (const entry of Object.values(zip.files)) if (!entry.dir && !entry.name.includes('/About/')) write(path.join(mod, ...entry.name.split('/').slice(1)), await entry.async('nodebuffer'));
  write(path.join(output, 'plan.xml'), `<weapons>${weapons.map(weapon => `<weapon defName="${weaponDefName('WeaponTypeTest', weapon.gun.label)}" kind="${weapon.kind}"/>`).join('')}</weapons>`);
  await vite.close(); vite = null;
  write(path.join(mod, 'About/About.xml'), `<ModMetaData><name>RimMaker weapon types test</name><author>RimMaker</author><packageId>${packageId}</packageId><supportedVersions><li>1.6</li></supportedVersions></ModMetaData>`);
  write(path.join(mod, 'Defs/Target.xml'), fs.readFileSync(path.join(repo, 'tests/rimworld/Target.xml')));
  fs.mkdirSync(path.join(mod, 'Assemblies'), { recursive: true });
  const managed = path.join(game, 'RimWorldWin64_Data/Managed');
  const refs = ['mscorlib', 'System', 'System.Core', 'System.Xml', 'System.Xml.Linq', 'Assembly-CSharp', 'Unity.Mathematics', 'UnityEngine.CoreModule', 'UnityEngine.ImageConversionModule', 'UnityEngine.AudioModule', 'netstandard'];
  const compiled = spawnSync('C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe', ['/nologo', '/noconfig', '/nostdlib+', '/target:library', '/out:' + path.join(mod, 'Assemblies/Tests.dll'), ...refs.map(name => '/r:' + path.join(managed, name + '.dll')), ...['ShootingPreview.cs', 'AccuracyRange.cs', 'WeaponTypeTests.cs'].map(file => path.join(repo, 'tools/rimworld', file))], { encoding: 'utf8', windowsHide: true });
  if (compiled.status !== 0) throw new Error(compiled.stdout + compiled.stderr);
  const packs = ['ludeon.rimworld', 'ludeon.rimworld.biotech', packageId];
  write(path.join(output, 'Config/ModsConfig.xml'), `<ModsConfigData><version>1.6.4871</version><activeMods>${packs.map(id => `<li>${id}</li>`).join('')}</activeMods><knownExpansions>${['royalty', 'ideology', 'biotech', 'anomaly', 'odyssey'].map(id => `<li>ludeon.rimworld.${id}</li>`).join('')}</knownExpansions></ModsConfigData>`);
  write(path.join(output, 'Config/Prefs.xml'), '<Prefs><runInBackground>True</runInBackground></Prefs>');
  const code = await new Promise((resolve, reject) => {
    const child = spawn(path.join(game, 'RimWorldWin64.exe'), ['-quicktest', '-screen-fullscreen', '0', '-screen-width', '800', '-screen-height', '800', '-savedatafolder=' + output, '-rimmaker-weapon-types=' + output, '-logFile', path.join(output, 'Player.log')], { cwd: game, windowsHide: true, stdio: 'ignore' });
    const timer = setTimeout(() => child.kill(), 300000);
    child.once('error', error => { clearTimeout(timer); reject(error); }); child.once('exit', status => { clearTimeout(timer); resolve(status); });
  });
  if (fs.existsSync(path.join(output, 'capture-error.txt'))) throw new Error(fs.readFileSync(path.join(output, 'capture-error.txt'), 'utf8'));
  const report = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' }).parse(fs.readFileSync(path.join(output, 'results.xml'), 'utf8')).weaponTypes;
  const rows = Array.isArray(report.case) ? report.case : [report.case];
  const startupErrors = fs.readFileSync(path.join(output, 'Player.log'), 'utf8').split(/\r?\n/).filter(line => /Exception:|XML error:|Could not resolve cross-reference|Config error in|Could not load (?:UnityEngine\.)?Texture2D|Failed to find/.test(line));
  write(path.join(output, 'summary.json'), JSON.stringify({ ...report, startupErrors }, null, 2));
  console.log(`${rows.filter(row => row.status === 'passed').length}/${weapons.length} native weapon templates passed. ${startupErrors.length} error lines. Report: ${output}`);
  if (code !== 0 || rows.length !== weapons.length || rows.some(row => row.status !== 'passed') || startupErrors.length) { console.log(JSON.stringify(rows.filter(row => row.status !== 'passed'))); console.log(startupErrors.join('\n')); process.exitCode = 1; }
} finally {
  await vite?.close();
  const resolved = path.resolve(mod);
  if (!resolved.startsWith(path.resolve(game, 'Mods') + path.sep) || path.basename(resolved) !== 'RimMakerWeaponTypes_' + runId) throw new Error('Unsafe test mod cleanup.');
  fs.rmSync(resolved, { recursive: true, force: true });
}
