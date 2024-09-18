<Query Kind="Program">
  <Namespace>System.Text.Json</Namespace>
  <IncludeUncapsulator>false</IncludeUncapsulator>
</Query>

void Main()
{
	// Dictionary to store defNames by their prefixes
	Dictionary<string, List<string>> soundDefDictionary = new Dictionary<string, List<string>>();

	// Specify the directory for SoundDefs
	const string path = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\RimWorld\\Data\\Core\\Defs\\SoundDefs";
	string[] files = Directory.GetFiles(path, "*.xml", SearchOption.AllDirectories);

	foreach (var filePath in files)
	{
		XDocument doc = XDocument.Load(filePath);

		// Select each SoundDef node
		var soundDefNodes = doc.XPathSelectElements("//SoundDef");

		foreach (var soundDefNode in soundDefNodes)
		{
			// Extract defName from each SoundDef
			string defName = soundDefNode.XPathSelectElement("defName")?.Value;

			if (defName != null)
			{
				// Split the defName at the first underscore to get the prefix
				var parts = defName.Split('_');
				if (parts.Length > 1)
				{
					string prefix = parts[0].ToLower(); // Use lowercase for consistency

					// Add the defName to the appropriate prefix group in the dictionary
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
