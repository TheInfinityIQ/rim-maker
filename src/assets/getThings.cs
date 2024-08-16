using System.Xml;
using System.Xml.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;


List<String> values = new List<String>();

const string path = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\RimWorld\\Data\\Core";
string[] files = Directory.GetFiles(path, "*.xml", SearchOption.AllDirectories);

foreach (var filePath in files)
{
	XDocument doc = XDocument.Load(filePath);
	var desc = doc.XPathSelectElements("//defName").Select((node) => node.Value).OrderBy(value => value);
	values.AddRange(desc);
}

var json = JsonSerializer.Serialize(values);
Console.Write(json);


