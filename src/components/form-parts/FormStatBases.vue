<script setup>

import { StatBases } from '@/models/weapon';

const props = defineProps({
	statBases: {
		required: true,
		type: StatBases,
	},
});
</script>

<template>
	<Panel class="panel" toggleable header="Stat Bases" collapsed>
		<p class="form-section-help">Accuracy values use 0–1 (0.8 = 80%), at 3, 12, 25 and 40 tiles. Blank accuracy fields use the game's default of 1. The white-room curve also accounts for the shooter's skill.</p>
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

		<div>
			<label for="weaponMass">Weapon Mass (kg)</label>
			<InputText fluid v-model="props.statBases.Mass" id="weaponMass" inputmode="decimal" placeholder="3.4" />
		</div>

		<div>
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

		<div>
			<label for="rangedCooldown">Ranged Weapon Cooldown (seconds)</label>
			<InputText
				fluid
				v-model="props.statBases.RangedWeapon_Cooldown"
				id="rangedCooldown"
				inputmode="decimal"
				placeholder="1.25"
			/>
		</div>
	</Panel>
</template>
