<Query Kind="Program">
  <Output>DataGrids</Output>
  <Namespace>System.Globalization</Namespace>
  <Namespace>System.Text.Json</Namespace>
</Query>

void Main()
{
	List<BulletDef> thingDefs = new List<BulletDef>();

	const string path = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\RimWorld\\Data\\Core\\Defs\\ThingDefs_Misc\\Weapons";
	string[] files = Directory.GetFiles(path, "*.xml", SearchOption.AllDirectories);

	TextInfo textInfo = new CultureInfo("en-US", false).TextInfo;

	foreach (var filePath in files)
	{
		XDocument doc = XDocument.Load(filePath);

		// Select each ThingDef node
		IEnumerable<XElement> thingDefsNodes = doc.XPathSelectElements("//ThingDef[@ParentName='BaseBullet']");
		foreach (var thingDefNode in thingDefsNodes)
		{
			// Bullet
			string defName = thingDefNode.XPathSelectElement("defName")?.Value;
			string label = thingDefNode.XPathSelectElement("label")?.Value;

			// Projectile
			XElement projectile = thingDefNode.XPathSelectElement("projectile");
			string damageDef = projectile.XPathSelectElement("damageDef")?.Value;
			string damageAmountBase = projectile.XPathSelectElement("damageAmountBase")?.Value;
			string stoppingPower = projectile.XPathSelectElement("stoppingPower")?.Value;
			string armorPenetrationBase = projectile.XPathSelectElement("armorPenetrationBase")?.Value;
			string speed = projectile.XPathSelectElement("speed")?.Value;
			string explosionRadius = projectile.XPathSelectElement("explosionRadius")?.Value;

			// GraphicData
			XElement graphicData = thingDefNode.XPathSelectElement("graphicData");
			string texturePath = graphicData.XPathSelectElement("texPath")?.Value;
			string graphicClass = graphicData.XPathSelectElement("graphicClass")?.Value;
			string shaderType = graphicData.XPathSelectElement("shaderType")?.Value;
			string color = graphicData.XPathSelectElement("color")?.Value;
			string drawSize = graphicData.XPathSelectElement("drawSize")?.Value;

			if (defName != null)
			{
				GraphicDataDef graphicDataDef = new GraphicDataDef(texturePath, graphicClass, shaderType, color, drawSize);
				ProjectileDef projectileDef = new ProjectileDef(damageDef, damageAmountBase, stoppingPower, armorPenetrationBase, speed, explosionRadius);
				thingDefs.Add(new BulletDef(textInfo.ToTitleCase(label), defName, projectileDef, graphicDataDef));
			}
		}
	}

	var json = JsonSerializer.Serialize(thingDefs);
	Console.Write(json);
}

public class BulletDef
{
	public string label { get; set; }
	public string defName { get; set; }
	public ProjectileDef projectile { get; set; }
	public GraphicDataDef graphicData { get; set; }

	public BulletDef(string label, string defName, ProjectileDef projectile, GraphicDataDef graphicData )
	{
		this.label = label;
		this.defName = defName;
		this.projectile = projectile;
		this.graphicData = graphicData;
	}
}

public class ProjectileDef
{
	public string damageDef { get; set; }
	public string damageAmountBase { get; set; }
	public string stoppingPower { get; set; }
	public string armorPenetrationBase { get; set; }
	public string speed { get; set; }
	public string explosionRadius { get; set; }

	public ProjectileDef(string damageDef, string damageAmountBase, string stoppingPower, string armorPenetrationBase, string speed, string explosionRadius)
	{
		this.damageDef = damageDef;
		this.damageAmountBase = damageAmountBase;
		this.stoppingPower = stoppingPower;
		this.armorPenetrationBase = armorPenetrationBase;
		this.speed = speed;
		this.explosionRadius = explosionRadius;
	}
}

public class GraphicDataDef
{
	public string texPath { get; set; }
	public string graphicClass { get; set; }
	public string shaderType { get; set; }
	public string color { get; set; }
	public string drawSize { get; set; }

	public GraphicDataDef(string texPath, string graphicClass, string shaderType, string color, string drawSize)
	{
		this.texPath = texPath;
		this.graphicClass = graphicClass;
		this.shaderType = shaderType;
		this.color = color;
		this.drawSize = drawSize;
	}
}