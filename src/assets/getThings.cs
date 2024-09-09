using System.Xml;
using System.Xml.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;

void Main()
{
	Dictionary <string, ThingDef> thingDefs = new Dictionary<string, ThingDef>();
	
	const string path = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\RimWorld\\Data\\Core\\Defs\\ThingDefs_Items";
	string[] files = Directory.GetFiles(path, "*.xml", SearchOption.AllDirectories);
	
	TextInfo textInfo = new CultureInfo("en-US", false).TextInfo;
	
	foreach (var filePath in files)
	{
		XDocument doc = XDocument.Load(filePath);
	
		// Select each ThingDef node
		var thingDefsNodes = doc.XPathSelectElements("//ThingDef");
		
		foreach (var thingDefNode in thingDefsNodes)
		{
			// Extract defName and label from the ThingDef
			string defName = thingDefNode.XPathSelectElement("defName")?.Value;
			string label = thingDefNode.XPathSelectElement("label")?.Value;
			string description = thingDefNode.XPathSelectElement("description")?.Value;

			if(label != null && !thingDefs.ContainsKey(textInfo.ToTitleCase(label)))
			{
				thingDefs.Add(textInfo.ToTitleCase(label), new ThingDef(description, textInfo.ToTitleCase(label), defName));

			}
			
		}
	}
	
	var json = JsonSerializer.Serialize(thingDefs);
	Console.Write(json);
}

public class ThingDef
{
	public string description {get; set;}
	public string label {get; set;}
	public string defName {get; set;}

	public ThingDef(string description, string label, string defName) {
		this.description = description;
		this.label = label;
		this.defName = defName;
	}
}