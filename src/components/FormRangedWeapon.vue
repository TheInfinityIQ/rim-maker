<script setup>
import { onBeforeMount, ref, computed } from 'vue';
import { Tool, WeaponRanged } from '@/models/weapon';
import skills from '@/utility/data/skills.json';
import stats from '@/utility/data/stats.json';
import things from '@/utility/data/things.json';
import tools from '@/utility/data/tools.json';
import bullets from '@/utility/data/bullets.json';
import getSoundsForCascadeSelect from '@/utility/scripts/dataUtility';
import { LABEL_MESSAGE_KEYS, invalidLabelMessage } from '@/utility/weaponFormRules';

const props = defineProps({
	weapon: {
		required: true,
		type: WeaponRanged,
	},
});

const costListItems = ref([]);
const statListItems = ref([]);
const skillListItems = ref([]);
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
	SOUND_INTERACT: 3,
	WEAPON_TEXTURE: 4,
	PROJECTILE_TEXTURE: 5,
};

const soundCastFile = ref();
const soundCastTailFile = ref();
const weaponTextureFile = ref();
const bulletTextureFile = ref();
const soundInteractFile = ref();

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
		case FILE_ASSIGNMENTS.SOUND_INTERACT:
			soundInteractFile.value.click();
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

const isWeaponGunLabelInvalid = computed(() => {
	return /^[0-9]$/.test(
		props.weapon.gun.label.trim().charAt(props.weapon.gun.label.trim().length - 1)
	)
		? true
		: false;
});

const weaponGunLabelValidationMessage = computed(() => {
	if (isWeaponGunLabelInvalid.value) {
		return invalidLabelMessage(LABEL_MESSAGE_KEYS.ENDING_IN_NUMBER);
	}
	return '';
});
</script>

<template>
	<Panel class="panel" toggleable header="Details">
		<div>
			<label for="weaponName"
				>Weapon Name
				<span v-if="weaponGunLabelValidationMessage.length" class="warning">{{
					weaponGunLabelValidationMessage
				}}</span></label
			>
			<InputText
				v-model="weapon.gun.label"
				:invalid="isWeaponGunLabelInvalid"
				fluid
				id="weaponName"
				placeholder="pump shotgun"
			/>
		</div>

		<div>
			<label for="weaponDescription">Weapon Definition</label>
			<Textarea
				v-model="weapon.gun.description"
				fluid
				id="weaponDescription"
				placeholder="An ancient design of shotgun that emits a tight-packed spray of pellets. Deadly, but short range."
			/>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Cost List" collapsed>
		<Button
			icon="pi pi-plus"
			@click="weapon.gun.costList.push({ defName: '', value: 0 })"
		></Button>

		<Divider></Divider>

		<div v-for="(item, index) in weapon.gun.costList">
			<InputGroup>
				<Select
					v-model="item.defName"
					:optionLabel="(option) => `${option.label} (defName: ${option.defName})`"
					:options="costListItems"
					filter
					optionValue="defName"
				></Select>
				<InputText v-model="item.value"></InputText>
				<Button icon="pi pi-times" @click="weapon.gun.costList.splice(index, 1)"></Button>
			</InputGroup>

			<Divider></Divider>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Stat Offsets" collapsed>
		<Button
			icon="pi pi-plus"
			@click="weapon.gun.equippedStatOffsets.push({ defName: '', value: 0 })"
		></Button>

		<Divider></Divider>

		<div v-for="(item, index) in weapon.gun.equippedStatOffsets">
			<InputGroup>
				<Select
					v-model="item.defName"
					:optionLabel="(option) => `${option.label} (defName: ${option.defName})`"
					:options="statListItems"
					filter
					optionValue="defName"
				></Select>
				<InputText v-model="item.value"></InputText>
				<Button
					icon="pi pi-times"
					@click="weapon.gun.equippedStatOffsets.splice(index, 1)"
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
			<Button icon="pi pi-times"></Button>
			<Divider></Divider>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Recipe Skill Requirements" collapsed>
		<Button
			icon="pi pi-plus"
			@click="weapon.gun.recipeMaker.skillRequirements.push({ defName: '', value: 0 })"
		></Button>

		<Divider></Divider>

		<div v-for="(item, index) in weapon.gun.recipeMaker.skillRequirements">
			<InputGroup>
				<Select
					v-model="item.defName"
					:optionLabel="(option) => `${option.skillLabel} (defName: ${option.defName})`"
					:options="skillListItems"
					filter
					optionValue="defName"
				></Select>
				<InputText v-model="item.value"></InputText>
				<Button
					icon="pi pi-times"
					@click="weapon.gun.recipeMaker.skillRequirements.splice(index, 1)"
				></Button>
			</InputGroup>
			<Divider></Divider>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Stat Bases" collapsed>
		<div>
			<label for="workToMake">Work to Make</label>
			<InputText
				fluid
				v-model="weapon.gun.statBases.WorkToMake"
				id="workToMake"
				placeholder="12000"
			/>
		</div>

		<div>
			<label for="weaponMass">Weapon Mass (kg)</label>
			<InputText
				fluid
				v-model="weapon.gun.statBases.Mass"
				id="weaponMass"
				placeholder="3.4"
			/>
		</div>

		<div>
			<label for="accuracyTouch">Touch Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.gun.statBases.AccuracyTouch"
				id="accuracyTouch"
				placeholder="0.80"
			/>
		</div>

		<div>
			<label for="accuracyShort">Short Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.gun.statBases.AccuracyShort"
				id="accuracyShort"
				placeholder="0.87"
			/>
		</div>

		<div>
			<label for="accuracyMedium">Medium Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.gun.statBases.AccuracyMedium"
				id="accuracyMedium"
				placeholder="0.77"
			/>
		</div>

		<div>
			<label for="accuracyLong">Long Range Accuracy</label>
			<InputText
				fluid
				v-model="weapon.gun.statBases.AccuracyLong"
				id="accuracyLong"
				placeholder="0.64"
			/>
		</div>

		<div>
			<label for="rangedCooldown">Ranged Weapon Cooldown (seconds)</label>
			<InputText
				fluid
				v-model="weapon.gun.statBases.RangedWeapon_Cooldown"
				id="rangedCooldown"
				placeholder="1.25"
			/>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Bullet" collapsed>
		<InputGroup>
			<Select
				v-model="weapon.gun.verbs[0].defaultProjectile"
				:optionLabel="(option) => bulletOptionLabel(option)"
				optionValue="defName"
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

			<Button
				v-if="weapon.gun.verbs[0].defaultProjectile"
				icon="pi pi-times"
				label="Clear selection"
				@click="weapon.gun.verbs[0].defaultProjectile = ''"
			></Button>
			<Button
				v-else
				icon="pi pi-plus"
				label="Create bullet"
				@click="weapon.gun.verbs[0].defaultProjectile = ''"
			></Button>
		</InputGroup>

		<div>
			<label for="bulletLabel">Projectile Name</label>
			<InputText
				v-model="weapon.bullet.label"
				fluid
				id="bulletLabel"
				placeholder="shotgun blast"
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
			<label for="bulletProjectileArmorPenetration"
				>Armor Penetration <i class="pi pi-question-circle"></i
			></label>
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
		<div v-if="'explosionRadius' in weapon.bullet.projectile">
			<label for="bulletExplosionRadius">Explosion Radius</label>
			<InputText
				fluid
				v-model="weapon.bullet.projectile.explosionRadius"
				id="bulletExplosionRadius"
				placeholder="5"
			/>
		</div>
	</Panel>

	<Panel class="panel" toggleable header="Files" collapsed>
		<label for="gunGraphicData">Weapon Texture</label>
		<InputGroup id="gunGraphicData">
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

		<label for="bulletGraphicData">Projectile Texture</label>
		<InputGroup id="bulletGraphicData">
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

		<label for="weaponGunSound">Weapon Shooting Sound</label>
		<InputGroup id="weaponGunSound">
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
			<Button
				v-if="weapon.gun.verbs[0].soundCastFile"
				icon="pi pi-times"
				label="Remove File"
				@click="
					weapon.gun.verbs[0].soundCastFile = null;
					weapon.gun.verbs[0].soundCast = '';
				"
			/>

			<input
				type="file"
				ref="soundCastFile"
				accept="audio/*"
				style="display: none"
				@change="onFileUpload($event, FILE_ASSIGNMENTS.SOUND_CAST)"
			/>
		</InputGroup>

		<label for="weaponGunTailSound">Weapon Shooting Tail Sound</label>
		<InputGroup id="weaponGunTailSound">
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
			<Button
				v-if="weapon.gun.verbs[0].soundCastTailFile"
				icon="pi pi-times"
				label="Remove File"
				@click="
					weapon.gun.verbs[0].soundCastTailFile = null;
					weapon.gun.verbs[0].soundCastTail = '';
				"
			/>

			<input
				type="file"
				ref="soundCastTailFile"
				accept="audio/*"
				style="display: none"
				@change="onFileUpload($event, FILE_ASSIGNMENTS.SOUND_CAST_TAIL)"
			/>
		</InputGroup>

		<label for="weaponInteractSound">Weapon Interact Sound</label>
		<InputGroup id="weaponInteractSound">
			<CascadeSelect
				:options="soundListItems"
				optionGroupChildren="children"
				optionGroupLabel="label"
				optionLabel="label"
				placeholder="Select an Interact sound (Interact menu for best results)"
				v-if="!weapon.gun.soundInteractFile"
				v-model="weapon.gun.soundInteract"
			/>

			<InputText :placeholder="weapon.gun.soundInteractFile.name" disabled v-else></InputText>
			<Button
				icon="pi pi-upload"
				:label="weapon.gun.soundInteractFile ? 'Replace File' : 'Upload File'"
				@click="initFileUpload(FILE_ASSIGNMENTS.SOUND_INTERACT)"
			/>

			<Button
				v-if="weapon.gun.soundInteractFile"
				icon="pi pi-times"
				label="Remove File"
				@click="
					weapon.gun.soundInteractFile = null;
					weapon.gun.soundInteract = '';
				"
			/>

			<input
				type="file"
				ref="soundInteractFile"
				accept="audio/*"
				style="display: none"
				@change="onFileUpload($event, FILE_ASSIGNMENTS.SOUND_INTERACT)"
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

.warning {
	color: rgba(255, 196, 0, 0.581);
}
</style>
