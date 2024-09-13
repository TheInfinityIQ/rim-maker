<Query Kind="Expression">
  <Output>DataGrids</Output>
</Query>

void Main()
{
	List<ThingDef> thingDefs = new List<ThingDef>();

	const string path = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\RimWorld\\Data\\Core\\Defs\\Stats";
	string[] files = Directory.GetFiles(path, "Stats_Pawns*.xml", SearchOption.AllDirectories);

	TextInfo textInfo = new CultureInfo("en-US", false).TextInfo;

	foreach (var filePath in files)
	{
		XDocument doc = XDocument.Load(filePath);

		// Select each ThingDef node
		var thingDefsNodes = doc.XPathSelectElements("//StatDef");

		foreach (var thingDefNode in thingDefsNodes)
		{
			// Extract defName and label from the ThingDef
			string defName = thingDefNode.XPathSelectElement("defName")?.Value;
			string label = thingDefNode.XPathSelectElement("label")?.Value;
			string description = thingDefNode.XPathSelectElement("description")?.Value;

			if (defName != null)
			{
				thingDefs.Add(new ThingDef(description, textInfo.ToTitleCase(label), defName));
			}
		}
	}

	var json = JsonSerializer.Serialize(thingDefs);
	Console.Write(json);
}

public class ThingDef
{
	public string description { get; set; }
	public string label { get; set; }
	public string defName { get; set; }

	public ThingDef(string description, string label, string defName)
	{
		this.description = description;
		this.label = label;
		this.defName = defName;
	}
}