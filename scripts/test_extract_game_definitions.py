from contextlib import contextmanager
import shutil
import uuid
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET
from extract_game_definitions import extract, merge_xml, PACKS


@contextmanager
def fixture_directory():
    base = Path(__file__).resolve().parent / '.test-data'
    root = base / str(uuid.uuid4())
    root.mkdir(parents=True)
    try:
        yield root
    finally:
        # Verify the generated cleanup target stays inside our test-only directory.
        if not root.resolve().is_relative_to(base.resolve()):
            raise ValueError('Fixture cleanup escaped the test directory')
        shutil.rmtree(root)


class DefinitionExtractionTests(unittest.TestCase):
    def test_nested_inheritance_and_explicit_list_replacement(self):
        parent = ET.fromstring('<ThingDef><projectile><speed>55</speed><damageDef>Bullet</damageDef></projectile><tags><li>old</li></tags></ThingDef>')
        child = ET.fromstring('<ThingDef><projectile><speed>70</speed></projectile><tags Inherit="False"><li>new</li></tags></ThingDef>')
        merged = merge_xml(parent, child)
        self.assertEqual(merged.findtext('projectile/speed'), '70')
        self.assertEqual(merged.findtext('projectile/damageDef'), 'Bullet')
        self.assertEqual([node.text for node in merged.findall('tags/li')], ['new'])
        self.assertEqual(parent.findtext('projectile/speed'), '55')

    def test_discovers_indirect_projectiles_outside_weapon_directories(self):
        with fixture_directory() as temp:
            root = Path(temp)
            (root / 'Version.txt').write_text('test version')
            (root / 'RimWorldWin64_Data/Managed').mkdir(parents=True)
            (root / 'RimWorldWin64_Data/Managed/Assembly-CSharp.dll').write_bytes(b'test')
            for pack in PACKS:
                directory = root / 'Data' / pack
                (directory / 'About').mkdir(parents=True)
                (directory / 'Defs').mkdir()
                (directory / 'About/About.xml').write_text(f'<ModMetaData><packageId>Ludeon.RimWorld.{pack}</packageId></ModMetaData>')
            (root / 'Data/Core/Defs/Elsewhere.xml').write_text('''<Defs>
              <ThingDef Name="Base" Abstract="True"><category>Projectile</category><thingClass>Bullet</thingClass><projectile><damageDef>Arrow</damageDef><speed>40</speed></projectile></ThingDef>
              <ThingDef Name="Intermediate" Abstract="True" ParentName="Base"><label>arrow</label></ThingDef>
              <ThingDef ParentName="Intermediate"><defName>Arrow_Test</defName></ThingDef>
              <SoundDef><defName>NoUnderscore</defName></SoundDef>
              <ThingDef Name="WorktableBase" Abstract="True"><category>Building</category><thingClass>Building_WorkTable</thingClass><graphicData><texPath>Things/Building/TestBench</texPath></graphicData></ThingDef>
              <ThingDef ParentName="WorktableBase"><defName>TestBench</defName><label>test bench</label></ThingDef>
              <ThingDef><defName>NotABench</defName><category>Building</category><thingClass>Building</thingClass></ThingDef>
              <ResearchProjectDef MayRequire="Ludeon.RimWorld.Biotech"><defName>TestResearch</defName><label>test research</label></ResearchProjectDef>
            </Defs>''')
            result = extract(root)
            bullet = result['packs']['Core']['bullets'][0]
            self.assertEqual(bullet['defName'], 'Arrow_Test')
            self.assertEqual(bullet['projectile']['damageDef'], 'Arrow')
            self.assertEqual(bullet['thingClass'], 'Bullet')
            self.assertEqual(result['packs']['Core']['sounds'][0]['defName'], 'NoUnderscore')
            benches = result['packs']['Core']['benches']
            self.assertEqual([bench['defName'] for bench in benches], ['TestBench'])
            self.assertEqual(benches[0]['graphicData']['texPath'], 'Things/Building/TestBench')
            self.assertEqual(result['packs']['Core']['research'][0]['defName'], 'TestResearch')
            self.assertEqual(result['packs']['Core']['research'][0]['requires'], ['Biotech'])


if __name__ == '__main__':
    unittest.main()
