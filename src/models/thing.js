export class Thing {
	/**
	 *
	 * @param {string} defName
	 * @param {string} label
	 * @param {string} description
	 */
	constructor(defName = '', label = '', description = '') {
		this.defName = defName;
		this.label = label;
		this.description = description;
	}
}

export class SoundData {
	/**
	 *
	 * @param {File} file - Sound file that will be used to create a new SoundDef
	 * @param {string} defName - defName of a SoundDef within RimWorld
	 */
	constructor(file = null, defName = '') {}

	/**
	 * Sets file to a new file and sets defName to its' default value.
	 *
	 * @param {File} file - audio file that will be used to create a new SoundDef
	 */
	setFile(file) {
		if (file instanceof File && file.type.split('/')[1] == 'audio') {
			this.defName = '';
			this.file = file;
			return;
		}
		throw new Error('The file failed to upload because it was not an audio file!');
	}

	/**
	 * Sets the defName to a new defName. defName should be an existing SoundDef defName
	 *
	 * @param {string} defName - defName of a SoundDef within RimWorld
	 */
	setDefName(defName) {
		this.file = null;
		this.defName = defName;
	}
}

class List {
	/**
	 *
	 * @param {[{defName: string, value: number}]} entries
	 */
	constructor(entries = []) {
		this.list = new Map();

		for (const entry of entries) {
			try {
				this.addItem(entry.defName, entry.value);
			} catch (error) {
				throw error;
			}
		}
	}

	/**
	 *
	 * @param {string} defName
	 * @param {number} value
	 */
	addItem(defName, value) {
		if (this.list.has(defName)) {
			throw new Error('DefName is already in the list!');
		}
		if (isNaN(value)) {
			throw new Error('Value is not a number!');
		}

		this.list.set(defName, value);
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
	 * @param {string} filePath
	 * @param {File} file - must be
	 * @param {string} graphicClass
	 *
	 */
	constructor(filePath = '', file = null, graphicClass = 'Graphic_Single') {
		/**
		 * @type {string}
		 */
		this.filePath = filePath;

		/**
		 * @type {File}
		 */
		this.file = file;

		/**
		 * @type {string}
		 */
		this.graphicClass = graphicClass;
	}

	/**
	 * Sets file to a new file and sets defName to its' default value.
	 *
	 * @param {File} file - audio file that will be used to create a new SoundDef
	 */
	setFile(file) {
		if (file instanceof File && file.type.split('/')[1] == 'image') {
			this.defName = '';
			this.file = file;
			return;
		}
		throw new Error('The file failed to upload because it was not an audio file!');
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
	 * @param {number} forcedMissRadius - Only assign value if the weapon shoots bomb projectiles
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
		muzzleFlashScale = 1,
		forcedMissRadius = null
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

		if (forcedMissRadius != null) {
			this.forcedMissRadius = forcedMissRadius;
		}
	}

	clone() {
		return new Verb(
			this.verbClass,
			this.hasStandardCommand,
			this.defaultProjectile,
			this.warmupTime,
			this.range,
			this.burstShotCount,
			this.ticksBetweenBurstShots,
			this.soundCast,
			this.soundCastTail,
			this.soundCastFile,
			this.soundCastTailFile,
			this.muzzleFlashScale,
			this.forcedMissRadius
		);
	}
}
