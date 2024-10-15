<script setup>
import { defineProps } from 'vue';
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
		<div>
			<label for="workToMake">Work to Make</label>
			<InputText
				fluid
				v-model="props.statBases.WorkToMake"
				id="workToMake"
				placeholder="12000"
			/>
		</div>

		<div>
			<label for="weaponMass">Weapon Mass (kg)</label>
			<InputText fluid v-model="props.statBases.Mass" id="weaponMass" placeholder="3.4" />
		</div>

		<div>
			<label for="accuracyTouch">Touch Range Accuracy</label>
			<InputText
				fluid
				v-model="props.statBases.AccuracyTouch"
				id="accuracyTouch"
				placeholder="0.80"
			/>
		</div>

		<div>
			<label for="accuracyShort">Short Range Accuracy</label>
			<InputText
				fluid
				v-model="props.statBases.AccuracyShort"
				id="accuracyShort"
				placeholder="0.87"
			/>
		</div>

		<div>
			<label for="accuracyMedium">Medium Range Accuracy</label>
			<InputText
				fluid
				v-model="props.statBases.AccuracyMedium"
				id="accuracyMedium"
				placeholder="0.77"
			/>
		</div>

		<div>
			<label for="accuracyLong">Long Range Accuracy</label>
			<InputText
				fluid
				v-model="props.statBases.AccuracyLong"
				id="accuracyLong"
				placeholder="0.64"
			/>
		</div>

		<div>
			<label for="rangedCooldown">Ranged Weapon Cooldown (seconds)</label>
			<InputText
				fluid
				v-model="props.statBases.RangedWeapon_Cooldown"
				id="rangedCooldown"
				placeholder="1.25"
			/>
		</div>
	</Panel>
</template>
