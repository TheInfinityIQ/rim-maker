<script setup>
import { reactive } from 'vue';

const weaponForm = reactive({
	label: '',
	description: '',
	costList: {
		steel: '',
		componentIndustrial: '',
	},
	statBases: {
		workToMake: '',
		mass: '',
		accuracyTouch: '',
		accuracyShort: '',
		accuracyMedium: '',
		accuracyLong: '',
		rangedWeaponCooldown: '',
	},
});
</script>

<template>
	<Card>
		<template #content>
			<div>
				<div class="input-group">
					<label for="weaponName">Weapon Name</label>
					<InputText
						fluid
						v-model="weaponForm.label"
						id="weaponName"
						class="inputField"
						placeholder="pump shotgun"
					/>
				</div>

				<div class="input-group">
					<label for="weaponDescription">Weapon Definition</label>
					<Textarea
						fluid
						v-model="weaponForm.description"
						id="weaponDescription"
						class="inputField"
						placeholder="An ancient design of shotgun that emits a tight-packed spray of pellets. Deadly, but short range."
					/>
				</div>

				<div class="input-group">
					<label for="steelCost">Steel Cost</label>
					<InputText
						fluid
						v-model="weaponForm.costList.steel"
						id="steelCost"
						class="inputField"
						placeholder="60"
					/>
				</div>

				<div class="input-group">
					<label for="componentCost">Component Cost</label>
					<InputText
						fluid
						v-model="weaponForm.costList.componentIndustrial"
						id="componentCost"
						class="inputField"
						placeholder="3"
					/>
				</div>

				<div class="input-group">
					<label for="workToMake">Work to Make</label>
					<InputText
						fluid
						v-model="weaponForm.statBases.workToMake"
						id="workToMake"
						class="inputField"
						placeholder="12000"
					/>
				</div>

				<div class="input-group">
					<label for="weaponMass">Weapon Mass (kg)</label>
					<InputText
						fluid
						v-model="weaponForm.statBases.mass"
						id="weaponMass"
						class="inputField"
						placeholder="3.4"
					/>
				</div>

				<div class="input-group">
					<label for="accuracyTouch">Touch Range Accuracy</label>
					<InputText
						fluid
						v-model="weaponForm.statBases.accuracyTouch"
						id="accuracyTouch"
						class="inputField"
						placeholder="0.80"
					/>
				</div>

				<div class="input-group">
					<label for="accuracyShort">Short Range Accuracy</label>
					<InputText
						fluid
						v-model="weaponForm.statBases.accuracyShort"
						id="accuracyShort"
						class="inputField"
						placeholder="0.87"
					/>
				</div>

				<div class="input-group">
					<label for="accuracyMedium">Medium Range Accuracy</label>
					<InputText
						fluid
						v-model="weaponForm.statBases.accuracyMedium"
						id="accuracyMedium"
						class="inputField"
						placeholder="0.77"
					/>
				</div>

				<div class="input-group">
					<label for="accuracyLong">Long Range Accuracy</label>
					<InputText
						fluid
						v-model="weaponForm.statBases.accuracyLong"
						id="accuracyLong"
						class="inputField"
						placeholder="0.64"
					/>
				</div>

				<div class="input-group">
					<label for="rangedCooldown">Ranged Weapon Cooldown (seconds)</label>
					<InputText
						fluid
						v-model="weaponForm.statBases.rangedWeaponCooldown"
						id="rangedCooldown"
						class="inputField"
						placeholder="1.25"
					/>
				</div>

				<div class="input-group">
					<label for="weaponImage">Weapon Image</label>
					<FileUpload />
				</div>
			</div>
		</template>
	</Card>
</template>

<style scoped>
.input-group {
	display: flex;
	flex-direction: column;
	margin-bottom: 20px;
	align-items: start;
}
</style>
