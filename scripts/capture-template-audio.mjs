import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), game = path.resolve(repo, '..');
const runId = Date.now().toString(), packageId = 'rimmaker.template.media.' + runId;
const mod = path.join(game, 'Mods', 'RimMakerTemplateMedia_' + runId), output = path.join(repo, 'game-test-results', 'template-media-' + runId);
const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); };
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const input = fs.readFileSync(path.join(repo, 'game-test-results/template-audio/input.xml'), 'utf8');
const sounds = array(parser.parse(input).sounds.sound);
const manifestPath = path.join(repo, 'src/utility/data/templateMedia.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const images = manifest.missing.filter(id => id.startsWith('Things/')).map(path => ({ id: crypto.createHash('sha256').update(path).digest('hex').slice(0, 16), path }));
try {
  write(path.join(mod, 'About/About.xml'), `<ModMetaData><name>RimMaker template media</name><author>RimMaker</author><packageId>${packageId}</packageId><supportedVersions><li>1.6</li></supportedVersions></ModMetaData>`);
  fs.mkdirSync(path.join(mod, 'Assemblies'), { recursive: true });
  const managed = path.join(game, 'RimWorldWin64_Data/Managed');
  const refs = ['mscorlib', 'System', 'System.Core', 'System.Xml', 'System.Xml.Linq', 'Assembly-CSharp', 'UnityEngine.CoreModule', 'UnityEngine.AudioModule', 'UnityEngine.ImageConversionModule', 'netstandard'];
  const result = spawnSync('C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe', ['/nologo', '/noconfig', '/nostdlib+', '/target:library', '/out:' + path.join(mod, 'Assemblies/Capture.dll'), ...refs.map(name => '/r:' + path.join(managed, name + '.dll')), path.join(repo, 'tools/rimworld/TemplateMediaCapture.cs')], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
  write(path.join(output, 'input.xml'), `<media>${sounds.map(sound => `<sound id="${sound.id}" path="${sound.path}"/>`).join('')}${images.map(image => `<image id="${image.id}" path="${image.path}"/>`).join('')}</media>`);
  write(path.join(output, 'Config/ModsConfig.xml'), `<ModsConfigData><version>1.6.4871</version><activeMods><li>ludeon.rimworld</li><li>ludeon.rimworld.biotech</li><li>${packageId}</li></activeMods><knownExpansions>${['royalty', 'ideology', 'biotech', 'anomaly', 'odyssey'].map(id => `<li>ludeon.rimworld.${id}</li>`).join('')}</knownExpansions></ModsConfigData>`);
  write(path.join(output, 'Config/Prefs.xml'), '<Prefs><runInBackground>True</runInBackground><volumeMusic>0</volumeMusic></Prefs>');
  const code = await new Promise((resolve, reject) => {
    const child = spawn(path.join(game, 'RimWorldWin64.exe'), ['-screen-fullscreen', '0', '-screen-width', '800', '-screen-height', '800', '-savedatafolder=' + output, '-rimmaker-template-media=' + output, '-logFile', path.join(output, 'Player.log')], { cwd: game, stdio: 'ignore', windowsHide: true });
    const timer = setTimeout(() => child.kill(), 240000); child.once('error', error => { clearTimeout(timer); reject(error); }); child.once('exit', status => { clearTimeout(timer); resolve(status); });
  });
  if (code !== 0 || !fs.existsSync(path.join(output, 'complete.txt'))) throw new Error('Native media capture failed: ' + output + (fs.existsSync(path.join(output, 'error.txt')) ? ' ' + fs.readFileSync(path.join(output, 'error.txt'), 'utf8') : ''));
  for (const sound of sounds) {
    const data = fs.readFileSync(path.join(output, sound.id + '.wav')), sha256 = crypto.createHash('sha256').update(data).digest('hex'), file = sha256.slice(0, 16) + '.wav';
    if (!data.subarray(44).some(value => value)) throw new Error('Silent reference capture: ' + sound.id);
    write(path.join(repo, 'public/reference-media', file), data);
    manifest.sounds[sound.id] = { file, sha256, source: sound.source, definition: sound.id, decoder: 'Unity AudioSource PCM capture', selection: 'First resolved grain sample; SoundDef pitch, volume and environmental effects are not simulated.' };
  }
  for (const image of images) { const file = image.id + '.png'; write(path.join(repo, 'public/reference-media', file), fs.readFileSync(path.join(output, file))); manifest.images[image.path] = { file, source: image.path, decoder: 'Unity ContentFinder<Texture2D>' }; }
  manifest.missing = manifest.missing.filter(id => !manifest.images[id] && !manifest.sounds[id]);
  write(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Captured ${sounds.length} SoundDef samples and ${images.length} missing textures. ${output}`);
} finally { const resolved = path.resolve(mod); if (!resolved.startsWith(path.resolve(game, 'Mods') + path.sep) || path.basename(resolved) !== 'RimMakerTemplateMedia_' + runId) throw new Error('Unsafe media cleanup path.'); fs.rmSync(resolved, { recursive: true, force: true }); }
