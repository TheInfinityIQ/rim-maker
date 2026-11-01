<script setup>
import { WeaponRangedBullet } from '@/models/projectile';
import { Verb } from '@/models/weapon';
import { ref } from 'vue';

const isUsingDefaultProjectile = ref(false);

const props = defineProps({
	verbs: {
		required: true,
		type: Array,
	},
	bullet: {
		required: true,
		type: WeaponRangedBullet,
	},
	bulletListItems: {
		required: true,
		type: Array,
	},
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
</script>

<template>
	<Panel class="panel" toggleable header="Bullet" collapsed>
		<div style="display: flex; align-items: center; margin-bottom: 10px">
			<div class="projectile-mode">
				<Button
					:severity="isUsingDefaultProjectile ? '' : 'secondary'"
					@click="isUsingDefaultProjectile = !isUsingDefaultProjectile"
					:disabled="!isUsingDefaultProjectile"
				>
					Create new projectile
				</Button>
				<Button
					:severity="isUsingDefaultProjectile ? 'secondary' : ''"
					@click="isUsingDefaultProjectile = !isUsingDefaultProjectile"
					:disabled="isUsingDefaultProjectile"
				>
					Use existing projectile
				</Button>
			</div>
		</div>

		<Select
			v-if="isUsingDefaultProjectile"
			v-model="props.verbs[0].defaultProjectile"
			:optionLabel="(option) => bulletOptionLabel(option)"
			optionValue="defName"
			:options="props.bulletListItems"
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

		<div v-else>
			<div>
				<label for="bulletLabel">Projectile Name</label>
				<InputText
					v-model="props.bullet.label"
					fluid
					id="bulletLabel"
					placeholder="shotgun blast"
				/>
			</div>
			<div>
				<label for="bulletProjectileDamageAmountBase">Bullet Damage</label>
				<InputText
					fluid
					v-model="props.bullet.projectile.damageAmountBase"
					id="bulletProjectileDamageAmountBase"
					placeholder="18"
				/>
			</div>
			<div>
				<label for="bulletProjectileStoppingPower">Stopping Power</label>
				<InputText
					fluid
					v-model="props.bullet.projectile.stoppingPower"
					id="bulletProjectileStoppingPower"
					placeholder="3"
				/>
			</div>
			<div>
				<label for="bulletProjectileArmorPenetration">
					Armor Penetration <i class="pi pi-question-circle" />
				</label>
				<InputText
					fluid
					v-model="props.bullet.projectile.armorPenetrationBase"
					id="bulletProjectileArmorPenetration"
					placeholder="0.14"
				/>
			</div>
			<div>
				<label for="bulletProjectileSpeed">Projectile Speed</label>
				<InputText
					fluid
					v-model="props.bullet.projectile.speed"
					id="bulletProjectileSpeed"
					placeholder="55"
				/>
			</div>
			<div v-if="'explosionRadius' in props.bullet.projectile">
				<label for="bulletExplosionRadius">Explosion Radius</label>
				<InputText
					fluid
					v-model="props.bullet.projectile.explosionRadius"
					id="bulletExplosionRadius"
					placeholder="5"
				/>
			</div>
		</div>
	</Panel>
</template>
