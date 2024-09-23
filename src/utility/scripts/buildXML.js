import { WeaponRanged } from '@/models/weapon';
import JSZip from 'jszip';

/**
 *
 * @param {WeaponRanged[]} weapons
 * @param {*} sounds
 * @param {string} modName
 * @returns
 */
export default async function exportXML(weapons, sounds, modName) {
	const zip = new JSZip();

	const modFolder = zip.folder(modName);
	const aboutFolder = modFolder.folder('About');

	const defsFolder = modFolder.folder('Defs');
	const damageDefsFolder = defsFolder.folder('DamageDefs');
	const thingDefsFolder = defsFolder.folder('ThingDefs');
	const soundDefsFolder = defsFolder.folder('SoundDefs');
	const researchProjectDefsFolder = defsFolder.folder('ResearchProjectDefs');

	const soundsFolder = modFolder.folder('Sounds').folder(modName);
	const texturesFolder = modFolder.folder('Textures').folder(modName);

	const aboutXMLContent = `
	<?xml version="1.0" encoding="utf-8"?>
	<ModMetaData>
	  <name>${modName}</name>
	  <author>Your Name</author>
	  <description>A description of your mod.</description>
	  <supportedVersions>
		<li>1.5.0</li>
	  </supportedVersions>
	</ModMetaData>
	`;
	aboutFolder.file('About.xml', aboutXMLContent.trim());

	for (const weapon of weapons) {
		if (weapon.gun.graphicData.textureFile) {
			texturesFolder.file(
				weapon.gun.graphicData.textureFile.name,
				weapon.gun.graphicData.textureFile
			);
			weapon.gun.graphicData.texturePath = `Things/${modName}/${weapon.gun.graphicData.textureFile.name}`;
		}

		if (weapon.gun.verbs[0].soundCastFile) {
			soundsFolder.file(
				weapon.gun.verbs[0].soundCastFile.name,
				weapon.gun.verbs[0].soundCastFile
			);
		}

		if (weapon.gun.verbs[0].soundCastTailFile) {
			soundsFolder.file(
				weapon.gun.verbs[0].soundCastTailFile.name,
				weapon.gun.verbs[0].soundCastTailFile
			);
		}

		if (weapon.bullet.graphicData.textureFile) {
			texturesFolder.file(
				weapon.bullet.graphicData.textureFile.name,
				weapon.bullet.graphicData.textureFile
			);
			weapon.bullet.graphicData.texturePath = `Things/${modName}/${weapon.bullet.graphicData.textureFile.name}`;
		}
	}

	let weaponXMLContent = '<?xml version="1.0" encoding="utf-8"?>\n<Defs>';
	weapons.forEach((weapon) => {
		weaponXMLContent += weapon.buildXML();
	});
	weaponXMLContent += '\n</Defs>';
	thingDefsFolder.file(`${modName}Weapons_Ranged.xml`, weaponXMLContent);

	let soundXMLContent = '<?xml version="1.0" encoding="utf-8"?>\n<Defs>';
	sounds.forEach((sound) => {
		soundXMLContent += sound.buildXML();
	});
	soundXMLContent += '\n</Defs>';
	soundDefsFolder.file(`${modName}Sounds_RangedWeapon.xml`, soundXMLContent);

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

		if ((typeof value === 'object' && value instanceof Blob) || !value) {
			continue;
		}

		if (typeof value === 'object') {
			xml += thingToXML(value, element) + '\r\n';
		} else {
			xml += `<${element}>${value}</${element}>\r\n`;
		}
	}

	xml += `</${rootElement}>`;
	return xml;
}
