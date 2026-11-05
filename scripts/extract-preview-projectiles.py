"""Extract stock projectile textures referenced by the catalog for the firing preview."""
import hashlib
import json
import sys
from pathlib import Path

repo = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(repo.parent / '.rimmaker-tools/python'))
import UnityPy

game = repo.parent
environment = UnityPy.load(str(game / 'RimWorldWin64_Data/globalgamemanagers'), str(game / 'RimWorldWin64_Data/resources.assets'))
resources = next(obj.read().m_Container for obj in environment.objects if obj.type.name == 'ResourceManager')
catalog = json.loads((repo / 'src/utility/data/gameDefinitions.json').read_text(encoding='utf-8'))
paths = {bullet['graphicData']['texPath'] for pack in catalog['packs'].values() for bullet in pack['bullets'] if bullet.get('graphicData', {}).get('texPath')}
output = repo / 'public/previews/projectiles'
output.mkdir(parents=True, exist_ok=True)
manifest = {}
for asset_path, obj in resources:
    if obj.m_PathID == 0 or obj.type.name != 'Texture2D':
        continue
    normalized = asset_path.replace('\\', '/').lower()
    for tex_path in paths:
        if normalized == 'textures/' + tex_path.lower():
            filename = hashlib.sha256(tex_path.encode()).hexdigest()[:12] + '.png'
            obj.read().image.save(output / filename)
            manifest[tex_path] = {'file': filename, 'source': asset_path}
(repo / 'src/components/weapon-preview/projectile-textures.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
if 'Things/Projectile/Bullet_Small' not in manifest:
    raise RuntimeError('Default bullet texture was not found in the installed game.')
print('Extracted', len(manifest), 'projectile textures.')
