import { WeaponRanged } from '@/models/weapon';
import JSZip from 'jszip';
import { requiredExpansions } from '@/utility/gameDefinitions';
import { weaponDefName } from '@/utility/definitionNames';
import { syncProjectileVerb } from '@/utility/projectileRules';
import { Sound } from '@/models/sound';
/**
 *
 * @param {Array<WeaponRanged>} weapons
 * @param {Array<Sound>} sounds
 * @param {string} modName
 * @returns
 */
export default async function exportXML(weapons, sounds, modName) {
	const zip = buildModArchive(weapons, sounds, modName);
	await downloadDirectory(zip, modName);
}

export function buildModArchive(weapons, sounds, modName) {
	// const damageDefsFolder = defsFolder.folder('DamageDefs');
	// const researchProjectDefsFolder = defsFolder.folder('ResearchProjectDefs');

	const workingWeapons = [];
	for (const weapon of weapons) {
		workingWeapons.push(weapon.clone());
	}

	const zip = new JSZip();
	const directory = zip.folder(modName);
	const defsFolder = directory.folder('Defs');

	buildAbout(directory.folder('About'), modName, requiredExpansions(weapons));

	const names = new Set();
	workingWeapons.forEach((weapon) => {
		weapon.gun.defName = weaponDefName(modName, weapon.gun.label);
		if (names.has(weapon.gun.defName)) throw new Error('Weapon names produce duplicate definition IDs.');
		names.add(weapon.gun.defName);
		syncProjectileVerb(weapon);
		if (weapon.projectileMode === 'custom') {
			weapon.bullet.defName = `${weapon.gun.defName}_Projectile`;
			weapon.bullet.label ||= `${weapon.gun.label} projectile`;
			weapon.gun.verbs[0].defaultProjectile = weapon.bullet.defName;
		}
	});
	addTexturesToDirectory(workingWeapons, directory.folder('Textures').folder(modName), modName);
	const generatedSounds = addSoundsToDirectory(workingWeapons, directory.folder('Sounds').folder(modName), modName);

	buildWeaponsXML(defsFolder.folder('ThingDefs'), workingWeapons, modName);
	buildSoundsXML(defsFolder.folder('SoundDefs'), [...sounds, ...generatedSounds], modName);

	return zip;
}

/**
 *
 * @typedef {Object} Folder
 * @param {Folder} aboutFolder
 * @param {string} modName
 */
function buildAbout(aboutFolder, modName, expansions = []) {
	const aboutXMLContent = `
	<?xml version="1.0" encoding="utf-8"?>
	<ModMetaData>
		<packageId>AuthorName.${modName}</packageId>
		
		<name>${modName}</name>
		<author>MyAuthorName</author>
		
		<description>A description of your mod.</description>

		<supportedVersions>
			<li>1.6</li>
		</supportedVersions>
		${expansions.length ? `<modDependencies>${expansions.map(pack => `<li><packageId>${pack.packageId}</packageId><displayName>${pack.id}</displayName></li>`).join('')}</modDependencies><loadAfter>${expansions.map(pack => `<li>${pack.packageId}</li>`).join('')}</loadAfter>` : ''}
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
		for (const [role, graphic] of [['weapon', weapon.gun.graphicData], ['projectile', weapon.projectileMode === 'custom' ? weapon.bullet.graphicData : null]]) {
			if (!graphic?.textureFile) continue;
			const filename = `${weapon.gun.defName}/${role}/${safeFilename(graphic.textureFile.name)}`;
			texturesFolder.file(filename, graphic.textureFile, { binary: true });
			graphic.texPath = `${modName}/${filename.replace(/\.[^/.]+$/, '')}`;
		}
	}
}
const safeFilename = name => name.replace(/[^A-Za-z0-9_.-]/g, '_');

/**
 *
 * @param {Array<WeaponRanged>} weapons
 * @typedef {Object} Folder
 * @param {Folder} soundsFolder
 */
function addSoundsToDirectory(weapons, soundsFolder, modName) {
	const definitions = [];
	for (const weapon of weapons) {
		const verb = weapon.gun.verbs[0];
		for (const [owner, property, fileProperty, role, tail] of [[weapon.gun, 'soundInteract', 'soundInteractFile', 'Interact', false], [verb, 'soundCast', 'soundCastFile', 'Shot', false], [verb, 'soundCastTail', 'soundCastTailFile', 'Tail', true]]) {
			const file = owner?.[fileProperty]; if (!file) continue;
			const filename = `${weapon.gun.defName}/${role}/${safeFilename(file.name)}`;
			soundsFolder.file(filename, file, { binary: true });
			owner[property] = `${weapon.gun.defName}_${role}`;
			definitions.push(new Sound(owner[property], `${modName}/${filename.replace(/\.[^/.]+$/, '')}`, tail));
		}
	}
	return definitions;
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
		throw error;
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
	const attributes = Object.entries(obj).filter(([key]) => key.startsWith('@')).map(([key, value]) => `${key.slice(1)}="${escapeXML(value)}"`).join(' ');
	rootElementClass = [rootElementClass, attributes].filter(Boolean).join(' ');
	let xml = `<${rootElement}>\n`;
	if (rootElementClass.length) {
		xml = `<${rootElement} ${rootElementClass}>\n`;
	}

	for (const [key, value] of Object.entries(obj)) {
		if (key.startsWith('@')) continue;
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
			xml += `<${element}>${escapeXML(value)}</${element}>\n`;
		}
	}

	xml += `</${rootElement}>`;
	return xml;
}

function escapeXML(value) {
	return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
