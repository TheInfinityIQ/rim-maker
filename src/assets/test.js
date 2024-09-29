import { StatBases, WeaponRanged, WeaponRangedGun, Tool, GraphicData } from '@/models/weapon';
import { WeaponRangedBullet, WeaponRangedProjectileBomb } from '@/models/projectile';

import things from '@/utility/data/things.json';
import skills from '@/utility/data/skills.json';
import stats from '@/utility/data/stats.json';

async function getShotSound() {
	return await fetch('src/assets/space_weapon/lazer_shot_1.wav').then((thing) => {
		return thing.blob();
	});
}

async function getInteractSound() {
	return await fetch('src/assets/space_weapon/interact_1.wav').then((thing) => {
		return thing.blob();
	});
}

async function getShotTailSound() {
	return await fetch('src/assets/tail.wav').then((thing) => {
		return thing.blob();
	});
}

async function getProjectileTexture() {
	return await fetch('src/assets/space_weapon/lazer_projectile.png').then((thing) => {
		return thing.blob();
	});
}

async function getGunTexture() {
	return await fetch('src/assets/space_weapon/assault_rifle.png').then((thing) => {
		return thing.blob();
	});
}

async function getGhostGunTexture() {
	return await fetch('src/assets/space_weapon/ghost_rifle.png').then((thing) => {
		return thing.blob();
	});
}

const soundBlob = await getShotSound();
const soundTailBlob = await getShotTailSound();
const projectileTextureBlob = await getProjectileTexture();
const gunTextureBlob = await getGunTexture();
const gunGhostTextureBlob = await getGhostGunTexture();
const gunInteractSoundBlob = await getInteractSound();

export function getWeapons(modName) {
	const weapons = [createBulletProjectileWeapon(modName)];
	weapons.push(createBombProjectileWeapon(modName));

	return weapons;
}

function createBulletProjectileWeapon(modName) {
	const weapon = new WeaponRanged(new WeaponRangedGun(), new WeaponRangedBullet());

	const soundFile = new File([soundBlob], 'mySound.wav');
	const soundTailFile = new File([soundTailBlob], 'mySoundTail.wav');
	const gunInteractFile = new File([gunInteractSoundBlob], 'mySoundInteract.wav');
	const gunTextureFile = new File([gunTextureBlob], 'myGunTexture.png');
	const projectileTextureFile = new File([projectileTextureBlob], 'myProjectileTexture.png');

	weapon.gun.label = 'Super Soaker';
	weapon.gun.defName = `${modName}_Gun_${weapon.gun.label.replace(/ /g, '')}`;

	weapon.gun.soundInteractFile = gunInteractFile;

	weapon.gun.description = 'Shoot water at very high pressures';
	weapon.gun.graphicData.textureFile = gunTextureFile;
	weapon.gun.graphicData.texPath = `Textures/${modName}/${gunTextureFile.name.replace(/ /g, '')}`;

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

	weapon.bullet.projectile.armorPenetrationBase = '0.14';
	weapon.bullet.projectile.damageAmountBase = '18';
	weapon.bullet.projectile.damageDef = 'Bullet';
	weapon.bullet.projectile.speed = '55';
	weapon.bullet.projectile.stoppingPower = '3';

	weapon.bullet.graphicData.texPath = `Textures/${modName}/${projectileTextureFile.name.replace(
		/ /g,
		''
	)}`;
	weapon.bullet.graphicData.textureFile = projectileTextureFile;
	weapon.bullet.label = 'Soaker shot';

	return weapon;
}

function createBombProjectileWeapon(modName) {
	const weapon = new WeaponRanged(
		new WeaponRangedGun(),
		new WeaponRangedBullet('', '', new GraphicData(), new WeaponRangedProjectileBomb())
	);
	weapon.bullet.addThingClass('Projectile_Explosive');

	const soundFile = new File([soundBlob], 'mySound.wav');
	const soundTailFile = new File([soundTailBlob], 'mySoundTail.wav');
	const gunInteractFile = new File([gunInteractSoundBlob], 'mySoundInteract.wav');
	const gunGhostTextureFile = new File([gunGhostTextureBlob], 'myGhostGunTexture.png');
	const projectileTextureFile = new File([projectileTextureBlob], 'myProjectileTexture.png');

	weapon.gun.label = 'Super BOMB Soaker';
	weapon.gun.defName = `${modName}_Gun_${weapon.gun.label.replace(/ /g, '')}`;
	weapon.gun.soundInteractFile = gunInteractFile;

	weapon.gun.description = 'Shoot water at very high pressures';
	weapon.gun.graphicData.textureFile = gunGhostTextureFile;
	weapon.gun.graphicData.texPath = `Textures/${modName}/${gunGhostTextureFile.name.replace(
		/ /g,
		''
	)}`;

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
	weapon.gun.verbs[0].forcedMissRadius = 2;

	weapon.gun.tools = [new Tool()];
	weapon.gun.tools[0].capacities = ['Stab'];
	weapon.gun.tools[0].label = 'Water Tub';
	weapon.gun.tools[0].power = '100';
	weapon.gun.tools[0].cooldownTime = '0.5';

	const skill = skills[0];
	weapon.gun.recipeMaker.skillRequirements[0] = { defName: skill.defName, value: 10 };

	weapon.bullet.projectile.armorPenetrationBase = '0.14';
	weapon.bullet.projectile.damageAmountBase = '18';
	weapon.bullet.projectile.damageDef = 'Bullet';
	weapon.bullet.projectile.speed = '55';
	weapon.bullet.projectile.stoppingPower = '3';
	weapon.bullet.projectile.explosionRadius = '2.5';

	weapon.bullet.graphicData.texPath = `Textures/${modName}/${projectileTextureFile.name.replace(
		/ /g,
		''
	)}`;
	weapon.bullet.graphicData.textureFile = projectileTextureFile;
	weapon.bullet.label = 'Soaker Bomb';
	weapon.bullet.projectile.damageDef = 'Bomb';

	return weapon;
}
