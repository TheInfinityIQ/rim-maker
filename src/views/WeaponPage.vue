<script setup>
import { reactive } from 'vue';
import WeaponForm from '@/components/WeaponForm.vue';
import exportXML from '@/utility/scripts/buildXML';
import { WeaponRanged } from '@/models/weapon';

const weapons = reactive([]);
const sounds = reactive([]);
</script>

<template>
	<div class="container">
		<header>
			<Button label="Make a Weapon" @click="weapons.push(new WeaponRanged())" />
		</header>
		<main>
			<Panel
				v-for="(weapon, index) in weapons"
				:header="`Weapon ${index + 1}`"
				style="margin: 20px 0"
				toggleable
			>
				<WeaponForm :weapon="weapon"></WeaponForm>
			</Panel>
		</main>
		<footer>
			<Button
				v-tooltip.bottom="'Export weapons as XML'"
				@click="exportXML(weapons, sounds, 'TestMod')"
				@createSound="sounds.push($event)"
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
