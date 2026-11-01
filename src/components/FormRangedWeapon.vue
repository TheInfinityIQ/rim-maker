<script setup>
import { computed, ref } from 'vue';
import { WeaponRanged } from '@/models/weapon';
import { useDefinitionStore } from '@/stores/definitions';
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

const activeSection = ref('details');

const definitions = useDefinitionStore();
const costListItems = computed(() => definitions.things);
const statListItems = computed(() => definitions.stats);
const skillListItems = computed(() => definitions.skills);
const toolListItems = computed(() => definitions.tools);
const bulletListItems = computed(() => definitions.bullets);
const soundListItems = computed(() => getSoundsForCascadeSelect(definitions.sounds));

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
			case FILE_ASSIGNMENTS.SOUND_INTERACT:
				props.weapon.gun.soundInteractFile = file;
				props.weapon.gun.soundInteract = '';
				break;
			default:
				console.error('The following file is invalid on upload', file);
				break;
		}
	}
}
</script>

<template>
	<Tabs v-model:value="activeSection" class="editor-form" scrollable>
		<TabList aria-label="Weapon settings">
			<Tab value="details">Details</Tab><Tab value="combat">Combat</Tab><Tab value="crafting">Crafting</Tab><Tab value="files">Files</Tab>
		</TabList>
		<TabPanels>
		<TabPanel value="details"><Fluid class="form-stack">
	<FormDetails :gun="weapon.gun" />

	<FormStatOffset
		:equippedStatOffsets="weapon.gun.equippedStatOffsets"
		:statListItems="statListItems"
	/>
		</Fluid></TabPanel>
		<TabPanel value="combat"><Fluid class="form-stack">
	<FormVerbs :verbs="weapon.gun.verbs" />

	<FormTools :tools="weapon.gun.tools" :toolListItems="toolListItems" />

	<FormStatBases :statBases="weapon.gun.statBases" />

	<FormBullet
		:bullet="weapon.bullet"
		:verbs="weapon.gun.verbs"
		:bulletListItems="bulletListItems"
		:weapon="weapon"
	/>
		</Fluid></TabPanel>
		<TabPanel value="crafting"><Fluid class="form-stack">
	<FormCostList :costList="weapon.gun.costList" :costListItems="costListItems" />
	<FormSkillRequirements :recipeMaker="weapon.gun.recipeMaker" :skillListItems="skillListItems" />
		</Fluid></TabPanel>
		<TabPanel value="files"><Fluid class="form-stack">
	<Panel header="Textures & sounds">
		<label for="gunGraphicData">Weapon Texture</label>
		<div class="asset-row" id="gunGraphicData">
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
		</div>

		<label for="bulletGraphicData">Projectile Texture</label>
		<div class="asset-row" id="bulletGraphicData">
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
		</div>

		<label for="weaponGunSound">Weapon Shooting Sound</label>
		<div class="asset-row" id="weaponGunSound">
			<CascadeSelect
				:options="soundListItems"
				optionGroupChildren="children"
				optionValue="label"
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
		</div>

		<label for="weaponGunTailSound">Weapon Shooting Tail Sound</label>
		<div class="asset-row" id="weaponGunTailSound">
			<CascadeSelect
				v-if="!weapon.gun.verbs[0].soundCastTailFile"
				v-model="weapon.gun.verbs[0].soundCastTail"
				:options="soundListItems"
				optionLabel="label"
				optionGroupLabel="label"
				optionGroupChildren="children"
				optionValue="label"
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
		</div>

		<label for="weaponInteractSound">Weapon Interact Sound</label>
		<div class="asset-row" id="weaponInteractSound">
			<CascadeSelect
				:options="soundListItems"
				optionGroupChildren="children"
				optionValue="label"
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
		</div>
	</Panel>
		</Fluid></TabPanel>
		</TabPanels>
	</Tabs>
</template>

<style scoped>
.warning {
	color: rgba(255, 196, 0, 0.581);
}
</style>
