import { availableDefinitions, definitionByName } from './gameDefinitions';
export const uniqueDefinitions = values => [...new Set((values || []).filter(v => typeof v === 'string' && v.trim()).map(v => v.trim()))];
export function recipeResearch(recipe) {
  return uniqueDefinitions([recipe.researchPrerequisite, ...(recipe.researchPrerequisites || [])]);
}
export function setRecipeResearch(recipe, values) {
  const selected = uniqueDefinitions(values);
  recipe.researchPrerequisite = selected[0] || null;
  recipe.researchPrerequisites = selected.slice(1);
}
export function recipeOptions(kind, enabled, selected) {
  const options = availableDefinitions(kind, enabled), ids = new Set(options.map(r => r.defName));
  for (const id of uniqueDefinitions(selected)) if (!ids.has(id)) {
    const existing = definitionByName(kind, id);
    options.push(existing ? { ...existing, label: `${existing.label} (disabled DLC)` } : { defName: id, label: `${id} (custom reference)`, pack: 'Custom' });
  }
  return options;
}
export function recipeForExport(recipe) {
  const research = recipeResearch(recipe);
  return { ...recipe,
    recipeUsers: { '@Inherit': 'False', ...uniqueDefinitions(recipe.recipeUsers || []) },
    researchPrerequisite: research[0] || { '@IsNull': 'True' },
    researchPrerequisites: { '@Inherit': 'False', ...research.slice(1) },
  };
}
