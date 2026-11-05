"""Extract official quality, weather and cover data for reference graph comparisons."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from extract_game_definitions import merge_xml, PACKS

repo = Path(__file__).resolve().parents[1]
game = repo.parent
nodes = [(node, pack, file.relative_to(game).as_posix()) for pack in PACKS
         for file in sorted((game / 'Data' / pack / 'Defs').rglob('*.xml'))
         for node in ET.parse(file).getroot()]
parents = {(node.tag, node.get('Name')): node for node, _, _ in nodes if node.get('Name')}

def resolve(node):
    parent = parents.get((node.tag, node.get('ParentName')))
    return merge_xml(resolve(parent), node) if parent is not None else node

accuracy = next(resolve(node) for node, _, _ in nodes if node.get('Name') == 'AccuracyBase')
part = accuracy.find('parts/li[@Class="StatPart_Quality"]')
qualities = [{'id': name, 'label': name, 'factor': float(part.findtext('factor' + name))}
             for name in ['Awful', 'Poor', 'Normal', 'Good', 'Excellent', 'Masterwork', 'Legendary']]
weather = []
for raw, pack, source in nodes:
    if raw.tag != 'WeatherDef' or not raw.findtext('defName') or raw.get('Abstract', '').lower() == 'true':
        continue
    node = resolve(raw)
    weather.append({'id': node.findtext('defName'), 'label': node.findtext('label').capitalize(),
                    'factor': float(node.findtext('accuracyMultiplier', '1')), 'pack': pack, 'source': source})
cover = []
for name in ['Sandbags', 'Barricade', 'ChunkGranite', 'Plant_TreeOak']:
    raw, pack, source = next(entry for entry in nodes if entry[0].tag == 'ThingDef' and entry[0].findtext('defName') == name)
    node = resolve(raw)
    cover.append({'id': name, 'label': node.findtext('label').capitalize(), 'blockChance': float(node.findtext('fillPercent')), 'source': source})
result = {'gameVersion': (game / 'Version.txt').read_text().split()[0],
          'assemblySha256': hashlib.sha256((game / 'RimWorldWin64_Data/Managed/Assembly-CSharp.dll').read_bytes()).hexdigest(),
          'qualitySource': 'Data/Core/Defs/Stats/Stats_Weapons_Ranged.xml', 'qualities': qualities, 'weather': weather, 'cover': cover,
          'coverGeometry': 'One cover object cardinally adjacent to the target, directly between target and shooter; mature tree; no other obstacles.',
          'coverDistanceFactors': [[1.9, 0.3333], [2.9, 0.66666]], 'coverShooterOffset': 1}
target = repo / 'src/utility/data/accuracyOverlays.json'
target.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(f'Extracted {len(qualities)} qualities, {len(weather)} weathers and {len(cover)} cover presets.')
