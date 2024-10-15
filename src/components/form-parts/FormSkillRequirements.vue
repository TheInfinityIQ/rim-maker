<script setup>
import { defineProps } from 'vue';
import { RecipeMaker } from '@/models/weapon';

const props = defineProps({
	recipeMaker: {
		required: true,
		type: RecipeMaker,
	},
	skillListItems: {
		required: true,
		type: [],
	},
});
</script>

<template>
	<Panel class="panel" toggleable header="Recipe Skill Requirements" collapsed>
		<Button
			icon="pi pi-plus"
			@click="props.recipeMaker.skillRequirements.push({ defName: '', value: 0 })"
		></Button>

		<Divider></Divider>

		<div v-for="(item, index) in props.recipeMaker.skillRequirements">
			<InputGroup>
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
					@click="props.recipeMaker.skillRequirements.splice(index, 1)"
				></Button>
			</InputGroup>
			<Divider></Divider>
		</div>
	</Panel>
</template>
