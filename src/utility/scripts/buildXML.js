import JSZip from 'jszip';

export default async function exportXML(weapons, sounds, modName) {
	const zip = new JSZip();

	const modFolder = zip.folder(modName);
	const aboutFolder = modFolder.folder('About');

	const defsFolder = modFolder.folder('Defs');
	const damageDefsFolder = defsFolder.folder('DamageDefs');
	const thingDefsFolder = defsFolder.folder('ThingDefs');
	const soundDefsFolder = defsFolder.folder('SoundDefs');
	const researchProjectDefsFolder = defsFolder.folder('ResearchProjectDefs'); // (stretch goal)

	const soundsFolder = modFolder.folder('Sounds').folder(modName);

	const texturesFolder = modFolder.folder('Textures').folder(modName);

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

	let weaponXMLContent = '';
	weapons.forEach((weapon) => {
		weaponXMLContent += weapon.buildXML();
	});
	thingDefsFolder.file(`${modName}Weapons_Ranged.xml`, weaponXMLContent);

	let soundXMLContent = '';
	sounds.forEach((sound) => {
		soundXMLContent += sound.buildXML();
	});
	soundDefsFolder.file(`${modName}Sounds_RangedWeapon.xml`, soundXMLContent);

	alert(soundXMLContent);
	return;

	try {
		const content = await zip.generateAsync({ type: 'blob' });

		const url = URL.createObjectURL(content);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${modName}.zip`;

		document.body.appendChild(link);
		link.click();

		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error('Error generating ZIP file:', error);
	}
}

/**
 *
 * @param {Object} obj
 * @param {string} rootElement
 * @param {string} rootElementClass
 * @returns
 */
export function thingToXML(obj, rootElement, rootElementClass = '') {
	let xml = `<${rootElement} ${rootElementClass}>\r\n`;

	for (const [key, value] of Object.entries(obj)) {
		const element = isNaN(key) ? key : 'li'; // isNaN when value is in array

		if (typeof value === 'object') {
			xml += thingToXML(value, element) + '\r\n';
		} else {
			xml += `<${element}>${value}</${element}>\r\n`;
		}
	}

	xml += `</${rootElement}>`;
	return xml;
}
