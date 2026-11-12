"""Build the portable application extract; never use valuation fields as weights."""
from pathlib import Path
import json
import hashlib

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/agent-reference/weapon-balance'
def load(name):return json.loads((SOURCE/name).read_text(encoding='utf-8'))
def digest(name):return hashlib.sha256((SOURCE/name).read_bytes()).hexdigest()
profiles={r['defName']:r for r in load('weapon-contexts.json')['profiles']}
rows=load('trend-rows.json')['rows']
effects=load('special-effect-weights.json')['groups']
items=[]
for row in rows:
    p=profiles[row['defName']];base=p['combat']['nativeBaseline'];action=next(iter(base['actions']),{})
    rates=[{k:r[k] for k in ['skill','distance','reachable','rate']} for r in p['combat']['primaryRateEstimates']
           if r['singleArmorLayerRating']==0 and r['distance'] in [3,12,25,40]]
    measured=[]
    for group in effects:
        if group['weapon']!=row['defName'] or group['variant']!='base':continue
        outcomes={k:v['mean'] for k,v in group['outcomes'].items() if k in ['primary.peakInjury','primary.stunnedTicks','primary.staggeredTicks','primary.peakTox','primary.burningTicks','primary.minimumShield','primary.deaths']}
        if outcomes:measured.append({'profile':group['profile'],'protocol':group['section'],'seeds':len(group['seeds']),
                                    'horizon':group['observedInputProperties'].get('horizon'), 'outcomes':outcomes})
    items.append({'id':row['defName'],'label':row['name'],'kind':row['kind'],'pack':row['pack'],'tech':row['techLevel'],
                  'role':row['role'],'quality':row['quality'],'stuff':row['stuff'],'range':row['range'],
                  'work':row['effectiveWork'],'mass':base['stats'].get('Mass'),'melee':row['nativeMeleePrimaryDPS'],
                  'penetration':row['nativeMeleeAP'] if row['kind']=='melee' else row['penetration'],
                  'rates':rates,'damageDef':action.get('damageDef'),'notes':p['combat']['unmodeledImportantBehavior'],
                  'ingredients':[{'id':i['id'],'count':i['count']} for i in p['economics']['fixedIngredients']],
                  'research':sorted({x for option in p['productionOptions'] for x in option['research']['directProjectRoots']}),
                  'tags':p['tagAndGenerationProfile'].get('weaponTags',[]), 'effects':measured})
assert len(items)==len({r['id'] for r in items})==67
assert sum(r['kind']=='melee' for r in items)==23
materials={}
for m in load('acquisition-weight-updates.json')['materialRegistry']:
    routes=[]
    for route in m['effortRouteOptions']:
        hours=route.get('observedJobHoursPerOutputUnit',route.get('referenceRecipeWorkHoursPerUnit'))
        if hours is not None:
            routes.append({'source':route.get('source',route.get('recipe')),'hours':hours,'kind':route['kind']})
    materials[m['id']]={'label':m['label'],'routes':routes}
data={'schemaVersion':1,'gameVersion':'1.6.4871','assemblySha256':load('continued-weight-model.json')['captures'][0]['assemblySha256'],
      'sourceHashes':{name:digest(name) for name in ['weapon-contexts.json','trend-rows.json','special-effect-weights.json','acquisition-weight-updates.json']},
      'items':items,'materials':materials,
      'rules':load('effect-mechanic-controls.json')['measuredRules']}
target=ROOT/'src/utility/data/balanceCatalog.json'
target.write_text(json.dumps(data,separators=(',',':'),allow_nan=False)+'\n',encoding='utf-8')
print(f'{len(items)} official weapons; {len(materials)} item routes; {target.stat().st_size} bytes')
