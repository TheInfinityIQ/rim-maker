"""Build a small tag-to-pawn/faction index from accepted official native evidence."""
from pathlib import Path
import hashlib
import json
from collections import defaultdict

repo = Path(__file__).resolve().parents[1]
source = repo/'docs/agent-reference/weapon-balance/context-native.json'
data = json.loads(source.read_text())['data']
kinds = data['pawnKinds']
def ref(value): return (value or {}).get('def')
def pack(value): return 'Core' if value == 'ludeon.rimworld' else value.rsplit('.', 1)[-1].title()
contexts = defaultdict(set)
for fid, faction in data['factions'].items():
    if faction['isPlayer']: continue
    for target in [ref(faction['basicMemberKind'])] + [ref(v) for v in faction['fixedLeaderKinds'] or []]:
        if target: contexts[target].add(fid)
    for maker in faction['pawnGroupMakers'] or []:
        if maker['commonality'] <= 0: continue
        for role in ['options', 'traders', 'guards', 'carriers']:
            for entry in maker[role] or []:
                if entry['selectionWeight'] > 0: contexts[ref(entry['kind'])].add(fid)
tags = defaultdict(list)
for kid, kind in kinds.items():
    if not kind['toolUser'] or 'Violent' in str(kind['disabledWorkTags']): continue
    for tag in kind['weaponTags'] or []:
        tags[tag].append({'defName': kid, 'label': kind['label'], 'pack': pack(kind['pack']),
                          'defaultFaction': ref(kind['defaultFactionDef']),
                          'factions': sorted(contexts[kid])})
for weapon in data['weapons'].values():
    for tag in weapon['weaponTags'] or []: tags[tag]
result = {'schemaVersion': 1, 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'meaning': 'Tag matches only; not equipment eligibility, faction ownership or occurrence probability.',
          'factions': {fid: {'label': f['label'], 'pack': pack(f['pack'])} for fid, f in data['factions'].items() if not f['isPlayer']},
          'tags': [{'tag': tag, 'pawnKinds': sorted(rows, key=lambda r:r['defName'])} for tag, rows in sorted(tags.items())]}
out = repo/'src/utility/data/weaponTagCatalog.json'
out.write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
print(f'{len(result["tags"])} official tags indexed. {out}')
