<Query Kind="Program">
  <Output>DataGrids</Output>
  <Namespace>System.Globalization</Namespace>
  <Namespace>System.Text.Json</Namespace>
</Query>

void Main()
{
	List<ToolCapacityDef> toolCapacityDefs = new List<ToolCapacityDef>();

	const string path = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\RimWorld\\Data\\Core\\Defs\\ToolCapacityDefs";
	string[] files = Directory.GetFiles(path, "*.xml", SearchOption.AllDirectories);

	TextInfo textInfo = new CultureInfo("en-US", false).TextInfo;

	foreach (var filePath in files)
	{
		XDocument doc = XDocument.Load(filePath);

		// Select each ThingDef node
		var thingDefsNodes = doc.XPathSelectElements("//ToolCapacityDef");

		foreach (var thingDefNode in thingDefsNodes)
		{
			// Extract defName and label from the ThingDef
			string defName = thingDefNode.XPathSelectElement("defName")?.Value;
			string label = thingDefNode.XPathSelectElement("label")?.Value;

			if (defName != null)
			{
				toolCapacityDefs.Add(new ToolCapacityDef(textInfo.ToTitleCase(label), defName));
			}
		}
	}

	var json = JsonSerializer.Serialize(toolCapacityDefs);
	Console.Write(json);
}

public class ToolCapacityDef
{
	public string label { get; set; }
	public string defName { get; set; }

	public ToolCapacityDef(string label, string defName)
	{
		this.label = label;
		this.defName = defName;
	}
}