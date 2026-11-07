"""Inventory official weapons/apparel and extract conservative editor templates from installed XML."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from extract_game_definitions import PACKS, merge_xml
repo = Path(__file__).resolve().parents[1]
game = repo.parent
entries = [(node, pack, file.relative_to(game).as_posix()) for pack in PACKS for file in sorted((game / 'Data' / pack / 'Defs').rglob('*.xml')) for node in ET.parse(file).getroot()]
parents = {(node.tag, node.get('Name')): node for node, _, _ in entries if node.get('Name')}
cache = {}
def resolve(node):
    if id(node) not in cache:
        parent = parents.get((node.tag, node.get('ParentName')))
        cache[id(node)] = merge_xml(resolve(parent), node) if parent is not None else node
    return cache[id(node)]
def value(node):
    if node is None: return None
    if not len(node):
        text = (node.text or '').strip()
        if text.lower() in ('true', 'false'): return text.lower() == 'true'
        try: return float(text) if '.' in text else int(text)
        except ValueError: return text
    if all(child.tag == 'li' for child in node):
        return [dict({'@' + key: val for key, val in child.attrib.items()}, **(value(child) if len(child) else {})) if child.attrib else value(child) for child in node]
    return {child.tag: value(child) for child in node}
def names(node, path): return [child.text for child in node.findall(path)]
records, apparel, templates = [], [], []
melee_ids = {'MeleeWeapon_Knife', 'MeleeWeapon_Club', 'MeleeWeapon_Gladius', 'MeleeWeapon_Mace', 'MeleeWeapon_LongSword', 'MeleeWeapon_Spear', 'MeleeWeapon_Ikwa'}
for raw, pack, source in entries:
    name = raw.findtext('defName')
    if raw.tag != 'ThingDef' or not name or raw.get('Abstract', '').lower() == 'true': continue
    node = resolve(raw)
    verbs = names(node, 'verbs/li/verbClass')
    row = {'defName': name, 'label': node.findtext('label') or name, 'pack': pack, 'source': source, 'parent': raw.get('ParentName'), 'verbs': verbs}
    if node.find('apparel') is not None:
        row.update({'layers': names(node, 'apparel/layers/li'), 'bodyPartGroups': names(node, 'apparel/bodyPartGroups/li'), 'wornGraphicPath': node.findtext('apparel/wornGraphicPath'), 'thingClass': node.findtext('thingClass'), 'stats': value(node.find('statBases')), 'comps': [li.get('Class') or li.findtext('compClass') for li in node.findall('comps/li')]})
        apparel.append(row)
        continue
    if node.findtext('category') == 'Item' and (verbs or node.find('tools/li') is not None):
        is_grenade = 'Grenades' in names(node, 'thingCategories/li')
        row.update({'kind': 'grenade' if is_grenade else 'ranged' if verbs else 'melee', 'projectiles': names(node, 'verbs/li/defaultProjectile'), 'tools': value(node.find('tools')), 'equipmentType': node.findtext('equipmentType'), 'comps': [li.get('Class') or li.findtext('compClass') for li in node.findall('comps/li')]})
        records.append(row)
        if name in melee_ids or (is_grenade and all(v == 'Verb_LaunchProjectile' for v in verbs)):
            fields = ['tickerType', 'uiIconScale', 'techLevel', 'equippedAngleOffset', 'possessionCount', 'smeltable', 'rotateInShelves', 'costStuffCount', 'stuffCategories', 'weaponTags', 'thingCategories', 'tradeTags', 'weaponClasses', 'comps']
            templates.append({**row, 'description': node.findtext('description') or '', 'graphicData': value(node.find('graphicData')), 'statBases': value(node.find('statBases')), 'costList': value(node.find('costList')) or {}, 'recipeMaker': value(node.find('recipeMaker')) or {}, 'soundInteract': node.findtext('soundInteract'), 'verbProperties': value(node.find('verbs')) or [], 'extra': {key: value(raw.find(key)) for key in fields if raw.find(key) is not None}})
    elif node.findtext('category') == 'Building' and node.find('building/turretGunDef') is not None:
        records.append({**row, 'kind': 'turret', 'gun': node.findtext('building/turretGunDef')})
result = {'gameVersion': (game / 'Version.txt').read_text().strip(), 'assemblySha256': hashlib.sha256((game / 'RimWorldWin64_Data/Managed/Assembly-CSharp.dll').read_bytes()).hexdigest(), 'weapons': records, 'apparel': apparel}
(repo / 'src/utility/data/equipmentCatalog.json').write_text(json.dumps(result, separators=(',', ':')) + '\n', encoding='utf-8')
(repo / 'src/utility/data/weaponTemplates.json').write_text(json.dumps(templates, indent=2) + '\n', encoding='utf-8')
print('Weapons:', len(records), 'Apparel:', len(apparel), 'Templates:', [(t['defName'], t['kind']) for t in templates])
print('Verb classes:', sorted({verb for row in records for verb in row['verbs']}))
