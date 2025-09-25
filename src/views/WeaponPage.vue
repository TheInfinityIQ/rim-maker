<script setup>
import { reactive, ref } from 'vue';
import FormRangedWeapon from '@/components/FormRangedWeapon.vue';
import exportXML from '@/utility/scripts/buildXML';
import { WeaponRanged } from '@/models/weapon';
import { getWeapons } from '@/assets/test';
import { Sound } from '@/models/sound';

const weapons = reactive([]);
// const weapons = reactive(getWeapons('TestMod'));

const sounds = reactive([]);

const newMenu = reactive({
	numNewRangedWeapon: 0,
	numNewMeleeWeapon: 0,
	numNewRangedExplosiveWeapon: 0,
	numNewGrenadeWeapon: 0,
});

function initExport(modName) {
	const fileNames = new Set();

	for (const weapon of weapons) {
		weapon.gun.defName = `${modName}_${weapon.gun.label.replace(/ /g, '')}`;

		if (
			weapon.gun.verbs[0].soundCastFile &&
			!fileNames.has(weapon.gun.verbs[0].soundCastFile.name)
		) {
			const soundDef = `${modName}Shot_${weapon.gun.defName}`;

			sounds.push(
				new Sound(
					soundDef,
					`${modName}/${weapon.gun.verbs[0].soundCastFile.name.replace(/\.[^/.]+$/, '')}`
				)
			);
			weapon.gun.verbs[0].soundCast = soundDef;
		}

		if (
			weapon.gun.verbs[0].soundCastTailFile &&
			!fileNames.has(weapon.gun.verbs[0].soundCastTailFile.name)
		) {
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

		if (weapon.gun.soundInteractFile && !fileNames.has(weapon.gun.soundInteractFile.name)) {
			const soundInteractDef = `${modName}Interact_${weapon.gun.defName}`;

			sounds.push(
				new Sound(
					soundInteractDef,
					`${modName}/${weapon.gun.soundInteractFile.name.replace(/\.[^/.]+$/, '')}`
				)
			);

			weapon.gun.soundInteract = soundInteractDef;
		}
	}

	exportXML(weapons, sounds, modName);
}

const isSelectItemOpen = ref(false);
const newItemSelection = ref(0);

const ITEM_OPTIONS = {
	RANGED_WEAPON: 1,
	MELEE_WEAPON: 2,
	GRENADE_WEAPON: 3,
	EXPLOSIVE_RANGED_WEAPON: 4,
};

function createNewItems() {
	for (const key in newMenu) {
		for (let index = 0; index < newMenu[key]; index++) {
			switch (key) {
				case 'numNewRangedWeapon':
					weapons.push(new WeaponRanged());
					break;
				case 'numNewMeleeWeapon':
					weapons.push(new WeaponMelee());
					break;
				case 'numNewRangedExplosiveWeapon':
					weapons.push(new WeaponGrenade());
					break;
				case 'numNewGrenadeWeapon':
					weapons.push(new WeaponRangedExplosive());
					break;
				default:
					weapons.push(new WeaponRanged());
					break;
			}
		}
	}

	isSelectItemOpen.value = false;
}
</script>

<template>
	<div class="container">
		<header>
			<Button label="Add Weapons" @click="isSelectItemOpen = true" />

			<div v-if="isSelectItemOpen" style="display: flex; flex-direction: column; gap: 20px">
				<div style="display: flex; align-items: center; gap: 20px">
					<label for="ranged-weapon">Number of ranged weapons</label>
					<InputNumber
						v-model="newMenu.numNewRangedWeapon"
						id="ranged-weapon"
						inputId="integeronly"
						max="10"
						min="0"
					/>
				</div>

				<div style="display: flex; align-items: center; gap: 20px; color: grey">
					<label for="melee-weapon" v-tooltip.bottom="'In development'">
						Number of melee weapons (WIP)
					</label>
					<InputNumber
						v-model="newMenu.numNewMeleeWeapon"
						id="melee-weapon"
						inputId="integeronly"
						max="10"
						min="0"
						disabled
					/>
				</div>

				<div style="display: flex; align-items: center; gap: 20px; color: grey">
					<label for="grenade-weapon" v-tooltip.bottom="'In development'"
						>Number of grenades (WIP)</label
					>
					<InputNumber
						v-model="newMenu.numNewGrenadeWeapon"
						id="grenade-weapon"
						inputId="integeronly"
						max="10"
						min="0"
						disabled
						v-tooltip.right="'In development'"
					/>
				</div>

				<div style="display: flex; align-items: center; gap: 20px; color: grey">
					<label for="ranged-explosive-weapon" v-tooltip.bottom="'In development'">
						Number of explosive ranged weapons (WIP)
					</label>
					<InputNumber
						v-model="newMenu.numNewRangedExplosiveWeapon"
						id="ranged-explosive-weapon"
						inputId="integeronly"
						max="10"
						min="0"
						disabled
						v-tooltip.right="'In development'"
					/>
				</div>
				<Button @click="createNewItems()">Confirm</Button>
			</div>
		</header>
		<main>
			<Panel v-for="(weapon, index) in weapons" style="margin: 20px 0" toggleable collapsed>
				<template #header>
					<div class="container-header">
						<span>{{
							weapons[index].gun.label
								? weapons[index].gun.label
								: `Weapon ${index + 1}`
						}}</span>
						<Button
							severity="danger"
							@click="weapons.splice(index, 1)"
							icon="pi pi-times"
							label="DELETE"
						>
						</Button>
					</div>
				</template>
				<FormRangedWeapon :weapon="weapon"></FormRangedWeapon>
			</Panel>
		</main>
		<footer>
			<Button
				v-tooltip.right="'Export weapons as XML'"
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

.container-header {
	display: flex;
	justify-content: space-between;
	width: 100%;
	align-items: center;
}

header,
main,
footer {
	min-height: 50px;
	padding: 10px;
}
</style>
