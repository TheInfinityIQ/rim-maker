<script setup>
import { reactive } from 'vue';
import WeaponForm from '@/components/WeaponForm.vue';
import exportXML from '@/assets/buildXML';

const weapons = reactive([]);
const weaponTemplate = {
	label: '',
	description: '',
	graphicData: {
		graphicData: '',
		graphicData: '',
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
	equippedStatOffsets: {},
	verbs: [],
	tools: [],
	recipeMaker: {
		skillRequirements: {},
	},
};

function generateWeaponTemplate() {
	return structuredClone(weaponTemplate);
}
</script>

<template>
	<div class="container">
		<header>
			<Button label="Make a Weapon" @click="weapons.push(generateWeaponTemplate())" />
		</header>
		<main>
			<Panel
				v-for="(weapon, index) in weapons"
				:header="`Weapon ${index + 1}`"
				@updateWeapon="weapons[index] = $event"
				style="margin: 20px 0"
				toggleable
			>
				<WeaponForm :weapon="weapon"></WeaponForm>
			</Panel>
		</main>
		<footer>
			<Button
				v-tooltip.bottom="'Export weapons as XML'"
				@click="exportXML(weapons)"
				icon="pi pi-file-export"
			/>
		</footer>
	</div>
</template>

<style scoped>
.container {
	display: flex;
	flex-direction: column;
}

header,
main,
footer {
	border: thin red solid;
	min-height: 50px;
	padding: 10px;
}
</style>
