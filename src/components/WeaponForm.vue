<script setup>
import { ref } from 'vue';
import things from '@/assets/things.json';

defineProps({
	weapon: {
		required: true,
		type: Object,
	},
});

const costListItems = ref([]);
const costListFields = ref([]);

function costListItemsAndNames() {
	const tempObj = {};
	for (const item of costListItems.value) {
		tempObj[item] = { key: item, quantity: 0, label: uuidv4() };
	}
	costListFields.value = tempObj;
}

function uuidv4() {
	return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
		(+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
	);
}

function deleteCostListItem(key) {
	delete costListFields.value[key];
}
</script>

<template>
	<Panel class="panel" toggleable header="Details">
		<div class="input-group">
			<label for="weaponName">Weapon Name</label>
			<InputText
				fluid
				v-model="weapon.label"
				id="weaponName"
				class="inputField"
				placeholder="pump shotgun"
			/>
		</div>

		<div class="input-group">
			<label for="weaponDescription">Weapon Definition</label>
			<Textarea
				fluid
				v-model="weapon.description"
				id="weaponDescription"
				class="inputField"
				placeholder="An ancient design of shotgun that emits a tight-packed spray of pellets. Deadly, but short range."
			/>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Cost List" collapsed>
		<div style="display: flex; justify-content: space-between; margin-bottom: 20px">
			<MultiSelect v-model="costListItems" :options="things.things" filter />
			<Button @click="costListItemsAndNames">Update</Button>
		</div>

		<div v-for="item in costListFields" :key="item.key" class="input-group">
			<label :for="item.label">{{ item.key }} cost</label>
			<InputGroup>
				<InputText v-model="item.quantity" :id="item.label" class="inputField" fluid />
				<Button icon="pi pi-times" @click="deleteCostListItem(item.key)"></Button>
			</InputGroup>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Stat Bases" collapsed>
		<div class="input-group">
			<label for="workToMake">Work to Make</label>
			<InputText
				fluid
				v-model="weapon.statBases.workToMake"
				id="workToMake"
				class="inputField"
				placeholder="12000"
			/>
		</div>

		<div class="input-group">
			<label for="weaponMass">Weapon Mass (kg)</label>
			<InputText
				fluid
				v-model="weapon.statBases.mass"
				id="weaponMass"
				class="inputField"
				placeholder="3.4"
			/>
		</div>

		<div class="input-group">
			<label for="accuracyTouch">Touch Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.statBases.accuracyTouch"
				id="accuracyTouch"
				class="inputField"
				placeholder="0.80"
			/>
		</div>

		<div class="input-group">
			<label for="accuracyShort">Short Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.statBases.accuracyShort"
				id="accuracyShort"
				class="inputField"
				placeholder="0.87"
			/>
		</div>

		<div class="input-group">
			<label for="accuracyMedium">Medium Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.statBases.accuracyMedium"
				id="accuracyMedium"
				class="inputField"
				placeholder="0.77"
			/>
		</div>

		<div class="input-group">
			<label for="accuracyLong">Long Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.statBases.accuracyLong"
				id="accuracyLong"
				class="inputField"
				placeholder="0.64"
			/>
		</div>

		<div class="input-group">
			<label for="rangedCooldown">Ranged Weapon Cooldown (seconds)</label>
			<InputText
				fluid
				v-model="weapon.statBases.rangedWeaponCooldown"
				id="rangedCooldown"
				class="inputField"
				placeholder="1.25"
			/>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Pictures" collapsed>
		<div class="input-group">
			<label for="weaponImage">Weapon Image</label>
			<FileUpload />
		</div>
	</Panel>
</template>

<style scoped>
.input-group {
	display: flex;
	flex-direction: column;
	margin-bottom: 20px;
	align-items: start;
}

.panel {
	margin-top: 20px;
}
</style>
