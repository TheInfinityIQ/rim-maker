import { thingToXML } from '@/utility/scripts/buildXML';

export class WeaponRanged {
	/**
	 * Creates an instance of WeaponRanged.
	 *
	 * @param {WeaponRangedGun} [gun=new WeaponRangedGun()]
	 * @param {WeaponRangedBullet} [bullet=new WeaponRangedBullet()]
	 */
	constructor(gun = new WeaponRangedGun(), bullet = new WeaponRangedBullet()) {
		/**
		 * @type {WeaponRangedGun}
		 */
		this.gun = gun;

		/**
		 * @type {WeaponRangedBullet}
		 */
		this.bullet = bullet;
	}

	/**
	 * @returns {string}
	 */
	buildXML() {
		let xml = `<!-- ${this.gun.label.toUpperCase()} -->
`;
		xml += `<!-- BULLET -->\r\n`;
		xml += this.bullet.buildXML();
		xml += `\r\n`;
		xml += `<!-- GUN -->\r\n`;
		xml += this.gun.buildXML();

		return xml;
	}
}

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

/**
 *************************
 * 			GUN 		 *
 *************************
 */

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
		costList = [new Cost()],
		statBase = new StatBase(),
		equippedStatOffsets = [new Skill()],
		verbs = [new Verb()],
		tools = [new Tool()],
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
		return thingToXML(this, 'ThingDef', `ParentName="BaseHumanMakeableGun"`);
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

export class Verb {
	/**
	 *
	 * @param {string} verbClass
	 * @param {Boolean} hasStandardCommand
	 * @param {string} defaultProjectile
	 * @param {number} warmupTime
	 * @param {number} range
	 * @param {number} burstShotCount
	 * @param {number} ticksBetweenBurstShots
	 * @param {string} soundCast
	 * @param {string} soundCastTail
	 * @param {number} muzzleFlashScale
	 */
	constructor(
		verbClass = 'Verb_Shoot',
		hasStandardCommand = true,
		defaultProjectile = '',
		warmupTime = undefined,
		range = undefined,
		burstShotCount = undefined,
		ticksBetweenBurstShots = undefined,
		soundCast = 'Shot_Shotgun',
		soundCastTail = 'GunTail_Heavy',
		muzzleFlashScale = undefined
	) {
		/**
		 * @type {string}
		 */
		this.verbClass = verbClass;
		/**
		 * @type {Boolean}
		 */
		this.hasStandardCommand = hasStandardCommand.toString();
		/**
		 * @type {string}
		 */
		this.defaultProjectile = defaultProjectile;
		/**
		 * @type {number}
		 */
		this.warmupTime = warmupTime;
		/**
		 * @type {number}
		 */
		this.range = range;
		/**
		 * @type {number}
		 */
		this.burstShotCount = burstShotCount;
		/**
		 * @type {number}
		 */
		this.ticksBetweenBurstShots = ticksBetweenBurstShots;
		/**
		 * @type {string}
		 */
		this.soundCast = soundCast;
		/**
		 * @type {string}
		 */
		this.soundCastTail = soundCastTail;
		/**
		 * @type {number}
		 */
		this.muzzleFlashScale = muzzleFlashScale;
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
