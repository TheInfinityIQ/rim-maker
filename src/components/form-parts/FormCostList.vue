<script setup>
import { defineProps } from 'vue';

const props = defineProps({
	costList: {
		required: true,
		type: Object,
	},
	costListItems: {
		required: true,
		type: [],
	},
});
</script>

<template>
	<Panel class="panel" toggleable header="Cost List" collapsed>
		<Button icon="pi pi-plus" @click="props.costList.push({ defName: '', value: 0 })"></Button>

		<Divider></Divider>

		<div v-for="(item, index) in props.costList">
			<InputGroup>
				<Select
					v-model="item.defName"
					:optionLabel="(option) => `${option.label} (defName: ${option.defName})`"
					:options="props.costListItems"
					filter
					optionValue="defName"
				></Select>
				<InputText v-model="item.value"></InputText>
				<Button icon="pi pi-times" @click="props.costList.splice(index, 1)"></Button>
			</InputGroup>

			<Divider></Divider>
		</div>
	</Panel>
</template>
