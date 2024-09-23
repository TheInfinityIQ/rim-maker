<script setup>
import { onBeforeMount, onMounted, ref } from 'vue';
import { Tool, WeaponRanged, Cost, Def, StatOffset } from '@/models/weapon';
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

	costListFields.value = [props.weapon.gun.costList[0]];
});

function deleteCostListItem(defName) {
	delete props.weapon.gun.costList[defName];
}

function deleteStatListItem(defName) {
	delete props.weapon.gun.statBases[defName];
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

const FILE_ASSIGNMENTS = {
	SOUND_CAST: 1,
	SOUND_CAST_TAIL: 2,
	WEAPON_TEXTURE: 3,
	PROJECTILE_TEXTURE: 4,
};

const soundCastFile = ref();
const soundCastTailFile = ref();
const weaponTextureFile = ref();
const bulletTextureFile = ref();
function initFileUpload(fileAssignment) {
	switch (fileAssignment) {
		case FILE_ASSIGNMENTS.SOUND_CAST:
			soundCastFile.value.click();
			break;
		case FILE_ASSIGNMENTS.SOUND_CAST_TAIL:
			soundCastTailFile.value.click();
			break;
		case FILE_ASSIGNMENTS.WEAPON_TEXTURE:
			weaponTextureFile.value.click();
			break;
		case FILE_ASSIGNMENTS.PROJECTILE_TEXTURE:
			bulletTextureFile.value.click();
			break;
		default:
			console.error('The following FILE_ASSIGNMENTS is invalid on file select', file);
			break;
	}
}

function onFileUpload(event, fileAssignment) {
	const file = event.target.files[0];

	if (file) {
		switch (fileAssignment) {
			case FILE_ASSIGNMENTS.SOUND_CAST:
				props.weapon.gun.verbs[0].soundCastFile = file;
				props.weapon.gun.verbs[0].soundCast = '';
				break;
			case FILE_ASSIGNMENTS.SOUND_CAST_TAIL:
				props.weapon.gun.verbs[0].soundCastTailFile = file;
				props.weapon.gun.verbs[0].soundCastTail = '';
				break;
			case FILE_ASSIGNMENTS.WEAPON_TEXTURE:
				props.weapon.gun.graphicData.textureFile = file;
				break;
			case FILE_ASSIGNMENTS.PROJECTILE_TEXTURE:
				props.weapon.bullet.graphicData.textureFile = file;
				break;
			default:
				console.error('The following file is invalid on upload', file);
				break;
		}
	}
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
				v-model="weapon.gun.costList"
				:options="costListItems"
				optionLabel="label"
				:optionValue="
					(option) => {
						return new Cost(
							new Def(option.defName, option.label, option.description),
							0
						);
					}
				"
				filter
				:showToggleAll="false"
				display="chip"
			>
			</MultiSelect>
		</div>

		<div v-for="(thing, index) in weapon.gun.costList" :key="thing">
			<div>
				<label :for="thing.def.label"> {{ thing.def.label }} </label> amount
				<i>{{ thing.def.description }}</i>
			</div>
			<InputGroup>
				<InputText
					v-model="thing.amount"
					:id="thing.def.label"
					fluid
					:placeholder="`Total number of [${thing.def.label}] in recipe`"
				/>
				<Button
					icon="pi pi-times"
					@click="weapon.gun.costList = weapon.gun.costList.splice(index, 1)"
				></Button>
			</InputGroup>
			<Divider></Divider>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Stat Offsets" collapsed>
		<div style="display: flex; justify-content: space-between; margin-bottom: 20px">
			<MultiSelect
				v-model="weapon.gun.equippedStatOffsets"
				:options="statListItems"
				optionLabel="label"
				:optionValue="
					(option) => {
						return new StatOffset(
							new Def(option.defName, option.label, option.description),
							0
						);
					}
				"
				filter
				:showToggleAll="false"
				display="chip"
			>
			</MultiSelect>
		</div>

		<div v-for="(statOffset, index) in weapon.gun.equippedStatOffsets" :key="statOffset">
			<div>
				<label> {{ statOffset.def.label }}</label> offset
				<i>{{ statOffset.def.description }}</i>
			</div>
			<InputGroup>
				<InputText
					v-model="statOffset.offset"
					:placeholder="`Percentage to offset value by (decimal)`"
				/>
				<Button
					icon="pi pi-times"
					@click="
						weapon.gun.equippedStatOffsets = weapon.gun.equippedStatOffsets.splice(
							index,
							1
						)
					"
				></Button>
			</InputGroup>
			<Divider></Divider>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Verbs" collapsed>
		<InputText
			fluid
			placeholder="Time to aim (seconds)"
			v-model="weapon.gun.verbs[0].warmupTime"
		/>
		<InputText
			fluid
			placeholder="Total range (number of tiles between weapon and target)"
			v-model="weapon.gun.verbs[0].range"
		/>

		<InputText
			fluid
			v-model="weapon.gun.verbs[0].burstShotCount"
			placeholder="Total projectiles fired per burst"
		/>
		<InputText
			fluid
			placeholder="Ticks between each projectile in burst"
			v-model="weapon.gun.verbs[0].ticksBetweenBurstShots"
		/>
		<InputGroup>
			<CascadeSelect
				:options="soundListItems"
				optionGroupChildren="children"
				optionGroupLabel="label"
				optionLabel="label"
				placeholder="Select a Shot sound (Shot menu for best results)"
				v-if="!weapon.gun.verbs[0].soundCastFile"
				v-model="weapon.gun.verbs[0].soundCast"
			/>
			<InputText
				:placeholder="weapon.gun.verbs[0].soundCastFile.name"
				disabled
				v-else
			></InputText>
			<Button
				icon="pi pi-upload"
				:label="weapon.gun.verbs[0].soundCastFile ? 'Replace File' : 'Upload File'"
				@click="initFileUpload(FILE_ASSIGNMENTS.SOUND_CAST)"
			/>

			<input
				type="file"
				ref="soundCastFile"
				accept="audio/*"
				style="display: none"
				@change="onFileUpload($event, FILE_ASSIGNMENTS.SOUND_CAST)"
			/>
		</InputGroup>

		<InputGroup>
			<CascadeSelect
				v-if="!weapon.gun.verbs[0].soundCastTailFile"
				v-model="weapon.gun.verbs[0].soundCastTail"
				:options="soundListItems"
				optionLabel="label"
				optionGroupLabel="label"
				optionGroupChildren="children"
				placeholder="Select an Shot fade sound (GunTail menu for best results)"
			/>
			<InputText
				v-else
				disabled
				:placeholder="weapon.gun.verbs[0].soundCastTailFile.name"
			></InputText>
			<Button
				icon="pi pi-upload"
				:label="weapon.gun.verbs[0].soundCastTailFile ? 'Replace File' : 'Upload File'"
				@click="initFileUpload(FILE_ASSIGNMENTS.SOUND_CAST_TAIL)"
			/>

			<input
				type="file"
				ref="soundCastTailFile"
				accept="audio/*"
				style="display: none"
				@change="onFileUpload($event, FILE_ASSIGNMENTS.SOUND_CAST_TAIL)"
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
				v-model="weapon.gun.statBases.workToMake"
				id="workToMake"
				placeholder="12000"
			/>
		</div>

		<div>
			<label for="weaponMass">Weapon Mass (kg)</label>
			<InputText
				fluid
				v-model="weapon.gun.statBases.mass"
				id="weaponMass"
				placeholder="3.4"
			/>
		</div>

		<div>
			<label for="accuracyTouch">Touch Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.gun.statBases.accuracyTouch"
				id="accuracyTouch"
				placeholder="0.80"
			/>
		</div>

		<div>
			<label for="accuracyShort">Short Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.gun.statBases.accuracyShort"
				id="accuracyShort"
				placeholder="0.87"
			/>
		</div>

		<div>
			<label for="accuracyMedium">Medium Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.gun.statBases.accuracyMedium"
				id="accuracyMedium"
				placeholder="0.77"
			/>
		</div>

		<div>
			<label for="accuracyLong">Long Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.gun.statBases.accuracyLong"
				id="accuracyLong"
				placeholder="0.64"
			/>
		</div>

		<div>
			<label for="rangedCooldown">Ranged Weapon Cooldown (seconds)</label>
			<InputText
				fluid
				v-model="weapon.gun.statBases.rangedWeaponCooldown"
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
		<InputGroup>
			weapon
			<InputText
				disabled
				:placeholder="
					weapon.gun.graphicData.textureFile
						? weapon.gun.graphicData.textureFile.name
						: 'Weapon Image (128x128 pixels). *Use .png for best results'
				"
			></InputText>
			<Button
				id="weaponImage"
				icon="pi pi-upload"
				:label="weapon.gun.graphicData.textureFile ? 'Replace File' : 'Upload File'"
				@click="initFileUpload(FILE_ASSIGNMENTS.WEAPON_TEXTURE)"
			/>
			<input
				type="file"
				ref="weaponTextureFile"
				accept="image/*"
				style="display: none"
				@change="onFileUpload($event, FILE_ASSIGNMENTS.WEAPON_TEXTURE)"
			/>
		</InputGroup>

		<InputGroup>
			projectile
			<InputText
				disabled
				:placeholder="
					weapon.bullet.graphicData.textureFile
						? weapon.bullet.graphicData.textureFile.name
						: 'Weapon Image (128x128 pixels). *Use .png for best results'
				"
			></InputText>
			<Button
				id="bulletImage"
				icon="pi pi-upload"
				:label="weapon.bullet.graphicData.textureFile ? 'Replace File' : 'Upload File'"
				@click="initFileUpload(FILE_ASSIGNMENTS.PROJECTILE_TEXTURE)"
			/>
			<input
				type="file"
				ref="bulletTextureFile"
				accept="image/*"
				style="display: none"
				@change="onFileUpload($event, FILE_ASSIGNMENTS.PROJECTILE_TEXTURE)"
			/>
		</InputGroup>
	</Panel>
</template>

<style scoped>
.panel {
	margin-top: 20px;
}

i {
	color: rgba(255, 255, 255, 0.25);
}
</style>
