import {
	StatBases,
	WeaponRanged,
	WeaponRangedBullet,
	WeaponRangedGun,
	Tool,
} from '@/models/weapon';

import things from '@/utility/data/things.json';
import skills from '@/utility/data/skills.json';
import stats from '@/utility/data/stats.json';

async function getSound() {
	return await fetch('src/assets/shoot.wav').then((thing) => {
		return thing.blob();
	});
}

async function getSoundTail() {
	return await fetch('src/assets/tail.wav').then((thing) => {
		return thing.blob();
	});
}

async function getTexture() {
	return await fetch('src/assets/doge.jpg').then((thing) => {
		return thing.blob();
	});
}
const soundBlob = await getSound();
const soundTailBlob = await getSoundTail();
const textureBlob = await getTexture();

export function getWeapons(modName) {
	const weapon = new WeaponRanged(new WeaponRangedGun(), new WeaponRangedBullet());

	const soundFile = new File([soundBlob], 'mySound.wav');
	const soundTailFile = new File([soundTailBlob], 'mySoundTail.wav');
	const textureFile = new File([textureBlob], 'myTexture.jpg');

	weapon.gun.label = 'Super Soaker';
	weapon.gun.defName = `${modName}_Gun_${weapon.gun.label.replace(/ /g, '')}`;

	weapon.gun.description = 'Shoot water at very high pressures';
	weapon.gun.graphicData.textureFile = textureFile;
	weapon.gun.graphicData.texPath = `Textures/${modName}/${textureFile.name.replace(/ /g, '')}`;

	const thing = things[0];
	weapon.gun.costList[0] = { defName: thing.defName, value: 5 };

	weapon.gun.statBases = new StatBases();
	weapon.gun.statBases.AccuracyLong = '0.5';
	weapon.gun.statBases.AccuracyMedium = '0.6';
	weapon.gun.statBases.AccuracyShort = '0.7';
	weapon.gun.statBases.AccuracyTouch = '0.8';
	weapon.gun.statBases.Mass = '3.5';
	weapon.gun.statBases.RangedWeapon_Cooldown = '2';
	weapon.gun.statBases.WorkToMake = '12000';

	const stat = stats[0];
	weapon.gun.equippedStatOffsets[0] = { defName: stat.defName, value: 0.75 };

	weapon.gun.verbs[0].soundCastFile = soundFile;
	weapon.gun.verbs[0].soundCastTailFile = soundTailFile;
	weapon.gun.verbs[0].soundCast = 'FakeDefName';
	weapon.gun.verbs[0].soundCastTail = 'FakeDefName2';
	weapon.gun.verbs[0].burstShotCount = 3;
	weapon.gun.verbs[0].range = 10;
	weapon.gun.verbs[0].warmupTime = 1.5;

	weapon.gun.tools = [new Tool()];
	weapon.gun.tools[0].capacities = ['Stab'];
	weapon.gun.tools[0].label = 'Water Tub';
	weapon.gun.tools[0].power = '100';
	weapon.gun.tools[0].cooldownTime = '0.5';

	const skill = skills[0];
	weapon.gun.recipeMaker.skillRequirements[0] = { defName: skill.defName, value: 10 };

	return [weapon];
}
