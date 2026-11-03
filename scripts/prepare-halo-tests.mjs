import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';

const root = process.env.HALO_MODS_DIR || path.resolve('..', '..', '..', 'workshop/content/294100');
const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, trimValues: true });
const array = value => value === undefined ? [] : Array.isArray(value) ? value : [value];
function files(dir, suffix) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? files(path.join(dir, entry.name), suffix) : entry.name.endsWith(suffix) ? [path.join(dir, entry.name)] : []);
}
const cases = [];
for (const [id, pack] of [['1542254108', 'UNSC'], ['2198416243', 'Forerunner']]) {
  const folder = path.join(root, id);
  if (!fs.existsSync(folder)) throw new Error(`Halo mod is missing: ${folder}. Set HALO_MODS_DIR to your Workshop 294100 directory.`);
  const definitions = new Map();
  const sounds = new Map();
  for (const file of files(path.join(folder, 'Defs'), '.xml')) {
    const xml = fs.readFileSync(file, 'utf8');
    const doc = parser.parse(xml).Defs || {};
    for (const def of array(doc.ThingDef)) if (def.defName) {
      if (definitions.has(def.defName)) throw new Error(`Ambiguous/versioned fixture: ${def.defName}`);
      definitions.set(def.defName, { def, file: path.relative(folder, file), hash: crypto.createHash('sha256').update(xml).digest('hex') });
    }
    for (const sound of array(doc.SoundDef)) sounds.set(sound.defName, sound);
  }
  function asset(subdirectory, texPath, extensions) {
    if (!texPath) return null;
    for (const extension of extensions) {
      const file = path.join(folder, subdirectory, texPath + extension);
      if (fs.existsSync(file)) return file;
    }
    return null;
  }
  function soundFile(name) {
    const sound = sounds.get(name);
    const sub = array(sound?.subSounds?.li)[0];
    const grain = array(sub?.grains?.li)[0];
    return asset('Sounds', grain?.clipPath, ['.wav', '.ogg']);
  }
  for (const { def: gun, file, hash } of definitions.values()) {
    if (gun['@_ParentName'] !== 'BaseHumanMakeableGun') continue;
    const verb = array(gun.verbs?.li)[0];
    const bullet = definitions.get(verb.defaultProjectile)?.def || null;
    cases.push({ pack, source: file, sourceSha256: hash, gun, bullet,
      assets: { gun: asset('Textures', gun.graphicData?.texPath, ['.png']),
        bullet: asset('Textures', bullet?.graphicData?.texPath, ['.png']),
        shot: soundFile(verb.soundCast), tail: soundFile(verb.soundCastTail), interact: soundFile(gun.soundInteract) } });
  }
}
if (!cases.length) throw new Error('No Halo weapons found; refusing an empty test run.');
fs.mkdirSync('e2e/.local', { recursive: true });
fs.writeFileSync('e2e/.local/halo-cases.json', JSON.stringify(cases, null, 2));
console.log(`Prepared ${cases.length} real weapon cases from local Halo mods. Source assets remain local.`);
