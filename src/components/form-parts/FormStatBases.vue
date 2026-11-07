<script setup>

import { StatBases } from '@/models/weapon';
import SectionReference from './SectionReference.vue';

const props = defineProps({
	kind: String,
	statBases: {
		required: true,
		type: StatBases,
	},
});
</script>

<template>
	<Panel class="panel" toggleable header="Stat Bases" collapsed>
		<p class="form-section-help"><strong>What are stat bases?</strong> These are the weapon's starting values, before applicable material, quality and wielder modifiers. They describe the item itself. Stat Offsets below instead change the pawn while the weapon is equipped.</p>
		<p class="form-section-help">Use this section for weight and crafting workload.<template v-if="kind === 'melee'"> Set melee damage and recovery in Attacks → Tools.</template><template v-else> Ranged accuracy and recovery also belong here. Set damage in the Projectile definition and maximum reach in Attacks → Verbs.</template></p>
		<div>
			<label for="workToMake">Work to Make</label>
			<InputText
				fluid
				v-model="props.statBases.WorkToMake"
				id="workToMake"
				inputmode="decimal"
				placeholder="12000"
			/>
		</div>

		<p class="form-section-help">Work to Make is the amount of crafting work required, not a number of seconds. More work takes longer; the crafter's work speed determines how quickly it is completed. For example, doubling this value doubles the workload for the same recipe.</p>
		<div>
			<label for="weaponMass">Weapon Mass (kg)</label>
			<InputText fluid v-model="props.statBases.Mass" id="weaponMass" inputmode="decimal" placeholder="3.4" />
		</div>
		<p class="form-section-help">Mass is the item's weight in kilograms. Increase it for a heavier weapon; it does not directly set attack damage.</p>

		<template v-if="kind !== 'melee' && kind !== 'grenade'"><p class="form-section-help">Accuracy values use 0–1: 0.8 means 80% weapon accuracy, not an 80% final chance to hit. Touch, Short, Medium and Long are reference points at 3, 12, 25 and 40 tiles; the game interpolates between them. They do not change maximum range. Blank values use the game's default of 1.</p><p class="form-section-help">The shooter's skill and conditions also affect a shot. Use Preview → White room to compare accuracy by distance. Explosive scatter and special projectiles need native testing rather than the ordinary hit-percentage curve.</p><div>
			<label for="accuracyTouch">Touch Range Accuracy</label>
			<InputText
				fluid
				v-model="props.statBases.AccuracyTouch"
				id="accuracyTouch"
				inputmode="decimal"
				placeholder="1 (game default)"
			/>
		</div>

		<div>
			<label for="accuracyShort">Short Range Accuracy</label>
			<InputText
				fluid
				v-model="props.statBases.AccuracyShort"
				id="accuracyShort"
				inputmode="decimal"
				placeholder="1 (game default)"
			/>
		</div>

		<div>
			<label for="accuracyMedium">Medium Range Accuracy</label>
			<InputText
				fluid
				v-model="props.statBases.AccuracyMedium"
				id="accuracyMedium"
				inputmode="decimal"
				placeholder="1 (game default)"
			/>
		</div>

		<div>
			<label for="accuracyLong">Long Range Accuracy</label>
			<InputText
				fluid
				v-model="props.statBases.AccuracyLong"
				id="accuracyLong"
				inputmode="decimal"
				placeholder="1 (game default)"
			/>
		</div>

		</template><div v-if="kind !== 'melee'">
			<label for="rangedCooldown">Ranged Weapon Cooldown (seconds)</label>
			<InputText
				fluid
				v-model="props.statBases.RangedWeapon_Cooldown"
				id="rangedCooldown"
				inputmode="decimal"
				placeholder="1.25"
			/>
			<p class="form-section-help">Cooldown is recovery time after a shot or burst before the next attack. It is separate from preparation time and spacing within a burst, which are edited in Attacks → Verbs. Lower values allow attacks more often; this is not projectile travel time.</p>
		</div>
		<SectionReference href="https://rimworldwiki.com/wiki/Stat" label="Stats and modifiers" />
	</Panel>
</template>
