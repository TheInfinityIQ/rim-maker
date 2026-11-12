using System;
using System.IO;
using System.Linq;
using System.Xml.Linq;
using Verse;
namespace RimMaker.ResourceIcons {
 public static class RecipeChoicesChecks {
  public static void Verify(string output) {
   string file=Path.Combine(output,"recipe-checks.xml");if(!File.Exists(file))return;
   var result=new XElement("recipeChecks");
   foreach(var plan in XDocument.Load(file).Root.Elements("weapon")) {
    string id=(string)plan.Attribute("id");var def=ThingDef.Named(id);var maker=def.recipeMaker;
    var benches=(maker.recipeUsers??new System.Collections.Generic.List<ThingDef>()).Select(d=>d.defName).OrderBy(s=>s).ToArray();
    var projects=(maker.researchPrerequisites??new System.Collections.Generic.List<ResearchProjectDef>()).Select(d=>d.defName).Concat(maker.researchPrerequisite==null?new string[0]:new[]{maker.researchPrerequisite.defName}).OrderBy(s=>s).ToArray();
    var expectedBenches=plan.Elements("bench").Select(e=>(string)e).OrderBy(s=>s).ToArray();var expectedProjects=plan.Elements("research").Select(e=>(string)e).OrderBy(s=>s).ToArray();
    if(!benches.SequenceEqual(expectedBenches)||!projects.SequenceEqual(expectedProjects))throw new InvalidOperationException("Recipe selections changed on native load: "+id);
    var recipe=DefDatabase<RecipeDef>.AllDefsListForReading.FirstOrDefault(r=>r.products!=null&&r.products.Any(p=>p.thingDef==def));
    if(recipe==null)throw new InvalidOperationException("No generated recipe: "+id);
    var actual=(recipe.researchPrerequisites??new System.Collections.Generic.List<ResearchProjectDef>()).Select(d=>d.defName).Concat(recipe.researchPrerequisite==null?new string[0]:new[]{recipe.researchPrerequisite.defName}).OrderBy(s=>s).ToArray();
    if(!actual.SequenceEqual(expectedProjects))throw new InvalidOperationException("Generated recipe lost research: "+id);
    foreach(string bench in benches)if(!ThingDef.Named(bench).AllRecipes.Contains(recipe))throw new InvalidOperationException("Bench does not offer generated recipe: "+bench);
    result.Add(new XElement("case",new XAttribute("id",id),new XAttribute("benches",benches.Length),new XAttribute("research",projects.Length),new XAttribute("passed",true)));
   }
   new XDocument(result).Save(Path.Combine(output,"recipe-check-results.xml"));
  }
 }
}
