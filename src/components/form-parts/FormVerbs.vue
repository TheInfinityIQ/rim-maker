<script setup>

import { WeaponRanged } from '@/models/weapon.js';

const props = defineProps({
	weapon: { required: true, type: WeaponRanged },
	explosive: { type: Boolean, default: false },
	verbs: {
		required: true,
		type: Array,
	},
});
</script>

<template>
	<Panel class="panel" toggleable header="Verbs">
		<p class="form-section-help">verbs · {{ weapon.kind === 'grenade' ? 'How this weapon is thrown.' : 'How this weapon fires.' }} <Tag :value="verbs[0].verbClass" severity="secondary" /></p>
		<div class="verbs-fields">
		<div v-if="explosive">
			<label for="weaponForcedMissRadius">Forced miss radius (tiles)</label>
			<InputNumber inputId="weaponForcedMissRadius" v-model="props.verbs[0].forcedMissRadius" :min="0.001" :maxFractionDigits="3" fluid />
			<p class="form-section-help">RimWorld requires a positive forced miss radius for explosive ammunition. The starting value is 1 tile; tune it to match your weapon.</p>
		</div>
		<div class="editor-field">
			<label for="weaponTimeToAim">
				{{ weapon.kind === 'grenade' ? 'Time to prepare throw (seconds)' : 'Time to aim (seconds)' }}
				<!-- <span v-if="weaponGunLabelValidationMessage.length" class="warning">
					{{ weaponGunLabelValidationMessage }}
				</span> -->
			</label>
			<InputText
				id="weaponTimeToAim"
				inputmode="decimal"
				fluid
				placeholder="0.9"
				v-model="props.verbs[0].warmupTime"
			/>
		</div>
		<div class="editor-field">
			<label for="weaponRange">
				Total range
				<i
					v-tooltip.right="'Number of tiles between weapon and target'"
					class="pi pi-question-circle"
				/>
				<!-- <span v-if="weaponGunLabelValidationMessage.length" class="warning">
					{{ weaponGunLabelValidationMessage }}
				</span> -->
			</label>
			<InputText id="weaponRange" inputmode="decimal" fluid placeholder="15.9" v-model="props.verbs[0].range" />
		</div>
		<div class="editor-field">
			<label for="weaponBurstShotCount">
				Total projectiles fired per burst
				<i
					v-tooltip.right="
						'Set to 1 for single burst\n\n***(Note) Shotguns in the game may look like they have many projectiles but it is a single texture that looks like a group of projectiles and is therefore 1 projectile'
					"
					class="pi pi-question-circle"
				/>
				<!-- <span v-if="weaponGunLabelValidationMessage.length" class="warning">
					{{ weaponGunLabelValidationMessage }}
				</span> -->
			</label>
			<InputText
				id="weaponBurstShotCount"
				inputmode="numeric"
				fluid
				v-model="props.verbs[0].burstShotCount"
				placeholder="Total projectiles fired per burst"
			/>
		</div>
		<div class="editor-field">
			<label for="weaponTicketsBetweenProjectileInShotBurst">
				Ticks between each projectile in burst
				<i
					v-tooltip.right="
						'- 60 ticks per second at 1x game speed\n- 180 ticks per second at 2x game speed\n- 360 ticks per second at 3x game speed'
					"
					class="pi pi-question-circle"
				/>
				<!-- <span v-if="weaponGunLabelValidationMessage.length" class="warning">
					{{ weaponGunLabelValidationMessage }}
				</span> -->
			</label>
			<InputText
				id="weaponTicketsBetweenProjectileInShotBurst"
				inputmode="numeric"
				fluid
				placeholder="Ticks between each projectile in burst"
				v-model="props.verbs[0].ticksBetweenBurstShots"
			/>
		</div>
		<slot /></div>
	</Panel>
</template>
