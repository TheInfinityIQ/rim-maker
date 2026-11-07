"""Prepare truthful template texture and SoundDef audition references from the local game."""
import hashlib
import json
import sys
from pathlib import Path
import xml.etree.ElementTree as ET
from extract_game_definitions import PACKS, merge_xml
repo = Path(__file__).resolve().parents[1]
game = repo.parent
sys.path.insert(0, str(game / '.rimmaker-tools/python'))
import UnityPy
templates = json.loads((repo / 'src/utility/data/weaponTemplates.json').read_text())
nodes = [node for pack in PACKS for file in (game / 'Data' / pack / 'Defs/SoundDefs').rglob('*.xml') for node in ET.parse(file).getroot()]
parents = {node.get('Name'): node for node in nodes if node.get('Name')}
def resolve(node):
    return merge_xml(resolve(parents[node.get('ParentName')]), node) if node.get('ParentName') in parents else node
sounds = {node.findtext('defName'): resolve(node) for node in nodes if node.findtext('defName')}
needed_sounds = {t['soundInteract'] for t in templates if t['soundInteract']}
needed_images = {t['graphicData']['texPath'] for t in templates}
for template in templates:
    for verb in template['verbProperties']:
        needed_sounds.update(verb[field] for field in ['soundCast', 'soundCastTail'] if verb.get(field))
env = UnityPy.load(str(game / 'RimWorldWin64_Data/globalgamemanagers'), str(game / 'RimWorldWin64_Data/resources.assets'))
resources = next(obj.read().m_Container for obj in env.objects if obj.type.name == 'ResourceManager')
audio, textures = {}, {}
for asset_path, obj in resources:
    if obj.m_PathID == 0: continue
    path = asset_path.replace('\\', '/').lower()
    if obj.type.name == 'AudioClip': audio[path.removeprefix('sounds/')] = (asset_path, obj)
    elif obj.type.name == 'Texture2D': textures[path.removeprefix('textures/')] = (asset_path, obj)
output = repo / 'public/reference-media'
output.mkdir(parents=True, exist_ok=True)
manifest = {'gameVersion': (game / 'Version.txt').read_text().strip(), 'images': {}, 'sounds': {}, 'missing': []}
native = []
for tex_path in sorted(needed_images):
    resource = textures.get(tex_path.lower())
    if resource is None:
        manifest['missing'].append(tex_path); continue
    source, obj = resource
    filename = hashlib.sha256(tex_path.encode()).hexdigest()[:16] + '.png'
    obj.read().image.save(output / filename)
    manifest['images'][tex_path] = {'file': filename, 'source': source}
for name in sorted(needed_sounds):
    definition = sounds.get(name)
    if definition is None: manifest['missing'].append(name); continue
    candidates = []
    for grain in definition.findall('subSounds/li/grains/li'):
        clip, folder = grain.findtext('clipPath'), grain.findtext('clipFolderPath')
        if clip and clip.lower() in audio: candidates.append(audio[clip.lower()])
        if folder: candidates.extend(resource for path, resource in sorted(audio.items()) if path.startswith(folder.lower().rstrip('/') + '/'))
    if not candidates: manifest['missing'].append(name); continue
    source, obj = candidates[0]
    try: samples = obj.read().samples
    except Exception:
        native.append({'id': name, 'path': source.replace('\\', '/').removeprefix('sounds/'), 'source': source}); continue
    if not samples: manifest['missing'].append(name); continue
    content = next(iter(samples.values()))
    if content[:4] != b'RIFF': raise RuntimeError('Expected decoded WAV: ' + source)
    sha = hashlib.sha256(content).hexdigest()
    filename = sha[:16] + '.wav'
    (output / filename).write_bytes(content)
    manifest['sounds'][name] = {'file': filename, 'source': source, 'sha256': sha, 'definition': name, 'selection': 'First resolved grain sample; SoundDef pitch/volume/environment are not simulated.'}
(repo / 'src/utility/data/templateMedia.json').write_text(json.dumps(manifest, indent=2) + '\n')
native_output = repo / 'game-test-results/template-audio'
native_output.mkdir(parents=True, exist_ok=True)
root = ET.Element('sounds')
for item in native: ET.SubElement(root, 'sound', item)
ET.ElementTree(root).write(native_output / 'input.xml')
print('Images', len(manifest['images']), 'SoundDefs', len(manifest['sounds']), 'Missing', manifest['missing'])
print('Native audio decoding needed:', native)
