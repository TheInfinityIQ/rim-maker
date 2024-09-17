<script setup>
import { onBeforeMount, ref } from 'vue';
import { Tool } from '@/models/weapon';
import skills from '@/assets/skills.json';
import stats from '@/assets/stats.json';
import things from '@/assets/things.json';
import tools from '@/assets/tools.json';

const props = defineProps({
	weapon: {
		required: true,
		type: Object,
	},
});

const costListItems = ref([]);
const costListFields = ref([]);

const statListItems = ref([]);
const statListFields = ref([]);

const skillListItems = ref([]);
const skillListFields = ref([]);

const toolListItems = ref([]);

onBeforeMount(() => {
	costListItems.value = things;
	statListItems.value = stats;
	skillListItems.value = skills;
	toolListItems.value = tools;
});

function deleteCostListItem(defName) {
	delete props.weapon.costList[defName];
}

function deleteStatListItem(defName) {
	delete props.weapon.statBase[defName];
}

function deleteSkillListItem(defName) {
	delete props.weapon.recipeMaker.skillRequirements[defName];
}

function deleteToolListItem(defName) {
	delete props.weapon.tools[defName];
}

function isOptionDisabled(toolCapacities, toolCapacityOption) {
	const selectedOptions = props.weapon.tools.map((tool) => tool.capacities[0]);

	return (
		toolCapacities[0] != toolCapacityOption.defName &&
		selectedOptions.includes(toolCapacityOption.defName)
	);
}
</script>

<template>
	<Panel class="panel" toggleable header="Details">
		<div>
			<label for="weaponName">Weapon Name</label>
			<InputText fluid v-model="weapon.label" id="weaponName" placeholder="pump shotgun" />
		</div>

		<div>
			<label for="weaponDescription">Weapon Definition</label>
			<Textarea
				fluid
				v-model="weapon.description"
				id="weaponDescription"
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

		<div v-for="thingDef in costListFields" :key="thingDef">
			<div>
				<label :for="thingDef.label"> {{ thingDef.label }} cost </label>
				<i>{{ thingDef.description }}</i>
			</div>
			<InputGroup>
				<InputText
					v-model="weapon.costList[thingDef.defName]"
					:id="thingDef.label"
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

		<div v-for="statDef in statListFields" :key="statDef">
			<div>
				<label :for="statDef.label"> {{ statDef.label }} cost </label>
				<i>{{ statDef.description }}</i>
			</div>
			<InputGroup>
				<InputText
					v-model="weapon.equippedStatOffsets[statDef.defName]"
					:id="statDef.label"
					fluid
					:placeholder="`Percentage to change offset by (decimal)`"
				/>
				<Button icon="pi pi-times" @click="deleteStatListItem(statDef.defName)"></Button>
			</InputGroup>
			<Divider></Divider>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Tools" collapsed>
		<Button icon="pi pi-plus" @click="weapon.tools.push(new Tool())"></Button>

		<div v-for="tool in weapon.tools">
			<Select
				v-model="tool.capacities[0]"
				:optionDisabled="(option) => isOptionDisabled(tool.capacities, option)"
				:options="toolListItems"
				optionValue="defName"
				optionLabel="label"
			>
			</Select>
			<InputGroup>
				<InputText
					v-model="tool.label"
					:id="tool.label"
					fluid
					:placeholder="`Part of weapon to ${tool.label} pawn with. Barrel or stock for example.`"
				/>
				<InputText
					v-model="tool.power"
					:id="tool.power"
					fluid
					:placeholder="`Damage part of weapon does.`"
				/>
				<InputText
					v-model="tool.cooldownTime"
					:id="tool.cooldownTime"
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

		<div v-for="skillDef in skillListFields" :key="skillDef">
			<div>
				<label :for="skillDef.skillLabel"> {{ skillDef.skillLabel }} cost </label>
				<i>{{ skillDef.description }}</i>
			</div>
			<InputGroup>
				<InputText
					v-model="weapon.recipeMaker.skillRequirements[skillDef.defName]"
					:id="skillDef.skillLabel"
					fluid
					:placeholder="`Minimum required skill to create item`"
				/>
				<Button icon="pi pi-times" @click="deleteSkillListItem(skillDef.defName)"></Button>
			</InputGroup>
			<Divider></Divider>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Stat Bases" collapsed>
		<div>
			<label for="workToMake">Work to Make</label>
			<InputText
				fluid
				v-model="weapon.statBase.workToMake"
				id="workToMake"
				placeholder="12000"
			/>
		</div>

		<div>
			<label for="weaponMass">Weapon Mass (kg)</label>
			<InputText fluid v-model="weapon.statBase.mass" id="weaponMass" placeholder="3.4" />
		</div>

		<div>
			<label for="accuracyTouch">Touch Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.statBase.accuracyTouch"
				id="accuracyTouch"
				placeholder="0.80"
			/>
		</div>

		<div>
			<label for="accuracyShort">Short Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.statBase.accuracyShort"
				id="accuracyShort"
				placeholder="0.87"
			/>
		</div>

		<div>
			<label for="accuracyMedium">Medium Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.statBase.accuracyMedium"
				id="accuracyMedium"
				placeholder="0.77"
			/>
		</div>

		<div>
			<label for="accuracyLong">Long Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.statBase.accuracyLong"
				id="accuracyLong"
				placeholder="0.64"
			/>
		</div>

		<div>
			<label for="rangedCooldown">Ranged Weapon Cooldown (seconds)</label>
			<InputText
				fluid
				v-model="weapon.statBase.rangedWeaponCooldown"
				id="rangedCooldown"
				placeholder="1.25"
			/>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Pictures" collapsed>
		<div>
			<label for="weaponImage">Weapon Image</label>
			<FileUpload />
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Sounds" collapsed>
		<div>
			<label for="weaponSounds">Weapon Sound</label>
			<FileUpload />
		</div>
	</Panel>
</template>

<style scoped>
.panel {
	margin-top: 20px;
}
</style>
