<script setup>
import { reactive } from 'vue';
import WeaponForm from '@/components/WeaponForm.vue';

function spitXML() {
	alert('test');
}

const weaponTemplate = {
	label: '',
	description: '',
	statBases: {
		workToMake: '',
		mass: '',
		accuracyTouch: '',
		accuracyShort: '',
		accuracyMedium: '',
		accuracyLong: '',
		rangedWeaponCooldown: '',
	},
};

function generateWeaponTemplate() {
	return structuredClone(weaponTemplate);
}

function objectToXML(obj) {
	let xml = `<${rootElement}>`;

	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'object') {
			xml += objectToXML(value, key);
		} else {
			xml += `<${key}>${value}</${key}>`;
		}
	}

	xml += `</${rootElement}>`;
	return xml;
}

const weapons = reactive([]);
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
				@click="spitXML()"
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
