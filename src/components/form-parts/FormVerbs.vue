<script setup>
import { defineProps } from 'vue';
import { Verb } from '@/models/weapon.js';

const props = defineProps({
	verbs: {
		required: true,
		type: [Verb],
	},
});
</script>

<template>
	<Panel class="panel" toggleable header="Verbs" collapsed>
		<div>
			<label for="weaponTimeToAim">
				Time to aim (seconds)
				<!-- <span v-if="weaponGunLabelValidationMessage.length" class="warning">
					{{ weaponGunLabelValidationMessage }}
				</span> -->
			</label>
			<InputText
				id="weaponTimeToAim"
				fluid
				placeholder="0.9"
				v-model="props.verbs[0].warmupTime"
			/>
		</div>
		<div>
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
			<InputText id="weaponRange" fluid placeholder="15.9" v-model="props.verbs[0].range" />
		</div>
		<div>
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
				fluid
				v-model="props.verbs[0].burstShotCount"
				placeholder="Total projectiles fired per burst"
			/>
		</div>
		<div>
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
				fluid
				placeholder="Ticks between each projectile in burst"
				v-model="props.verbs[0].ticksBetweenBurstShots"
			/>
		</div>
	</Panel>
</template>
