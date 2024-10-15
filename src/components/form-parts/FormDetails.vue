<script setup>
import { defineProps, computed } from 'vue';
import { WeaponRangedGun } from '@/models/weapon';
import { LABEL_MESSAGE_KEYS, invalidLabelMessage } from '@/utility/weaponFormRules';

const props = defineProps({
	gun: {
		required: true,
		type: WeaponRangedGun,
	},
});

const isWeaponGunLabelInvalid = computed(() => {
	return /^[0-9]$/.test(props.gun.label.trim().charAt(props.gun.label.trim().length - 1))
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
			<label for="weaponName">
				Weapon Name
				<span v-if="weaponGunLabelValidationMessage.length" class="warning">
					{{ weaponGunLabelValidationMessage }}
				</span>
			</label>
			<InputText
				v-model="props.gun.label"
				:invalid="isWeaponGunLabelInvalid"
				fluid
				id="weaponName"
				placeholder="pump shotgun"
			/>
		</div>

		<div>
			<label for="weaponDescription">Weapon Definition</label>
			<Textarea
				v-model="props.gun.description"
				fluid
				id="weaponDescription"
				placeholder="An ancient design of shotgun that emits a tight-packed spray of pellets. Deadly, but short range."
			/>
		</div>
	</Panel>
</template>
