import { describe, it, expect } from 'vitest';
import { createWeapon } from '../weaponTypes';
import { buildModArchive } from '../scripts/buildXML';
import { availableDefinitions, requiredExpansions, unavailableReferenceReason } from '../gameDefinitions';
import { recipeResearch, setRecipeResearch, recipeOptions } from '../recipeChoices';
describe('checkbox crafting selections', () => {
  it('offers actual worktables and research projects according to enabled packs', () => {
    expect(availableDefinitions('benches').some(b => b.defName === 'TableMachining')).toBe(true);
    expect(availableDefinitions('benches').some(b => b.defName === 'BioferriteShaper')).toBe(false);
    expect(availableDefinitions('benches', ['Anomaly']).some(b => b.defName === 'BioferriteShaper')).toBe(true);
    expect(availableDefinitions('research').some(b => b.defName === 'PrecisionRifling')).toBe(true);
  });
  it('preserves existing single/list research without a mount-time rewrite and removes duplicates on edit', () => {
    const recipe = { researchPrerequisite: 'PrecisionRifling', researchPrerequisites: ['Machining', 'PrecisionRifling'] };
    const before = JSON.stringify(recipe);
    expect(recipeResearch(recipe)).toEqual(['PrecisionRifling', 'Machining']);
    expect(JSON.stringify(recipe)).toBe(before);
    setRecipeResearch(recipe, ['Machining', 'PrecisionRifling', 'Machining']);
    expect(recipe.researchPrerequisite).toBe('Machining');
    expect(recipe.researchPrerequisites).toEqual(['PrecisionRifling']);
    setRecipeResearch(recipe, null); expect(recipeResearch(recipe)).toEqual([]);
  });
  it('keeps disabled and custom selected references visible and includes new recipe DLC dependencies', () => {
    const rows = recipeOptions('benches', ['Core'], ['BioferriteShaper', 'OtherModBench']);
    expect(rows.find(r => r.defName === 'BioferriteShaper').label).toContain('disabled DLC');
    expect(rows.find(r => r.defName === 'OtherModBench').label).toContain('custom');
    const weapon = createWeapon(); weapon.gun.recipeMaker.recipeUsers = ['BioferriteShaper'];
    expect(requiredExpansions([weapon]).map(p => p.id)).toContain('Anomaly');
    expect(unavailableReferenceReason([weapon], ['Core'])).toContain('disabled expansions');
    weapon.gun.recipeMaker.recipeUsers = ['TableMachining'];
    setRecipeResearch(weapon.gun.recipeMaker, ['BioferriteIgnition']);
    expect(requiredExpansions([weapon]).map(p => p.id)).toContain('Anomaly');
  });
  it('exports exact bench/research IDs with replacement semantics, then explicitly clears inherited research', async () => {
    const weapon = createWeapon(); weapon.gun.label = 'Recipe test';
    weapon.gun.recipeMaker.recipeUsers = ['ElectricSmithy', 'FueledSmithy'];
    setRecipeResearch(weapon.gun.recipeMaker, ['PrecisionRifling', 'Machining']);
    const before = JSON.stringify(weapon);
    async function xml() { const zip = buildModArchive([weapon], [], 'RecipeTest'); return zip.file('RecipeTest/Defs/ThingDefs/RecipeTestWeapons_Ranged.xml').async('string'); }
    const text = await xml();
    expect(text).toContain('<recipeUsers Inherit="False">');
    expect(text).toContain('<li>ElectricSmithy</li>'); expect(text).toContain('<li>FueledSmithy</li>');
    expect(text).toContain('<researchPrerequisite>PrecisionRifling</researchPrerequisite>');
    expect(text).toContain('<researchPrerequisites Inherit="False">'); expect(text).toContain('<li>Machining</li>');
    expect(JSON.stringify(weapon)).toBe(before);
    setRecipeResearch(weapon.gun.recipeMaker, []); weapon.gun.recipeMaker.recipeUsers = [];
    const cleared = await xml(); expect(cleared).toContain('<researchPrerequisite IsNull="True">');
    expect(cleared).not.toContain('<researchPrerequisite>PrecisionRifling');
  });
});
