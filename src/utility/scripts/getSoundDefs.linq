<Query Kind="Program">
  <Namespace>System.Text.Json</Namespace>
  <Namespace>System.Globalization</Namespace>
  <IncludeUncapsulator>false</IncludeUncapsulator>
</Query>

void Main()
{
	SortedDictionary<string, List<string>> soundDefDictionary = new SortedDictionary<string, List<string>>();

	const string path = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\RimWorld\\Data\\Core\\Defs\\SoundDefs";
	string[] files = Directory.GetFiles(path, "*.xml", SearchOption.AllDirectories);

	foreach (var filePath in files)
	{
		XDocument doc = XDocument.Load(filePath);

		var soundDefNodes = doc.XPathSelectElements("//SoundDef");

		foreach (var soundDefNode in soundDefNodes)
		{
			string defName = soundDefNode.XPathSelectElement("defName")?.Value;

			TextInfo textInfo = new CultureInfo("en-US", false).TextInfo;
			if (defName != null)
			{
				var parts = defName.Split('_');
				if (parts.Length > 1)
				{
					string prefix = parts[0];

					if (!soundDefDictionary.ContainsKey(prefix))
					{
						soundDefDictionary[prefix] = new List<string>();
					}

					soundDefDictionary[prefix].Add(defName);
				}
			}
		}
	}

	// Serialize the dictionary to JSON and print it
	var json = JsonSerializer.Serialize(soundDefDictionary, new JsonSerializerOptions { WriteIndented = true });
	Console.WriteLine(json);
}
