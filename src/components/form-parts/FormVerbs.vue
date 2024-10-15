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
		<InputText fluid placeholder="Time to aim (seconds)" v-model="props.verbs[0].warmupTime" />
		<InputText
			fluid
			placeholder="Total range (number of tiles between weapon and target)"
			v-model="props.verbs[0].range"
		/>

		<InputText
			fluid
			v-model="props.verbs[0].burstShotCount"
			placeholder="Total projectiles fired per burst"
		/>
		<InputText
			fluid
			placeholder="Ticks between each projectile in burst"
			v-model="props.verbs[0].ticksBetweenBurstShots"
		/>
	</Panel>
</template>
