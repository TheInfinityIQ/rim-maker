<script setup>

import { RecipeMaker } from '@/models/weapon';

const props = defineProps({
	recipeMaker: {
		required: true,
		type: RecipeMaker,
	},
	skillListItems: {
		required: true,
		type: Array,
	},
});
</script>

<template>
	<Panel class="panel" toggleable header="Recipe Skill Requirements" collapsed>
		<Button
			icon="pi pi-plus"
			aria-label="Add skill requirement"
			@click="props.recipeMaker.skillRequirements.push({ defName: '', value: 0 })"
		></Button>

		<Divider></Divider>

		<div v-for="(item, index) in props.recipeMaker.skillRequirements">
			<div class="resource-row">
				<Select
					v-model="item.defName"
					:optionLabel="(option) => `${option.skillLabel} (defName: ${option.defName})`"
					:options="props.skillListItems"
					filter
					optionValue="defName"
				></Select>
				<InputText v-model="item.value"></InputText>
				<Button
					icon="pi pi-times"
					aria-label="Remove skill requirement"
					@click="props.recipeMaker.skillRequirements.splice(index, 1)"
				></Button>
			</div>
			<Divider></Divider>
		</div>
	</Panel>
</template>
