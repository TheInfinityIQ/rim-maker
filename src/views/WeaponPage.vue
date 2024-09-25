<script setup>
import { reactive } from 'vue';
import WeaponForm from '@/components/WeaponForm.vue';
import exportXML from '@/utility/scripts/buildXML';
import { WeaponRanged } from '@/models/weapon';
import { getWeapons } from '@/assets/test';
import { Sound } from '@/models/sound';

const weapons = reactive(getWeapons('TestMod'));
const sounds = reactive([]);

function initExport(modName) {
	const fileNames = new Set();

	for (const weapon of weapons) {
		weapon.gun.defName = `${modName}_${weapon.gun.label.replace(/ /g, '')}`;

		if (!fileNames.has(weapon.gun.verbs[0].soundCastFile.name)) {
			const soundDef = `${modName}Shot_${weapon.gun.defName}`;

			sounds.push(
				new Sound(
					soundDef,
					`${modName}/${weapon.gun.verbs[0].soundCastFile.name.replace(/\.[^/.]+$/, '')}`
				)
			);
			weapon.gun.verbs[0].soundCast = soundDef;
		}

		if (!fileNames.has(weapon.gun.verbs[0].soundCastTailFile.name)) {
			const soundTailDef = `${modName}GunTail_${weapon.gun.defName}`;

			sounds.push(
				new Sound(
					soundTailDef,
					`${modName}/${weapon.gun.verbs[0].soundCastTailFile.name.replace(
						/\.[^/.]+$/,
						''
					)}`,
					true
				)
			);

			weapon.gun.verbs[0].soundCastTail = soundTailDef;
		}
	}

	exportXML(weapons, sounds, modName);
}
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
				@click="initExport('TestMod')"
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
