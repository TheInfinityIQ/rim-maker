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
			<Button label="Make a Weapon" @click="isSelectItemOpen = true" />

			<div v-if="isSelectItemOpen" class="creation-menu">
				<div class="creation-menu-options">
					<FloatLabel variant="on">
						<InputNumber
							v-model="newMenu.numNewRangedWeapon"
							id="ranged-weapon"
							inputId="integeronly"
							max="10"
							min="0"
						></InputNumber>
						<label for="ranged-weapon">Number of ranged weapons</label>
					</FloatLabel>

					<FloatLabel variant="on">
						<InputNumber
							v-model="newMenu.numNewMeleeWeapon"
							id="melee-weapon"
							inputId="integeronly"
							max="10"
							min="0"
						></InputNumber>
						<label for="melee-weapon">Number of melee weapons</label>
					</FloatLabel>

					<FloatLabel variant="on">
						<InputNumber
							v-model="newMenu.numNewGrenadeWeapon"
							id="grenade-weapon"
							inputId="integeronly"
							max="10"
							min="0"
						></InputNumber>
						<label for="grenade-weapon">Number of grenades</label>
					</FloatLabel>

					<FloatLabel variant="on">
						<InputNumber
							v-model="newMenu.numNewRangedExplosiveWeapon"
							id="ranged-explosive-weapon"
							inputId="integeronly"
							max="10"
							min="0"
						></InputNumber>
						<label for="ranged-explosive-weapon">
							Number of explosive ranged weapons
						</label>
					</FloatLabel>
				</div>
				<Button @click="createNewItems()">Submit</Button>
			</div>
		</header>
		<main>
			<Panel v-for="(weapon, index) in weapons" style="margin: 20px 0" toggleable collapsed>
				<template #header>
					<div
						style="
							display: flex;
							justify-content: space-between;
							width: 100%;
							align-items: center;
						"
					>
						<span>{{
							weapons[index].gun.label
								? weapons[index].gun.label
								: `Weapon ${index + 1}`
						}}</span>
						<Button severity="danger" @click="weapons.splice(index, 1)">
							DELETE
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

header,
main,
footer {
	min-height: 50px;
	padding: 10px;
}

.creation-menu {
	height: 120px;
	padding: 10px 0;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.creation-menu-options {
	display: flex;
	width: 100%;
	justify-content: space-around;
}

.creation-menu-options > FloatLabel {
	width: 25%;
}
</style>
