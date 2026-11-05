"""Extract the XML values used by the controlled white-room accuracy calculator."""
import hashlib
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET

repo = Path(__file__).resolve().parents[1]
game = repo.parent
stats = ET.parse(game / 'Data/Core/Defs/Stats/Stats_Pawns_Combat.xml').getroot()
shooter = next(node for node in stats if node.findtext('defName') == 'ShootingAccuracyPawn')
curve = [[float(value) for value in re.findall(r'-?\d+(?:\.\d+)?', point.text)] for point in shooter.findall('postProcessCurve/points/li')]
defs = [node for file in (game / 'Data/Core/Defs/DamageDefs').glob('*.xml') for node in ET.parse(file).getroot()]
named = {node.get('Name'): node for node in defs if node.get('Name')}
def resolve(node):
    values = resolve(named[node.get('ParentName')]) if node.get('ParentName') in named else {}
    values.update({child.tag: child.text for child in node if not len(child)})
    return values
damage = {}
for node in defs:
    values = resolve(node)
    if values.get('defName'):
        damage[values['defName']] = {
            'damage': float(values.get('defaultDamage', -1)),
            'penetration': float(values.get('defaultArmorPenetration', -1)),
            'armourCategory': values.get('armorCategory'),
        }
rules = {
    'gameVersion': (game / 'Version.txt').read_text().split()[0],
    'assemblySha256': hashlib.sha256((game / 'RimWorldWin64_Data/Managed/Assembly-CSharp.dll').read_bytes()).hexdigest(),
    'sources': ['Data/Core/Defs/Stats/Stats_Pawns_Combat.xml', 'Data/Core/Defs/Stats/Stats_Weapons_Ranged.xml', 'Data/Core/Defs/DamageDefs'],
    'shooterCurve': curve, 'rangeKnots': [3, 12, 25, 40], 'minimumAimChance': 0.0201,
    'weaponAccuracyDefault': 1, 'weaponAccuracyMin': 0.01, 'weaponAccuracyMax': 1,
    'damageDefs': damage,
}
target = repo / 'src/utility/data/accuracyRules.json'
target.write_text(json.dumps(rules, indent=2) + '\n', encoding='utf-8')
print(target)
