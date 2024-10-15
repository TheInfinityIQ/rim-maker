<script setup>
import { WeaponRangedBullet } from '@/models/projectile';
import { Verb } from '@/models/weapon';
import { defineProps } from 'vue';

const props = defineProps({
	verbs: {
		required: true,
		type: [Verb],
	},
	bullet: {
		required: true,
		type: WeaponRangedBullet,
	},
	bulletListItems: {
		required: true,
		type: [],
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
		<InputGroup>
			<Select
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

			<Button
				v-if="props.verbs[0].defaultProjectile"
				icon="pi pi-times"
				label="Clear selection"
				@click="props.verbs[0].defaultProjectile = ''"
			></Button>
			<Button
				v-else
				icon="pi pi-plus"
				label="Create bullet"
				@click="props.verbs[0].defaultProjectile = ''"
			></Button>
		</InputGroup>

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
	</Panel>
</template>
