<Query Kind="Program">
  <Output>DataGrids</Output>
  <Namespace>System.Globalization</Namespace>
  <Namespace>System.Text.Json</Namespace>
  <Namespace>System.Text.Json.Serialization</Namespace>
  <Namespace>System.Xml.Schema</Namespace>
</Query>

void Main()
{
	List<SkillDef> skillDefs = new List<SkillDef>();
	
	const string path = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\RimWorld\\Data\\Core\\Defs\\SkillDefs";
	string[] files = Directory.GetFiles(path, "*.xml", SearchOption.AllDirectories);
	
	TextInfo textInfo = new CultureInfo("en-US", false).TextInfo;
	
	foreach (var filePath in files)
	{
		XDocument doc = XDocument.Load(filePath);
	
		// Select each ThingDef node
		var thingDefsNodes = doc.XPathSelectElements("//SkillDef");
		
		foreach (var thingDefNode in thingDefsNodes)
		{
			// Extract defName and label from the ThingDef
			string defName = thingDefNode.XPathSelectElement("defName")?.Value;
			string skillLabel = thingDefNode.XPathSelectElement("skillLabel")?.Value;
			string description = thingDefNode.XPathSelectElement("description")?.Value;

			if(defName != null)
			{
				skillDefs.Add(new SkillDef(description, textInfo.ToTitleCase(skillLabel), defName));
			}
		}
	}
	
	var json = JsonSerializer.Serialize(skillDefs);
	Console.Write(json);
}

public class SkillDef
{
	public string description {get; set;}
	public string skillLabel {get; set;}
	public string defName {get; set;}

	public SkillDef(string description, string label, string defName) {
		this.description = description;
		this.skillLabel = label;
		this.defName = defName;
	}
}