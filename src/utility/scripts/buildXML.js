import { WeaponRanged } from '@/models/weapon';
import JSZip from 'jszip';
/**
 *
 * @param {Array<WeaponRanged>} weapons
 * @param {Array<Sound>} sounds
 * @param {string} modName
 * @returns
 */
export default async function exportXML(weapons, sounds, modName) {
	// const damageDefsFolder = defsFolder.folder('DamageDefs');
	// const researchProjectDefsFolder = defsFolder.folder('ResearchProjectDefs');

	const workingWeapons = [];
	for (const weapon of weapons) {
		workingWeapons.push(weapon.clone());
	}

	const zip = new JSZip();
	const directory = zip.folder(modName);
	const defsFolder = directory.folder('Defs');

	buildAbout(directory.folder('About'));

	addTexturesToDirectory(workingWeapons, directory.folder('Textures').folder(modName), modName);
	addSoundsToDirectory(workingWeapons, directory.folder('Sounds').folder(modName));

	buildWeaponsXML(defsFolder.folder('ThingDefs'), workingWeapons, modName);
	buildSoundsXML(defsFolder.folder('SoundDefs'), sounds, modName);

	await downloadDirectory(zip, modName);
}

/**
 *
 * @typedef {Object} Folder
 * @param {Folder} aboutFolder
 * @param {string} modName
 */
function buildAbout(aboutFolder, modName) {
	const aboutXMLContent = `
	<?xml version="1.0" encoding="utf-8"?>
	<ModMetaData>
		<packageId>AuthorName.${modName}</packageId>
		
		<name>${modName}</name>
		<author>MyAuthorName</author>
		
		<description>A description of your mod.</description>

		<supportedVersions>
			<li>1.5</li>
		</supportedVersions>
	</ModMetaData>
	`;

	`<ModMetaData>
  <name>Halo UNSC Weapon Pack</name>
  <author>TheInfinityIQ</author>
  <supportedVersions>
    <li>1.0</li>
    <li>1.1</li>
    <li>1.2</li>
    <li>1.3</li>
    <li>1.4</li>
    <li>1.5</li>
  </supportedVersions>
  <description>Halo UNSC Weapons Pack</description>
  <packageId>TheInfinityIQ.Halo.UNSC</packageId>
</ModMetaData>`;

	aboutFolder.file('About.xml', aboutXMLContent.trim());
}

/**
 *
 * @param {Array<WeaponRanged>} weapons
 * @typedef {Object} Folder
 * @param {Folder} texturesFolder
 * @param {string} modName
 */
function addTexturesToDirectory(weapons, texturesFolder, modName) {
	for (const weapon of weapons) {
		if (weapon.gun.graphicData.textureFile) {
			texturesFolder.file(
				weapon.gun.graphicData.textureFile.name,
				weapon.gun.graphicData.textureFile,
				{ binary: true }
			);
			weapon.gun.graphicData.texPath = `${modName}/${weapon.gun.graphicData.textureFile.name.replace(
				/\.[^/.]+$/,
				''
			)}`;
		}

		if (weapon.bullet.graphicData.textureFile) {
			texturesFolder.file(
				weapon.bullet.graphicData.textureFile.name,
				weapon.bullet.graphicData.textureFile,
				{ binary: true }
			);
			weapon.bullet.graphicData.texPath = `${modName}/${weapon.bullet.graphicData.textureFile.name.replace(
				/\.[^/.]+$/,
				''
			)}`;

			weapon.bullet.defName = `${modName}Bullet_${weapon.bullet.label.replace(/ /g, '')}`;
			weapon.gun.verbs[0].defaultProjectile = `${weapon.bullet.defName}`;
		}
	}
}

/**
 *
 * @param {Array<WeaponRanged>} weapons
 * @typedef {Object} Folder
 * @param {Folder} soundsFolder
 */
function addSoundsToDirectory(weapons, soundsFolder) {
	for (const weapon of weapons) {
		if (weapon.gun.verbs[0].soundCastFile) {
			soundsFolder.file(
				weapon.gun.verbs[0].soundCastFile.name,
				weapon.gun.verbs[0].soundCastFile,
				{ binary: true }
			);
		}

		if (weapon.gun.verbs[0].soundCastTailFile) {
			soundsFolder.file(
				weapon.gun.verbs[0].soundCastTailFile.name,
				weapon.gun.verbs[0].soundCastTailFile,
				{ binary: true }
			);
		}

		if (weapon.gun.soundInteractFile) {
			soundsFolder.file(weapon.gun.soundInteractFile.name, weapon.gun.soundInteractFile, {
				binary: true,
			});
			delete weapon.gun.soundInteractFile;
		}
	}
}

/**
 *
 * @typedef {Object} Folder
 * @param {Folder} thingDefsFolder
 * @param {Array<WeaponRanged>} weapons
 * @param {string} modName
 */
function buildWeaponsXML(thingDefsFolder, weapons, modName) {
	let weaponXMLContent = '<?xml version="1.0" encoding="utf-8"?>\n<Defs>';
	weapons.forEach((weapon) => {
		weaponXMLContent += weapon.buildXML();
	});
	weaponXMLContent += '\n</Defs>';

	thingDefsFolder.file(`${modName}Weapons_Ranged.xml`, weaponXMLContent);
}

/**
 *
 * @typedef {Object} Folder
 * @param {Folder} soundDefsFolder
 * @param {Array<Sound>} sounds
 * @param {string} modName
 */
function buildSoundsXML(soundDefsFolder, sounds, modName) {
	let soundXMLContent = '<?xml version="1.0" encoding="utf-8"?>\n<Defs>';
	sounds.forEach((sound) => {
		soundXMLContent += sound.buildXML();
	});
	soundXMLContent += '\n</Defs>';
	soundDefsFolder.file(`${modName}Sounds_RangedWeapon.xml`, soundXMLContent);
}

/**
 *
 * @param {JSZip} zip
 * @param {string} modName
 */
async function downloadDirectory(zip, modName) {
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
	let xml = `<${rootElement}>\n`;
	if (rootElementClass.length) {
		xml = `<${rootElement} ${rootElementClass}>\n`;
	}

	for (const [key, value] of Object.entries(obj)) {
		const element = isNaN(key) ? key : 'li'; // isNaN when value is in array

		if (
			(typeof value === 'object' && value instanceof Blob) ||
			value == undefined ||
			value == null
		) {
			continue;
		}

		if (typeof value === 'object') {
			xml += thingToXML(value, element) + '\n';
		} else {
			xml += `<${element}>${value}</${element}>\n`;
		}
	}

	xml += `</${rootElement}>`;
	return xml;
}
