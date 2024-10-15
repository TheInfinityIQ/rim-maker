<script setup>
import { defineProps } from 'vue';
import { Tool } from '@/models/weapon';

const props = defineProps({
	tools: {
		required: true,
		type: [Tool],
	},
	toolListItems: {
		required: true,
		type: [],
	},
});

function isOptionDisabled(toolCapacities, toolCapacityOption) {
	const selectedOptions = props.tools.map((tool) => tool.capacities[0]);

	return (
		toolCapacities[0] != toolCapacityOption.defName &&
		selectedOptions.includes(toolCapacityOption.defName)
	);
}
</script>

<template>
	<Panel class="panel" toggleable header="Tools" collapsed>
		<Button icon="pi pi-plus" @click="props.tools.push(new Tool())"></Button>

		<div v-for="tool in props.tools">
			<Select
				v-model="tool.capacities[0]"
				:optionDisabled="(option) => isOptionDisabled(tool.capacities, option)"
				:options="props.toolListItems"
				optionValue="defName"
				optionLabel="label"
			>
			</Select>
			<InputText
				v-model="tool.label"
				:id="tool.label"
				fluid
				:placeholder="`Value to display in health tab when damaged by this tool`"
			/>
			<InputText
				v-model="tool.power"
				:id="tool.power"
				fluid
				:placeholder="`Damage part of weapon does.`"
			/>
			<InputText
				v-model="tool.cooldownTime"
				:id="tool.cooldownTime"
				fluid
				:placeholder="`Seconds (on 1x speed) between hits.`"
			/>
			<Button icon="pi pi-times"></Button>
			<Divider></Divider>
		</div>
	</Panel>
</template>
