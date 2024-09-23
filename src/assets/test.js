import {
	RecipeMaker,
	Skill,
	StatBases,
	WeaponRanged,
	WeaponRangedBullet,
	WeaponRangedGun,
	Cost,
	Tool,
	Verb,
	Def,
	StatOffset,
} from '@/models/weapon';

import things from '@/utility/data/things.json';

async function getSound() {
	return await fetch('assets/test - Copy.wav').then((thing) => {
		return thing.blob();
	});
}
async function getTexture() {
	return await fetch('assets/doge.jpg').then((thing) => {
		return thing.blob();
	});
}
const soundBlob = await getSound();
const textureBlob = await getTexture();

export function getWeapons(modName) {
	const weapon = new WeaponRanged(new WeaponRangedGun(), new WeaponRangedBullet());

	const soundFile = new File([soundBlob], 'mySound.wav');
	const textureFile = new File([textureBlob], 'myTexture.jpg');

	weapon.gun.label = 'Super Soaker';
	weapon.gun.description = 'Shoot water at very high pressures';
	weapon.gun.graphicData.textureFile = textureFile;
	weapon.gun.graphicData.texturePath = `Textures/${modName}/${textureFile.name}`;

	const thing = things[0];
	weapon.gun.costList = [new Cost(new Def(thing.defName, thing.label, thing.description), '5')];

	weapon.gun.statBases = new StatBases();
	weapon.gun.statBases.accuracyLong = '0.5';
	weapon.gun.statBases.accuracyMedium = '0.6';
	weapon.gun.statBases.accuracyShort = '0.7';
	weapon.gun.statBases.accuracyTouch = '0.8';
	weapon.gun.statBases.mass = '3.5';
	weapon.gun.statBases.rangedWeapon_Cooldown = '2';
	weapon.gun.statBases.workToMake = '12000';

	weapon.gun.equippedStatOffsets = [
		new StatOffset(
			new Def(
				'MeleeArmorPenetration',
				'Melee Armor Penetration',
				'Average armor penetration of all attacks in melee combat.\\n\\nThis stat includes currently used weapon.'
			),
			0.85
		),
	];

	weapon.gun.verbs = [new Verb()];
	weapon.gun.verbs[0].soundCastFile = soundFile;
	weapon.gun.verbs[0].soundCastTailFile = soundFile;
	weapon.gun.verbs[0].soundCast = 'FakeDefName';
	weapon.gun.verbs[0].soundCastTailFile = 'FakeDefName2';

	weapon.gun.tools = [new Tool()];
	weapon.gun.tools[0].capacities = ['Stab'];
	weapon.gun.tools[0].label = 'Water Tub';
	weapon.gun.tools[0].power = '100';
	weapon.gun.tools[0].cooldownTime = '0.5';

	weapon.gun.recipeMaker = new RecipeMaker([
		new Skill(
			new Def(
				'Cooking',
				'Cooking',
				'Creating meals from raw ingredients quickly and without accidental food poisoning.'
			),
			0
		),
	]);

	return [weapon];
}
