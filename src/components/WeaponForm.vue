<script setup>
import { onBeforeMount, ref } from 'vue';
import { Tool, WeaponRanged } from '@/models/weapon';
import skills from '@/utility/data/skills.json';
import stats from '@/utility/data/stats.json';
import things from '@/utility/data/things.json';
import tools from '@/utility/data/tools.json';
import bullets from '@/utility/data/bullets.json';
import getSoundsForCascadeSelect from '@/utility/scripts/dataUtility';

const props = defineProps({
	weapon: {
		required: true,
		type: WeaponRanged,
	},
});

const isSelectingDefaultSoundCast = ref(true);
const isSelectingDefaultSoundCastTrail = ref(true);

const isSoundCastUploading = ref(false);
const isSoundCastTailUploading = ref(false);

const costListItems = ref([]);
const costListFields = ref([]);

const statListItems = ref([]);
const statListFields = ref([]);

const skillListItems = ref([]);
const skillListFields = ref([]);

const toolListItems = ref([]);

const bulletListItems = ref([]);

const soundListItems = ref([]);

onBeforeMount(() => {
	costListItems.value = things;
	statListItems.value = stats;
	skillListItems.value = skills;
	toolListItems.value = tools;
	bulletListItems.value = bullets;
	soundListItems.value = getSoundsForCascadeSelect();
});

function deleteCostListItem(defName) {
	delete props.weapon.gun.costList[defName];
}

function deleteStatListItem(defName) {
	delete props.weapon.gun.statBase[defName];
}

function deleteSkillListItem(defName) {
	delete props.weapon.gun.recipeMaker.skillRequirements[defName];
}

function deleteToolListItem(defName) {
	delete props.weapon.gun.tools[defName];
}

function bulletOptionLabel(option) {
	let optionLabel = `${option.label}`;

	return optionLabel + ` (Damage: ${option.projectile.damageAmountBase ?? 'N/A'})`;
}

function bulletOptionLabelTooltip(option) {
	let result = '';

	for (const key in option.projectile) {
		if (option.projectile[key]) {
			result += `${key}: ${option.projectile[key]}\r\n`;
		}
	}

	return result.trim(); // Removes any trailing newline
}

function isOptionDisabled(toolCapacities, toolCapacityOption) {
	const selectedOptions = props.weapon.gun.tools.map((tool) => tool.capacities[0]);

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
			<InputText
				fluid
				v-model="weapon.gun.label"
				id="weaponName"
				placeholder="pump shotgun"
			/>
		</div>

		<div>
			<label for="weaponDescription">Weapon Definition</label>
			<Textarea
				fluid
				v-model="weapon.gun.description"
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
					v-model="weapon.gun.costList[thingDef.defName]"
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
					v-model="weapon.gun.equippedStatOffsets[statDef.defName]"
					:id="statDef.label"
					fluid
					:placeholder="`Percentage to change offset by (decimal)`"
				/>
				<Button icon="pi pi-times" @click="deleteStatListItem(statDef.defName)"></Button>
			</InputGroup>
			<Divider></Divider>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Verbs" collapsed>
		<InputText
			v-model="weapon.gun.verbs[0].warmupTime"
			fluid
			placeholder="Time to aim (seconds)"
		/>
		<InputText
			v-model="weapon.gun.verbs[0].range"
			fluid
			placeholder="Total range (number of tiles between weapon and target)"
		/>
		<InputText
			v-model="weapon.gun.verbs[0].burstShotCount"
			fluid
			placeholder="Total projectiles fired per burst"
		/>
		<InputText
			v-model="weapon.gun.verbs[0].ticksBetweenBurstShots"
			fluid
			placeholder="Ticks between each projectile in burst"
		/>
		<InputGroup>
			<CascadeSelect
				v-if="isSelectingDefaultSoundCast"
				v-model="weapon.gun.verbs[0].soundCast"
				:options="soundListItems"
				optionLabel="label"
				optionGroupLabel="label"
				optionGroupChildren="children"
				placeholder="Select a Shot sound (Shot menu for best results)"
				:loading="isSoundCastUploading"
			/>
			<FileUpload
				mode="basic"
				icon="pi pi-upload"
				v-tooltip.top="'Upload a custom sound file'"
				auto
				:maxFileSize="1000000"
				:fileLimit="1"
				@progress="isSoundCastUploading = true"
				@upload="
					isSoundCastUploading = false;
					isSelectingDefaultSoundCast = false;
				"
			/>
		</InputGroup>

		<InputGroup>
			<CascadeSelect
				v-if="isSelectingDefaultSoundCastTrail"
				v-model="weapon.gun.verbs[0].soundCastTail"
				:options="soundListItems"
				optionLabel="label"
				optionGroupLabel="label"
				optionGroupChildren="children"
				placeholder="Select an Shot fade sound (GunTail menu for best results)"
			/>
			<FileUpload
				mode="basic"
				icon="pi pi-upload"
				v-tooltip.top="'Upload a custom sound file'"
				auto
				:maxFileSize="1000000"
				:fileLimit="1"
				@progress="isSoundCastTailUploading = true"
				@upload="
					isSoundCastTailUploading = false;
					isSelectingDefaultSoundCastTrail = false;
				"
			/>
		</InputGroup>
	</Panel>

	<Panel class="panel" toggleable header="Tools" collapsed>
		<Button icon="pi pi-plus" @click="weapon.gun.tools.push(new Tool())"></Button>

		<div v-for="tool in weapon.gun.tools">
			<Select
				v-model="tool.capacities[0]"
				:optionDisabled="(option) => isOptionDisabled(tool.capacities, option)"
				:options="toolListItems"
				optionValue="defName"
				optionLabel="label"
			>
			</Select>
			<InputText
				v-model="tool.label"
				:id="tool.label"
				fluid
				:placeholder="`Value to display in health tab when damaged by this tool`"
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
					v-model="weapon.gun.recipeMaker.skillRequirements[skillDef.defName]"
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
				v-model="weapon.gun.statBase.workToMake"
				id="workToMake"
				placeholder="12000"
			/>
		</div>

		<div>
			<label for="weaponMass">Weapon Mass (kg)</label>
			<InputText fluid v-model="weapon.gun.statBase.mass" id="weaponMass" placeholder="3.4" />
		</div>

		<div>
			<label for="accuracyTouch">Touch Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.gun.statBase.accuracyTouch"
				id="accuracyTouch"
				placeholder="0.80"
			/>
		</div>

		<div>
			<label for="accuracyShort">Short Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.gun.statBase.accuracyShort"
				id="accuracyShort"
				placeholder="0.87"
			/>
		</div>

		<div>
			<label for="accuracyMedium">Medium Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.gun.statBase.accuracyMedium"
				id="accuracyMedium"
				placeholder="0.77"
			/>
		</div>

		<div>
			<label for="accuracyLong">Long Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.gun.statBase.accuracyLong"
				id="accuracyLong"
				placeholder="0.64"
			/>
		</div>

		<div>
			<label for="rangedCooldown">Ranged Weapon Cooldown (seconds)</label>
			<InputText
				fluid
				v-model="weapon.gun.statBase.rangedWeaponCooldown"
				id="rangedCooldown"
				placeholder="1.25"
			/>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Bullet" collapsed>
		<Select
			v-model="weapon.gun.verbs[0].defaultProjectile"
			:optionLabel="(option) => bulletOptionLabel(option)"
			:options="bulletListItems"
		>
			<template #option="slotProps">
				<div
					v-if="!slotProps.selected"
					v-tooltip.right="bulletOptionLabelTooltip(slotProps.option)"
				>
					{{ bulletOptionLabel(slotProps.option) }}
				</div>
			</template>
		</Select>

		<!-- <div>
			<label for="bulletLabel">Bullet Name</label>
			<InputText
				fluid
				v-model="weapon.bullet.label"
				id="bulletLabel"
				placeholder="Bullet_Shotgun"
			/>
		</div>
		<div>
			<label for="bulletProjectileDamageAmountBase">Bullet Damage</label>
			<InputText
				fluid
				v-model="weapon.bullet.projectile.damageAmountBase"
				id="bulletProjectileDamageAmountBase"
				placeholder="18"
			/>
		</div>
		<div>
			<label for="bulletProjectileStoppingPower">Stopping Power</label>
			<InputText
				fluid
				v-model="weapon.bullet.projectile.stoppingPower"
				id="bulletProjectileStoppingPower"
				placeholder="3"
			/>
		</div>
		<div>
			<label for="bulletProjectileArmorPenetration">Armor Penetration</label>
			<InputText
				fluid
				v-model="weapon.bullet.projectile.armorPenetrationBase"
				id="bulletProjectileArmorPenetration"
				placeholder="0.14"
			/>
		</div>
		<div>
			<label for="bulletProjectileSpeed">Projectile Speed</label>
			<InputText
				fluid
				v-model="weapon.bullet.projectile.speed"
				id="bulletProjectileSpeed"
				placeholder="55"
			/>
		</div>
		<div>
			<label for="bulletGraphicData">Weapon Image</label>
			<FileUpload id="bulletGraphicData" />
		</div> -->
	</Panel>

	<Panel class="panel" toggleable header="Textures" collapsed>
		<div>
			<label for="weaponImage">Weapon Image</label>
			<FileUpload />
		</div>
		<div>
			<label for="weaponImage">Projectile Image</label>
			<FileUpload />
		</div>
	</Panel>
</template>

<style scoped>
.panel {
	margin-top: 20px;
}
</style>
