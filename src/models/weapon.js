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
		this.gun.equippedStatOffsets = remapArrayToObject(this.gun.equippedStatOffsets);
		this.gun.recipeMaker.skillRequirements = remapArrayToObject(
			this.gun.recipeMaker.skillRequirements
		);
		this.gun.costList = remapArrayToObject(this.gun.costList);

		let xml = `<!-- ${this.gun.label.toUpperCase()} -->
`;
		// xml += `<!-- BULLET -->\r\n`;
		// xml += this.bullet.buildXML();
		// xml += `\r\n`;
		xml += `<!-- GUN -->\n`;
		xml += this.gun.buildXML();

		return xml;
	}

	private;
}

/**
 *
 * @param {Array<{defName: string, value: number}>} arr
 * @returns An object where the defName is the key and the value is
 */
function remapArrayToObject(arr) {
	const obj = {};

	for (const element of arr) {
		obj[element.defName] = element.value;
	}

	return obj;
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

/**
 *************************
 * 			GUN 		 *
 *************************
 */

export class WeaponRangedGun {
	/**
	 * @param {string} defName
	 * @param {string} label
	 * @param {string} description
	 * @param {GraphicData} graphicData
	 * @param {Object} costList
	 * @param {StatBases} statBases
	 * @param {Object} equippedStatOffsets
	 * @param {Verb[]} verbs
	 * @param {Tool[]} tools
	 * @param {RecipeMaker} recipeMaker
	 */
	constructor(
		defName = '',
		label = '',
		description = '',
		graphicData = new GraphicData(),
		costList = [],
		statBases = new StatBases(),
		equippedStatOffsets = [],
		verbs = [new Verb()],
		tools = [],
		recipeMaker = new RecipeMaker()
	) {
		this.defName = defName;
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
		 * @type {Object}
		 */
		this.costList = costList;
		/**
		 * @type {StatBases}
		 */
		this.statBases = statBases;
		/**
		 * @type {Object}
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
	constructor(label = '', capacities = [], power = null, cooldownTime = null) {
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

export class StatBases {
	/**
	 *
	 * @param {number} WorkToMake
	 * @param {number} Mass
	 * @param {number} AccuracyTouch
	 * @param {number} AccuracyShort
	 * @param {number} AccuracyMedium
	 * @param {number} AccuracyLong
	 * @param {number} RangedWeapon_Cooldown
	 */
	constructor(
		WorkToMake = null,
		Mass = null,
		AccuracyTouch = null,
		AccuracyShort = null,
		AccuracyMedium = null,
		AccuracyLong = null,
		RangedWeapon_Cooldown = null
	) {
		/**
		 * @type {number}
		 */
		this.workToMake = WorkToMake;

		/**
		 * @type {number}
		 */
		this.mass = Mass;

		/**
		 * @type {number}
		 */
		this.accuracyTouch = AccuracyTouch;

		/**
		 * @type {number}
		 */
		this.accuracyShort = AccuracyShort;

		/**
		 * @type {number}
		 */
		this.accuracyMedium = AccuracyMedium;

		/**
		 * @type {number}
		 */
		this.accuracyLong = AccuracyLong;

		/**
		 * @type {number}
		 */
		this.rangedWeapon_Cooldown = RangedWeapon_Cooldown;

		/**
		 * @type {number}
		 */
	}
}

export class GraphicData {
	/**
	 * @param {string} texPath
	 * @param {File} textureFile
	 * @param {string} graphicClass
	 *
	 */
	constructor(texPath = '', graphicClass = 'Graphic_Single', textureFile = null) {
		/**
		 * @type {string}
		 */
		this.texPath = texPath;

		/**
		 * @type {string}
		 */
		this.graphicClass = graphicClass;

		/**
		 * @type {File}
		 */
		this.textureFile = textureFile;
	}
}

export class RecipeMaker {
	/**
	 * @param {[]} skillRequirements
	 */
	constructor() {
		/**
		 * @type {Object}
		 */
		this.skillRequirements = [];
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
	 * @param {File} soundCastFile
	 * @param {File} soundCastTailFile
	 * @param {number} muzzleFlashScale
	 */
	constructor(
		verbClass = 'Verb_Shoot',
		hasStandardCommand = true,
		defaultProjectile = 'Bullet_Autopistol',
		warmupTime = 1,
		range = 1,
		burstShotCount = 1,
		ticksBetweenBurstShots = 1,
		soundCast = '',
		soundCastTail = '',
		soundCastFile = null,
		soundCastTailFile = null,
		muzzleFlashScale = 1
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
		 * @type {File}
		 */
		this.soundCastFile = soundCastFile;
		/**
		 * @type {File}
		 */
		this.soundCastTailFile = soundCastTailFile;
		/**
		 * @type {number}
		 */
		this.muzzleFlashScale = muzzleFlashScale;
	}
}
