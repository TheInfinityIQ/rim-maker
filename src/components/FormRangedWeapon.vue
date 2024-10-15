<script setup>
import { onBeforeMount, ref, computed } from 'vue';
import { Tool, WeaponRanged } from '@/models/weapon';
import skills from '@/utility/data/skills.json';
import stats from '@/utility/data/stats.json';
import things from '@/utility/data/things.json';
import tools from '@/utility/data/tools.json';
import bullets from '@/utility/data/bullets.json';
import getSoundsForCascadeSelect from '@/utility/scripts/dataUtility';

import FormBullet from './form-parts/FormBullet.vue';
import FormCostList from './form-parts/FormCostList.vue';
import FormDetails from './form-parts/FormDetails.vue';
import FormSkillRequirements from './form-parts/FormSkillRequirements.vue';
import FormStatBases from './form-parts/FormStatBases.vue';
import FormStatOffset from './form-parts/FormStatOffset.vue';
import FormTools from './form-parts/FormTools.vue';
import FormVerbs from './form-parts/FormVerbs.vue';

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
</script>

<template>
	<FormDetails :gun="weapon.gun"></FormDetails>

	<FormCostList :costList="weapon.gun.costList" :costListItems="costListItems"></FormCostList>

	<FormStatOffset
		:equippedStatOffsets="weapon.gun.equippedStatOffsets"
		:statListItems="statListItems"
	></FormStatOffset>

	<FormVerbs :verbs="weapon.gun.verbs"></FormVerbs>

	<FormTools :tools="weapon.gun.tools" :toolListItems="toolListItems"></FormTools>

	<FormSkillRequirements
		:recipeMaker="weapon.gun.recipeMaker"
		:skillListItems="skillListItems"
	></FormSkillRequirements>

	<FormStatBases :statBases="weapon.gun.statBases"></FormStatBases>

	<FormBullet
		:bullet="weapon.bullet"
		:verbs="weapon.gun.verbs"
		:bulletListItems="bulletListItems"
	></FormBullet>

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
