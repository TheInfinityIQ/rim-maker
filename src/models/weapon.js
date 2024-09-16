import { thingToXML } from '@/assets/buildXML';

export class WeaponRangedBuilder {
	constructor() {
		this.label = undefined;
		this.description = undefined;
		this.graphicData = undefined;
		this.costList = [];
		this.statBase = undefined;
		this.equippedStatOffsets = [];
		this.verbs = [];
		this.tools = [];
		this.recipeMaker = undefined;
	}

	setLabel(value) {
		this.label = value;
		return this;
	}

	setDescription(value) {
		this.description = value;
		return this;
	}

	setGraphicData(value) {
		this.graphicData = value;
		return this;
	}

	setCostList(value) {
		this.costList = value;
		return this;
	}

	setStatBase(value) {
		this.statBase = value;
		return this;
	}

	setEquippedStatOffsets(value) {
		this.equippedStatOffsets = value;
		return this;
	}

	setVerbs(value) {
		this.verbs = value;
		return this;
	}

	setTools(value) {
		this.tools = value;
		return this;
	}

	setRecipeMaker(value) {
		this.recipeMaker = value;
		return this;
	}

	build() {
		return new WeaponRanged(
			this.label,
			this.description,
			this.graphicData,
			this.costList,
			this.statBase,
			this.equippedStatOffsets,
			this.verbs,
			this.tools,
			this.recipeMaker
		);
	}
}

export class WeaponRanged {
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
	 */
	constructor(
		label,
		description,
		graphicData,
		costList,
		statBase,
		equippedStatOffsets,
		verbs,
		tools,
		recipeMaker
	) {
		this.label = label;
		this.description = description;
		this.graphicData = graphicData;
		this.costList = costList;
		this.statBase = statBase;
		this.equippedStatOffsets = equippedStatOffsets;
		this.verbs = verbs;
		this.tools = tools;
		this.recipeMaker = recipeMaker;
	}

	buildXML() {
		// thingToXML(obj, rootElement);
	}
}

export class Tool {
	constructor(label, capacities, power, cooldownTime) {
		this.label = label;
		this.capacities = capacities;
		this.cooldownTime = cooldownTime;
		this.power = power;
	}
}

export class StatBase {
	constructor(
		workToMake,
		mass,
		accuracyTouch,
		accuracyShort,
		accuracyMedium,
		accuracyLong,
		rangedWeapon_Cooldown
	) {
		this.workToMake = workToMake;
		this.mass = mass;
		this.accuracyTouch = accuracyTouch;
		this.accuracyShort = accuracyShort;
		this.accuracyMedium = accuracyMedium;
		this.accuracyLong = accuracyLong;
		this.rangedWeapon_Cooldown = rangedWeapon_Cooldown;
	}
}

export class GraphicData {
	constructor(texturePath, graphicClass = 'Graphic_Single') {
		this.texturePath = texturePath;
		this.graphicClass = graphicClass;
	}
}

export class RecipeMaker {
	/**
	 * @param {Skill[]} skillRequirements
	 */
	constructor(skillRequirements) {
		this.skillRequirements = skillRequirements;
	}
}

export class Skill {
	/**
	 * @param {Def} def
	 * @param {number} amount - Number between 0 and 20 (inclusive) representing Pawns strength in associated Skill
	 */
	constructor(def, amount) {
		this.def = def;

		if (amount < 0) {
			amount = 0;
		} else if (amount > 20) {
			amount = 20;
		}
		this.amount = Math.floor(amount);
	}
}

export class Cost {
	/**
	 * @param {Def} def
	 * @param {number} amount - Number of thingDefs
	 */
	constructor(def, amount) {
		this.def = def;
		this.amount = Math.floor(amount);
	}
}

export class StatOffset {
	/**
	 * @param {Def} def
	 * @param {number} offset - Decimal representing percentage to offset stat
	 */
	constructor(def, offset) {
		this.def = def;
		this.offset = offset;
	}
}

/**
 * Represents a basic definition of a thing in RimWorld.
 */
export class Def {
	/**
	 * @param {string} defName - The unique definition name.
	 * @param {string} label - The in-game label of the item.
	 * @param {string} description - The in-game description of the item.
	 */
	constructor(defName, label, description) {
		/**
		 * The unique definition name used by the game to identify this item.
		 * @type {string}
		 */
		this.defName = defName;

		/**
		 * The in-game label displayed to players.
		 * @type {string}
		 */
		this.label = label;

		/**
		 * The in-game description displayed in item details.
		 * @type {string}
		 */
		this.description = description;
	}
}
