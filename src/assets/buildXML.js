import JSZip from 'jszip';

export default async function exportXML(weapons, modName) {
	const zip = new JSZip();

	// Create the root mod folder
	const modFolder = zip.folder(modName);
	const aboutFolder = modFolder.folder('About');

	const defsFolder = modFolder.folder('Defs');
	const thingDefsFolder = defsFolder.folder('ThingDefs');
	const soundDefsFolder = defsFolder.folder('SoundDefs');
	const researchProjectDefsFolder = defsFolder.folder('ResearchProjectDefs');

	// 1. Create About.xml and add it to the About folder
	const aboutXMLContent = `
	<?xml version="1.0" encoding="utf-8"?>
	<ModMetaData>
	  <name>${modName}</name>
	  <author>Your Name</author>
	  <description>A description of your mod.</description>
	  <supportedVersions>
		<li>1.3.0</li>
	  </supportedVersions>
	</ModMetaData>
	`;
	aboutFolder.file('About.xml', aboutXMLContent.trim());

	// 2. Generate weapon XML files and add them to ThingDefs
	weapons.forEach((weapon, index) => {
		const weaponXMLContent = objectToXML(weapon, 'ThingDef');
		thingDefsFolder.file(`Weapon${index + 1}.xml`, weaponXMLContent);
	});

	// 3. Generate the ZIP file and trigger the download
	try {
		const content = await zip.generateAsync({ type: 'blob' });

		const url = URL.createObjectURL(content);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${modName}.zip`;

		document.body.appendChild(link);
		link.click();

		// Clean up
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error('Error generating ZIP file:', error);
	}
}

function objectToXML(obj, rootElement) {
	let xml = `<${rootElement}>\r\n`;

	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'object') {
			xml += objectToXML(value, key) + '\r\n';
		} else {
			xml += `<${key}>${value}</${key}>\r\n`;
		}
	}

	xml += `</${rootElement}>`;
	return xml;
}
