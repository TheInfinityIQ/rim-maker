import { GraphicData } from './weapon';
import { thingToXML } from '@/utility/scripts/buildXML';
import { toRaw } from 'vue';

/* 
<ThingDef ParentName="BaseBullet">
    <defName>VULCAN_UNSC_Bullet_40mmGrenade</defName>
    <label>40mmGrenade</label>
    
    <!--==What the projectile will look like==-->
    
    <graphicData>
        <texPath>Things/Projectile/Rocket_Big</texPath>
        <graphicClass>Graphic_Single</graphicClass>
        <shaderType>TransparentPostLight</shaderType>
    </graphicData>
    
    <thingClass>Projectile_Explosive</thingClass>
    
    <!--==How strong is the projectile==-->
    
    <projectile>
        <damageDef>Bomb</damageDef>
        <damageAmountBase>12</damageAmountBase>
        <explosionRadius>2.5</explosionRadius>
        <speed>30</speed>
    </projectile>
</ThingDef> 
*/

/**
 *************************
 * 			BULLET 		 *
 *************************
 */

export class WeaponRangedBullet {
	/**
	 *
	 * @param {string} defName
	 * @param {string} label
	 * @param {GraphicData} graphicData
	 * @param {WeaponRangedProjectile} projectile
	 */
	constructor(
		defName = '',
		label = '',
		graphicData = new GraphicData(),
		projectile = new WeaponRangedProjectile()
	) {
		/**
		 * @type {string}
		 */
		this.defName = defName;

		/**
		 * @type {string}
		 */
		this.label = label;

		/**
		 * @type {GraphicData}
		 */
		this.graphicData = graphicData;

		/**
		 * @type {WeaponRangedProjectile}
		 */
		this.projectile = projectile;
	}

	/**
	 * @returns {string}
	 */
	buildXML() {
		return thingToXML(this, 'ThingDef', `ParentName="BaseBullet"`);
	}

	addThingClass(thingClass) {
		this.thingClass = thingClass;
	}

	clone() {
		return new WeaponRangedBullet(
			this.defName,
			this.label,
			structuredClone(toRaw(this.graphicData)),
			structuredClone(toRaw(this.projectile))
		);
	}
}

export class WeaponRangedProjectile {
	/**
	 * @param {string} damageDef
	 * @param {number} damageAmountBase
	 * @param {number} stoppingPower
	 * @param {number} armorPenetrationBase
	 * @param {number} speed
	 */
	constructor(
		damageDef = 'Bullet',
		damageAmountBase = null,
		stoppingPower = null,
		armorPenetrationBase = null,
		speed = null
	) {
		/**
		 * @type {string}
		 */
		this.damageDef = damageDef;

		/**
		 * @type {number}
		 */
		this.damageAmountBase = damageAmountBase;

		/**
		 * @type {number}
		 */
		this.stoppingPower = stoppingPower;

		/**
		 * @type {number}
		 */
		this.armorPenetrationBase = armorPenetrationBase;

		/**
		 * @type {number}
		 */
		this.speed = speed;
	}
}

export class WeaponRangedProjectileBomb extends WeaponRangedProjectile {
	/**
	 * @param {string} damageDef
	 * @param {number} damageAmountBase
	 * @param {number} stoppingPower
	 * @param {number} armorPenetrationBase
	 * @param {number} speed
	 * @param {number} explosionRadius
	 */
	constructor(
		damageDef = 'Bullet',
		damageAmountBase = null,
		stoppingPower = null,
		armorPenetrationBase = null,
		speed = null,
		explosionRadius = null
	) {
		super(damageDef, damageAmountBase, stoppingPower, armorPenetrationBase, speed);

		/**
		 * @type {number}
		 */
		this.explosionRadius = explosionRadius;
	}
}
