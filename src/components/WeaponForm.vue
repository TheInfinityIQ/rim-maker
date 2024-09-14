<script setup>
import { onMounted, ref, computed } from 'vue';
import things from '@/assets/things.json';
import stats from '@/assets/stats.json';
import skills from '@/assets/skills.json';
import tools from '@/assets/tools.json';

defineProps({
	weapon: {
		required: true,
		type: Object,
	},
});

function deleteCostListItem(defName) {
	delete weapon.costList[defName];
}

function deleteStatListItem(defName) {
	delete weapon.statBases[defName];
}

function deleteSkillListItem(defName) {
	delete weapon.recipeMaker.skillRequirements[defName];
}

function deleteToolListItem(defName) {
	delete weapon.tools[defName];
}

const costListItems = ref([]);
const costListFields = ref([]);

const statListItems = ref([]);
const statListFields = ref([]);

const skillListItems = ref([]);
const skillListFields = ref([]);

const toolListItems = ref([]);
const toolListFields = ref([]);

function isOptionDisabled(optionToCheck) {
	return toolListFields.value.map((option) => option.defName).includes(optionToCheck);
}

onMounted(() => {
	costListItems.value = things;
	statListItems.value = stats;
	skillListItems.value = skills;
	toolListItems.value = tools;
});
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
			<MultiSelect
				v-model="costListFields"
				:options="costListItems"
				optionLabel="label"
				filter
				:showToggleAll="false"
				display="chip"
			>
			</MultiSelect>
		</div>

		<div v-for="thingDef in costListFields" :key="thingDef" class="input-group">
			<div class="item-header">
				<label :for="thingDef.label"> {{ thingDef.label }} cost </label>
				<i>{{ thingDef.description }}</i>
			</div>
			<InputGroup>
				<InputText
					v-model="weapon.costList[thingDef.defName]"
					:id="thingDef.label"
					class="inputField"
					fluid
					:placeholder="`Total number of [${thingDef.label}] in recipe`"
				/>
				<Button icon="pi pi-times" @click="deleteCostListItem(thingDef.defName)"></Button>
			</InputGroup>
			<Divider></Divider>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Stat Offsets" collapsed>
		<div style="display: flex; justify-content: space-between; margin-bottom: 20px">
			<MultiSelect
				v-model="statListFields"
				:options="statListItems"
				optionLabel="label"
				filter
				:showToggleAll="false"
				display="chip"
			>
			</MultiSelect>
		</div>

		<div v-for="statDef in statListFields" :key="statDef" class="input-group">
			<div class="item-header">
				<label :for="statDef.label"> {{ statDef.label }} cost </label>
				<i>{{ statDef.description }}</i>
			</div>
			<InputGroup>
				<InputText
					v-model="weapon.equippedStatOffsets[statDef.defName]"
					:id="statDef.label"
					class="inputField"
					fluid
					:placeholder="`Percentage to change offset by (decimal)`"
				/>
				<Button icon="pi pi-times" @click="deleteStatListItem(statDef.defName)"></Button>
			</InputGroup>
			<Divider></Divider>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Tools" collapsed>
		<Button
			icon="pi pi-plus"
			@click="
				toolListFields.push({
					li: { power: 9, cooldownTime: 2, label: 'barrel', defName: undefined },
				})
			"
		></Button>

		<div v-for="tool in toolListFields" class="input-group">
			<div class="item-header">
				<label :for="tool.label"> {{ tool.label }} </label>
				<i>{{ tool.description }}</i>
			</div>

			<Select
				v-model="tool.defName"
				:optionDisabled="
					(option) => option.defName != tool.defName && isOptionDisabled(option.defName)
				"
				:options="toolListItems"
				optionValue="defName"
				optionLabel="label"
			>
			</Select>
			<InputGroup>
				<InputText
					v-model="tool.label"
					:id="tool.label"
					class="inputField"
					fluid
					:placeholder="`Part of weapon to ${tool.label} pawn with. Barrel or stock for example.`"
				/>
				<InputText
					v-model="tool.power"
					:id="tool.power"
					class="inputField"
					fluid
					:placeholder="`Damage part of weapon does.`"
				/>
				<InputText
					v-model="tool.cooldownTime"
					:id="tool.cooldownTime"
					class="inputField"
					fluid
					:placeholder="`Seconds (on 1x speed) between hits.`"
				/>
				<Button icon="pi pi-times" @click="deleteToolListItem(tool.defName)"></Button>
			</InputGroup>
			<Divider></Divider>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Recipe Skill Requirements" collapsed>
		<div style="display: flex; justify-content: space-between; margin-bottom: 20px">
			<MultiSelect
				v-model="skillListFields"
				:options="skillListItems"
				optionLabel="skillLabel"
				filter
				:showToggleAll="false"
				display="chip"
			>
			</MultiSelect>
		</div>

		<div v-for="skillDef in skillListFields" :key="skillDef" class="input-group">
			<div class="item-header">
				<label :for="skillDef.skillLabel"> {{ skillDef.skillLabel }} cost </label>
				<i>{{ skillDef.description }}</i>
			</div>
			<InputGroup>
				<InputText
					v-model="weapon.recipeMaker.skillRequirements[skillDef.defName]"
					:id="skillDef.skillLabel"
					class="inputField"
					fluid
					:placeholder="`Minimum required skill to create item`"
				/>
				<Button icon="pi pi-times" @click="deleteSkillListItem(skillDef.defName)"></Button>
			</InputGroup>
			<Divider></Divider>
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

	<Panel class="panel" toggleable header="Sounds" collapsed>
		<div class="input-group">
			<label for="weaponSounds">Weapon Sound</label>
			<FileUpload />
		</div>
	</Panel>
</template>

<style scoped>
.input-group {
	display: flex;
	flex-direction: column;
	gap: 5px;
	align-items: start;
}

.panel {
	margin-top: 20px;
}

.item-header {
	display: flex;
	flex-direction: column;
}

i {
	color: rgba(255, 255, 255, 0.33);
}
</style>
