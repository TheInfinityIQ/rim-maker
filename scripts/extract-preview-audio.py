"""Prepare only the three default reference sounds used by the weapon preview."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
LOCAL_MODULES = REPO.parent / '.rimmaker-tools' / 'python'
if LOCAL_MODULES.is_dir():
    sys.path.insert(0, str(LOCAL_MODULES))

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--game', type=Path, default=REPO.parent)
parser.add_argument('--output', type=Path, default=REPO / 'game-test-results' / 'reference-audio')
args = parser.parse_args()
try:
    import UnityPy
except ImportError as error:
    parser.error('Install UnityPy in your local Python environment before preparing preview audio: ' + str(error))

assets = args.game / 'RimWorldWin64_Data' / 'resources.assets'
environment = UnityPy.load(str(args.game / 'RimWorldWin64_Data' / 'globalgamemanagers'), str(assets))
resources = next(obj.read().m_Container for obj in environment.objects if obj.type.name == 'ResourceManager')
paths = {
    'assault-rifle-shot.wav': '/weapon/assaultrifle/',
    'assault-rifle-tail.wav': '/weapon/tails/medium/',
    'assault-rifle-interact.wav': '/ui/weaponhandling/handleweapona',
}
found = {}
for asset_path, obj in sorted(resources, key=lambda item: item[0]):
    normalized = asset_path.replace('\\', '/').lower()
    for filename, fragment in paths.items():
        if fragment in normalized and obj.type.name == 'AudioClip' and filename not in found:
            found[filename] = (asset_path, obj)
if len(found) != len(paths):
    names = [obj.read().m_Name for obj in environment.objects if obj.type.name == 'AudioClip']
    raise RuntimeError('Missing default audio paths. Candidate clip names: ' + repr([name for name in names if any(term in name.lower() for term in ('assault', 'medium', 'handleweapon'))][:40]))
args.output.mkdir(parents=True, exist_ok=True)
manifest = {}
for filename, (asset_path, obj) in found.items():
    samples = obj.read().samples
    if not samples:
        raise RuntimeError('No decoded audio for ' + asset_path)
    content = next(iter(samples.values()))
    if content[:4] != b'RIFF':
        raise RuntimeError('Expected WAV for ' + asset_path)
    (args.output / filename).write_bytes(content)
    manifest[filename] = {'source': asset_path, 'sha256': hashlib.sha256(content).hexdigest()}
(args.output / 'reference-audio.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(args.output)
