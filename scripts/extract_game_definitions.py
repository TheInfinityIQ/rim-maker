"""Extract dropdown metadata from installed XML; never copy game assemblies or source.

Usage: python scripts/extract_game_definitions.py --game-dir "C:/.../RimWorld"
This is an unpatched official-content snapshot, not a simulation of the active mod list.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

PACKS = ('Core', 'Royalty', 'Ideology', 'Biotech', 'Anomaly', 'Odyssey')


def merge_xml(parent, child):
    if child.get('Inherit', '').lower() == 'false':
        return copy.deepcopy(child)
    result = copy.deepcopy(parent)
    result.attrib.update(child.attrib)
    if child.text and child.text.strip() or not len(child):
        result.text = child.text
    for entry in child:
        previous = result.find(entry.tag) if entry.tag != 'li' else None
        if previous is None:
            result.append(copy.deepcopy(entry))
        else:
            index = list(result).index(previous)
            result.remove(previous)
            result.insert(index, merge_xml(previous, entry))
    return result


def xml_value(node):
    if not len(node):
        text = (node.text or '').strip()
        if text.lower() in ('true', 'false'):
            return text.lower() == 'true'
        if re.fullmatch(r'-?\d+(\.\d+)?', text):
            return float(text) if '.' in text else int(text)
        return text
    if all(child.tag == 'li' for child in node):
        return [xml_value(child) for child in node]
    return {child.tag: xml_value(child) for child in node}


def projectile_behavior(thing_class):
    if thing_class in ('Bullet', 'RimWorld.Bullet'):
        return 'Impact bullet'
    if thing_class in ('Projectile_Explosive', 'Verse.Projectile_Explosive'):
        return 'Area explosion'
    return {
        'FireArrow': 'Fire arrow', 'Projectile_DoomsdayRocket': 'Doomsday explosion',
        'Projectile_HellsphereCannon': 'Hellsphere blast', 'Projectile_Liquid': 'Liquid spray',
        'Projectile_SpawnsThing': 'Spawns a thing', 'Projectile_SpawnsPawnZeroAge': 'Spawns a pawn',
        'Beam': 'Beam projectile', 'Spark': 'Fire spark effect',
    }.get(thing_class, 'Specialized projectile')


def extract(game_dir):
    nodes = []
    packages = {}
    for pack in PACKS:
        about = ET.parse(game_dir / 'Data' / pack / 'About/About.xml').getroot()
        packages[pack] = about.findtext('packageId')
        for path in sorted((game_dir / 'Data' / pack / 'Defs').rglob('*.xml')):
            root = ET.parse(path).getroot()
            if root.tag == 'Defs':
                nodes.extend((node, pack, path.relative_to(game_dir).as_posix()) for node in root)
    package_lookup = {value.lower(): key for key, value in packages.items()}
    parents = {(node.tag, node.get('Name')): node for node, _, _ in nodes if node.get('Name')}
    cache = {}

    def resolve(node, ancestry=()):
        key = id(node)
        if key in cache:
            return cache[key]
        name = node.get('ParentName')
        if name:
            if name in ancestry:
                raise ValueError('Inheritance cycle: ' + name)
            parent = parents.get((node.tag, name))
            if parent is None:
                raise ValueError(f'Unresolved {node.tag} parent: {name}')
            result = merge_xml(resolve(parent, ancestry + (name,)), node)
        else:
            result = copy.deepcopy(node)
        cache[key] = result
        return result

    output = {'schemaVersion': 1, 'gameVersion': (game_dir / 'Version.txt').read_text().strip(),
              'assemblySha256': hashlib.sha256((game_dir / 'RimWorldWin64_Data/Managed/Assembly-CSharp.dll').read_bytes()).hexdigest(),
              'packs': {pack: {'packageId': packages[pack], **{kind: [] for kind in ('bullets', 'things', 'stats', 'skills', 'tools', 'sounds')}} for pack in PACKS}}
    for raw, pack, path in nodes:
        name = raw.findtext('defName')
        if not name or raw.get('Abstract', '').lower() == 'true':
            continue
        if raw.tag not in ('ThingDef', 'StatDef', 'SkillDef', 'ToolCapacityDef', 'SoundDef'):
            continue
        node = resolve(raw)
        # Root conditions are retained, including inherited conditions. Optional
        # child fields do not make the whole original game definition unavailable.
        requires = {pack} - {'Core'}
        for requirement in (node.get('MayRequire') or '').split(','):
            if requirement.strip():
                requirement_pack = package_lookup.get(requirement.strip().lower())
                if requirement_pack is None:
                    raise ValueError('Unknown package requirement: ' + requirement)
                requires.add(requirement_pack)
        any_of = [package_lookup[r.strip().lower()] for r in (node.get('MayRequireAnyOf') or '').split(',') if r.strip()]
        record = {'defName': name, 'label': node.findtext('label') or node.findtext('skillLabel') or name,
                  'pack': pack, 'requires': sorted(requires), 'source': path}
        if any_of:
            record['requiresAny'] = any_of
        if raw.tag == 'ThingDef':
            category = node.findtext('category')
            if category == 'Projectile':
                record['thingClass'] = node.findtext('thingClass') or ''
                record['behavior'] = projectile_behavior(record['thingClass'])
                record['projectile'] = xml_value(node.find('projectile')) if node.find('projectile') is not None else {}
                record['graphicData'] = xml_value(node.find('graphicData')) if node.find('graphicData') is not None else {}
                # Standalone effects are inventoried but not offered as ammunition.
                record['selectable'] = record['thingClass'] != 'Spark' and bool(record['projectile'])
                output['packs'][pack]['bullets'].append(record)
            elif category == 'Item':
                output['packs'][pack]['things'].append(record)
        else:
            kind = {'StatDef': 'stats', 'SkillDef': 'skills', 'ToolCapacityDef': 'tools', 'SoundDef': 'sounds'}[raw.tag]
            if kind in ('stats', 'skills'):
                record['description'] = node.findtext('description') or ''
            if kind == 'skills':
                record['skillLabel'] = node.findtext('skillLabel') or record['label']
            output['packs'][pack][kind].append(record)
    for values in output['packs'].values():
        for kind in ('bullets', 'things', 'stats', 'skills', 'tools', 'sounds'):
            values[kind].sort(key=lambda row: (row['label'].casefold(), row['defName']))
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--game-dir', required=True, type=Path)
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'src/utility/data/gameDefinitions.json')
    args = parser.parse_args()
    result = extract(args.game_dir.resolve())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(result['gameVersion'])
    for pack, values in result['packs'].items():
        print(pack, {kind: len(values[kind]) for kind in ('bullets', 'things', 'stats', 'skills', 'tools', 'sounds')})
