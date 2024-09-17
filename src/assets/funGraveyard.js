// export class WeaponRangedBuilder {
// 	constructor() {
// 		this.label = undefined;
// 		this.description = undefined;
// 		this.graphicData = undefined;
// 		this.costList = [];
// 		this.statBase = undefined;
// 		this.equippedStatOffsets = [];
// 		this.verbs = [];
// 		this.tools = [];
// 		this.recipeMaker = undefined;
// 	}

// 	/**
// 	 *
// 	 * @param {string} value
// 	 * @returns {WeaponRangedBuilder}
// 	 */
// 	setLabel(value) {
// 		this.label = value;
// 		return this;
// 	}

// 	/**
// 	 *
// 	 * @param {string} value
// 	 * @returns {WeaponRangedBuilder}
// 	 */
// 	setDescription(value) {
// 		this.description = value;
// 		return this;
// 	}

// 	/**
// 	 *
// 	 * @param {GraphicData} value
// 	 * @returns {WeaponRangedBuilder}
// 	 */
// 	setGraphicData(value) {
// 		this.graphicData = value;
// 		return this;
// 	}

// 	/**
// 	 *
// 	 * @param {Cost[]} value
// 	 * @returns {WeaponRangedBuilder}
// 	 */
// 	setCostList(value) {
// 		this.costList = value;
// 		return this;
// 	}

// 	/**
// 	 *
// 	 * @param {StatBase} value
// 	 * @returns {WeaponRangedBuilder}
// 	 */
// 	setStatBase(value) {
// 		this.statBase = value;
// 		return this;
// 	}

// 	/**
// 	 *
// 	 * @param {StatOffset[]} value
// 	 * @returns {WeaponRangedBuilder}
// 	 */
// 	setEquippedStatOffsets(value) {
// 		this.equippedStatOffsets = value;
// 		return this;
// 	}

// 	/**
// 	 *
// 	 * @param {Verb[]} value
// 	 * @returns {WeaponRangedBuilder}
// 	 */
// 	setVerbs(value) {
// 		this.verbs = value;
// 		return this;
// 	}

// 	/**
// 	 *
// 	 * @param {Tool[]} value
// 	 * @returns {WeaponRangedBuilder}
// 	 */
// 	setTools(value) {
// 		this.tools = value;
// 		return this;
// 	}

// 	/**
// 	 *
// 	 * @param {Skill[]} value
// 	 * @returns {WeaponRangedBuilder}
// 	 */
// 	setRecipeMaker(value) {
// 		this.recipeMaker = value;
// 		return this;
// 	}

// 	/**
// 	 *
// 	 * @returns {WeaponRanged}
// 	 */
// 	build() {
// 		return new WeaponRanged(
// 			this.label,
// 			this.description,
// 			this.graphicData,
// 			this.costList,
// 			this.statBase,
// 			this.equippedStatOffsets,
// 			this.verbs,
// 			this.tools,
// 			this.recipeMaker
// 		);
// 	}
// }
