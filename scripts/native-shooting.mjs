import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = path.resolve(process.env.RIMWORLD_DIR || path.join(repo, '..'));
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const xml = value => String(value).replace(/[<>&"']/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[ch]));
const stockExamples = new Set(['Gun_AssaultRifle', 'Gun_TripleRocket', 'Gun_InfernoCannon']);
export function validateShootingPlan(plan) {
  for (const name of ['colonist', 'target']) for (const axis of ['x', 'y']) {
    const value = plan?.[name]?.[axis];
    if (!Number.isInteger(value) || Math.abs(value) > 110) throw new Error('Choose a tile inside the preview map.');
  }
  if (!/^[A-Za-z0-9_-]+$/.test(plan.weapon || '')) throw new Error('Invalid weapon definition name.');
  if (plan.stock && !stockExamples.has(plan.weapon)) throw new Error('Unknown stock example.');
  if (plan.scenario && !['village', 'white-room'].includes(plan.scenario)) throw new Error('Unknown range scenario.');
  if (plan.task && !['shoot', 'accuracy'].includes(plan.task)) throw new Error('Unknown range task.');
  if (plan.skill != null && (!Number.isInteger(plan.skill) || plan.skill < 0 || plan.skill > 20)) throw new Error('Shooting skill must be 0 to 20.');
  if (plan.task === 'accuracy') {
    if (!Array.isArray(plan.ranges) || !plan.ranges.length || plan.ranges.length > 8 || plan.ranges.some(n => !Number.isInteger(n) || n < 1 || n > 100)) throw new Error('Choose one to eight ranges from 1 to 100 tiles.');
    if (!Number.isInteger(plan.trials) || plan.trials < 20 || plan.trials > 1000) throw new Error('Choose 20 to 1000 trials per range.');
  }
  return plan;
}
export async function extractPreviewArchive(base64, destination) {
  if (typeof base64 !== 'string' || base64.length > 44 * 1024 * 1024) throw new Error('Preview export exceeds 32 MB.');
  const zip = await JSZip.loadAsync(Buffer.from(base64, 'base64'));
  let total = 0;
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const relative = entry.name.replace(/^RimMakerPreview\//, '');
    if (!entry.name.startsWith('RimMakerPreview/') || relative.includes('\\') || relative.split('/').some(p => p === '..' || p === '.') || path.isAbsolute(relative)) throw new Error('Unsafe preview archive path.');
    if (relative === 'About/About.xml') continue;
    if (!/^(Defs\/[^:]+\.xml|Textures\/[^:]+\.png|Sounds\/[^:]+\.(wav|ogg|mp3))$/i.test(relative)) throw new Error('Preview accepts XML, PNG and sound files only.');
    // Inspect advertised size before inflating, then verify actual total as well.
    if ((entry._data?.uncompressedSize || 0) + total > 50 * 1024 * 1024) throw new Error('Unpacked preview exceeds 50 MB.');
    const bytes = await entry.async('nodebuffer'); total += bytes.length;
    if (total > 50 * 1024 * 1024) throw new Error('Unpacked preview exceeds 50 MB.');
    const target = path.resolve(destination, relative);
    if (!target.startsWith(path.resolve(destination) + path.sep)) throw new Error('Unsafe preview archive path.');
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes);
  }
}
export async function runNativeShooting(plan, { compileOnly = false } = {}) {
  validateShootingPlan(plan);
  if (!fs.existsSync(path.join(game, 'RimWorldWin64.exe'))) throw new Error('RimWorld is missing. Set RIMWORLD_DIR to its installation folder.');
  const id = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
  const output = path.join(repo, 'game-test-results', 'shooting-' + id);
  const mod = path.join(game, 'Mods', 'RimMakerShooting_' + id);
  const packageId = 'rimmaker.shooting.' + id.replace(/-/g, '');
  const write = (file, content) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };
  try {
    if (!plan.stock && !compileOnly) await extractPreviewArchive(plan.archive, mod);
    write(path.join(mod, 'About/About.xml'), `<ModMetaData><name>RimMaker isolated shooting preview</name><author>RimMaker</author><packageId>${packageId}</packageId><supportedVersions><li>1.6</li></supportedVersions><description>Disposable native shooting recording.</description></ModMetaData>`);
    write(path.join(mod, 'Defs/RangeTarget.xml'), '<Defs><ThingDef><defName>RimMaker_RangeTarget</defName><label>human-sized range target</label><description>A stationary, unarmoured target with the standard human target-size factor.</description><category>Building</category><thingClass>Building</thingClass><altitudeLayer>Building</altitudeLayer><passability>Standable</passability><fillPercent>0.4</fillPercent><selectable>true</selectable><useHitPoints>true</useHitPoints><statBases><MaxHitPoints>1000000</MaxHitPoints><Flammability>1</Flammability></statBases><graphicData><texPath>RimMaker/RangeTarget</texPath><graphicClass>Graphic_Single</graphicClass><drawSize>(1,1.5)</drawSize></graphicData><comps><li><compClass>RimMaker.ShootingPreview.RangeHitCounter</compClass></li></comps></ThingDef></Defs>');
    write(path.join(mod, 'Textures/RimMaker/RangeTarget.png'), fs.readFileSync(path.join(repo, 'public/previews/target.png')));
    fs.mkdirSync(path.join(mod, 'Assemblies'), { recursive: true });
    const managed = path.join(game, 'RimWorldWin64_Data/Managed');
    const refs = ['mscorlib', 'System', 'System.Core', 'System.Xml', 'System.Xml.Linq', 'Assembly-CSharp', 'Unity.Mathematics', 'UnityEngine.CoreModule', 'UnityEngine.ImageConversionModule', 'UnityEngine.AudioModule', 'netstandard'];
    const compiled = spawnSync(process.env.CSC_EXE || 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe', ['/nologo', '/noconfig', '/nostdlib+', '/target:library', '/out:' + path.join(mod, 'Assemblies/Shooting.dll'), ...refs.map(name => '/r:' + path.join(managed, name + '.dll')), ...['ShootingPreview.cs', 'AccuracyRange.cs'].map(file => path.join(repo, 'tools/rimworld', file))], { encoding: 'utf8', windowsHide: true });
    if (compiled.status !== 0) throw new Error(compiled.stdout + compiled.stderr);
    if (compileOnly) return { compiled: true };
    const expansions = ['royalty', 'ideology', 'biotech', 'anomaly', 'odyssey'];
    const packs = ['ludeon.rimworld', ...(plan.expansions || []).map(pack => {
      if (!expansions.includes(pack)) throw new Error('Unknown expansion.');
      if (!fs.existsSync(path.join(game, 'Data', pack[0].toUpperCase() + pack.slice(1), 'About/About.xml'))) throw new Error('Required expansion is not installed: ' + pack);
      return 'ludeon.rimworld.' + pack;
    }), packageId];
    write(path.join(output, 'Config/ModsConfig.xml'), `<ModsConfigData><version>1.6.4871</version><activeMods>${packs.map(p => `<li>${p}</li>`).join('')}</activeMods><knownExpansions>${expansions.map(p => `<li>ludeon.rimworld.${p}</li>`).join('')}</knownExpansions></ModsConfigData>`);
    write(path.join(output, 'Config/Prefs.xml'), '<Prefs><devMode>True</devMode><runInBackground>True</runInBackground></Prefs>');
    write(path.join(output, 'plan.xml'), `<shot task="${plan.task || 'shoot'}" scenario="${plan.scenario || 'village'}" skill="${plan.skill ?? 10}" trials="${plan.trials ?? 200}" weapon="${xml(plan.weapon)}" colonistX="${plan.colonist.x}" colonistY="${plan.colonist.y}" targetX="${plan.target.x}" targetY="${plan.target.y}">${(plan.ranges || []).map(distance => `<distance>${distance}</distance>`).join('')}</shot>`);
    const code = await new Promise((resolve, reject) => {
      const child = spawn(path.join(game, 'RimWorldWin64.exe'), ['-quicktest', '-screen-fullscreen', '0', '-screen-width', '800', '-screen-height', '800', '-savedatafolder=' + output, '-rimmaker-shooting=' + output, '-logFile', path.join(output, 'Player.log')], { cwd: game, windowsHide: true, stdio: 'ignore' });
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; child.kill(); }, 300000);
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', status => { clearTimeout(timer); if (timedOut) reject(new Error('Native shooting timed out. See ' + output)); else resolve(status); });
    });
    const errorPath = path.join(output, 'shooting-error.txt');
    if (fs.existsSync(errorPath)) throw new Error(fs.readFileSync(errorPath, 'utf8').split('\n')[0].replace(/^System\.[^:]+: /, ''));
    if (plan.task === 'accuracy') {
      const file = path.join(output, 'accuracy.xml');
      if (!fs.existsSync(file)) throw new Error('RimWorld did not return accuracy results. See ' + output);
      const native = parser.parse(fs.readFileSync(file, 'utf8')).accuracy;
      if (code !== 0 || array(native.errors?.error).length) throw new Error('Native accuracy test failed: ' + (array(native.errors?.error)[0] || output));
      const { row, errors: ignored, ...metadata } = native;
      const accuracy = { engine: 'RimWorld', schema: 1, ...metadata, assemblySha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(managed, 'Assembly-CSharp.dll'))).digest('hex'),
        rows: array(row).map(item => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, key === 'effect' ? value : ['reachable', 'analyticApplicable'].includes(key) ? value === 'true' : Number(value)]))) };
      write(path.join(output, 'accuracy.json'), JSON.stringify(accuracy, null, 2));
      return { accuracy, output };
    }
    const resultPath = path.join(output, 'replay.xml');
    if (!fs.existsSync(resultPath)) throw new Error('RimWorld did not produce a recording. See ' + output);
    const native = parser.parse(fs.readFileSync(resultPath, 'utf8')).replay;
    const errors = array(native.errors?.error);
    if (code !== 0 || errors.length) throw new Error('RimWorld reported an error: ' + (errors[0] || 'see ' + output));
    const log = fs.readFileSync(path.join(output, 'Player.log'), 'utf8');
    if (/Exception:|XML error:|Could not resolve cross-reference|Config error in|Failed to find/.test(log)) throw new Error('RimWorld reported a loading error. See ' + output);
    const frames = array(native.frames?.frame).map(frame => ({ tick: Number(frame.tick), image: 'data:image/jpeg;base64,' + fs.readFileSync(path.join(output, frame.file)).toString('base64') }));
    const { frames: _, shots, samples, errors: __, ...metadata } = native;
    const replay = { engine: 'RimWorld', schema: 1, ...metadata, durationTicks: Number(native.durationTicks), complete: native.complete === 'true',
      assemblySha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(managed, 'Assembly-CSharp.dll'))).digest('hex'),
      shots: array(shots?.shot).map(s => ({ tick: Number(s.tick), id: Number(s.id) })), frames,
      samples: array(samples?.sample).map(s => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Number(v)]))) };
    write(path.join(output, 'replay.json'), JSON.stringify(replay));
    return { replay, output };
  } finally {
    const resolved = path.resolve(mod);
    if (!resolved.startsWith(path.resolve(game, 'Mods') + path.sep) || !path.basename(resolved).endsWith(id)) throw new Error('Unsafe shooting fixture cleanup.');
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}
