import { thingToXML } from '@/assets/buildXML';

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
		projectile = new WeaponRangedGun()
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
		let xml = `<ThingDef ParentName="BaseBullet">\r\n`;
		xml += thingToXML(obj, 'ThingDef');
		xml += `</ThingDef>`;

		return xml;
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
		damageAmountBase = undefined,
		stoppingPower = undefined,
		armorPenetrationBase = undefined,
		speed = undefined
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

export class WeaponRangedGun {
	/**
	 * @param {string} label
	 * @param {string} description
	 * @param {GraphicData} graphicData
	 * @param {Cost[]} costList
	 * @param {StatBase} statBase
	 * @param {StatOffset[]} equippedStatOffsets
	 * @param {Verb[]} verbs
	 * @param {Tool[]} tools
	 * @param {RecipeMaker} recipeMaker
	 * @param {WeaponRangedBullet} bullet
	 */
	constructor(
		label = '',
		description = '',
		graphicData = new GraphicData(),
		costList = [],
		statBase = new StatBase(),
		equippedStatOffsets = [],
		verbs = [],
		tools = [],
		recipeMaker = new RecipeMaker()
	) {
		/**
		 * @type {string}
		 */
		this.label = label;
		/**
		 * @type {string}
		 */
		this.description = description;
		/**
		 * @type {GraphicData}
		 */
		this.graphicData = graphicData;
		/**
		 * @type {Cost[]}
		 */
		this.costList = costList;
		/**
		 * @type {StatBase}
		 */
		this.statBase = statBase;
		/**
		 * @type {Skill[]}
		 */
		this.equippedStatOffsets = equippedStatOffsets;
		/**
		 * @type {Verb[]}
		 */
		this.verbs = verbs;
		/**
		 * @type {Tool[]}
		 */
		this.tools = tools;
		/**
		 * @type {RecipeMaker}
		 */
		this.recipeMaker = recipeMaker;
	}

	/**
	 * @returns {string}
	 */
	buildXML() {
		let xml = `<ThingDef ParentName="Base">\r\n`;

		xml += `<ThingDef ParentName="BaseHumanMakeableGun">\r\n`;
		xml += thingToXML(this, 'ThingDef');
		xml += `</ThingDef>`;

		return xml;
	}
}

export class Tool {
	/**
	 *
	 * @param {string} label
	 * @param {string[]} capacities
	 * @param {number} power
	 * @param {number} cooldownTime
	 */
	constructor(label = '', capacities = [], power = undefined, cooldownTime = undefined) {
		/**
		 * @type {string}
		 */
		this.label = label;

		/**
		 * @type {string[]}
		 */
		this.capacities = capacities;

		/**
		 * @type {number}
		 */
		this.cooldownTime = cooldownTime;

		/**
		 * @type {number}
		 */
		this.power = power;
	}
}

export class StatBase {
	/**
	 *
	 * @param {number} workToMake
	 * @param {number} mass
	 * @param {number} accuracyTouch
	 * @param {number} accuracyShort
	 * @param {number} accuracyMedium
	 * @param {number} accuracyLong
	 * @param {number} rangedWeapon_Cooldown
	 */
	constructor(
		workToMake = undefined,
		mass = undefined,
		accuracyTouch = undefined,
		accuracyShort = undefined,
		accuracyMedium = undefined,
		accuracyLong = undefined,
		rangedWeapon_Cooldown = undefined
	) {
		/**
		 * @type {number}
		 */
		this.workToMake = workToMake;

		/**
		 * @type {number}
		 */
		this.mass = mass;

		/**
		 * @type {number}
		 */
		this.accuracyTouch = accuracyTouch;

		/**
		 * @type {number}
		 */
		this.accuracyShort = accuracyShort;

		/**
		 * @type {number}
		 */
		this.accuracyMedium = accuracyMedium;

		/**
		 * @type {number}
		 */
		this.accuracyLong = accuracyLong;

		/**
		 * @type {number}
		 */
		this.rangedWeapon_Cooldown = rangedWeapon_Cooldown;

		/**
		 * @type {number}
		 */
	}
}

export class GraphicData {
	/**
	 * @param {string} texturePath
	 * @param {string} graphicClass
	 *
	 */
	constructor(texturePath = '', graphicClass = 'Graphic_Single') {
		/**
		 * @type {string}
		 */
		this.texturePath = texturePath;

		/**
		 * @type {string}
		 */
		this.graphicClass = graphicClass;
	}
}

export class RecipeMaker {
	/**
	 * @param {Skill[]} skillRequirements
	 */
	constructor(skillRequirements = []) {
		/**
		 * @type {Skill[]}
		 */
		this.skillRequirements = skillRequirements;
	}
}

export class Skill {
	/**
	 * @param {Def} def
	 * @param {number} amount - Number between 0 and 20 (inclusive) representing Pawns strength in associated Skill
	 */
	constructor(def, amount) {
		/**
		 * @type {Def}
		 */
		this.def = def;

		if (amount < 0) {
			amount = 0;
		} else if (amount > 20) {
			amount = 20;
		}

		/**
		 * @type {number} - Number between 0 and 20 (inclusive) representing Pawns strength in associated Skill
		 */
		this.amount = Math.floor(amount);
	}
}

export class Cost {
	/**
	 * @param {Def} def
	 * @param {number} amount - Total quantity of each Def
	 */
	constructor(def, amount) {
		/**
		 * @type {Def}
		 */
		this.def = def;

		/**
		 * @type {number} - Total quantity of each Def
		 */
		this.amount = Math.floor(amount);
	}
}

export class StatOffset {
	/**
	 * @param {Def} def
	 * @param {number} offset - Decimal representing percentage to offset stat
	 */
	constructor(def, offset) {
		/**
		 * @type {Def}
		 */
		this.def = def;

		/**
		 * @type {number} - Decimal representing percentage to offset stat
		 */
		this.offset = offset;
	}
}

export class Def {
	/**
	 * @param {string} defName
	 * @param {string} label
	 * @param {string} description
	 */
	constructor(defName, label, description) {
		/**
		 * @type {string}
		 */
		this.defName = defName;

		/**
		 * @type {string}
		 */
		this.label = label;

		/**
		 * @type {string}
		 */
		this.description = description;
	}
}
