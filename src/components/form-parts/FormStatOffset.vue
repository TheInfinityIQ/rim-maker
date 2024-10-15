<script setup>
import { defineProps } from 'vue';

const props = defineProps({
	equippedStatOffsets: {
		required: true,
		type: Object,
	},
	statListItems: {
		required: true,
		type: [],
	},
});
</script>

<template>
	<Panel class="panel" toggleable header="Stat Offsets" collapsed>
		<Button
			icon="pi pi-plus"
			@click="props.equippedStatOffsets.push({ defName: '', value: 0 })"
		></Button>

		<Divider></Divider>

		<div v-for="(item, index) in props.equippedStatOffsets">
			<InputGroup>
				<Select
					v-model="item.defName"
					:optionLabel="(option) => `${option.label} (defName: ${option.defName})`"
					:options="props.statListItems"
					filter
					optionValue="defName"
				></Select>
				<InputText v-model="item.value"></InputText>
				<Button
					icon="pi pi-times"
					@click="props.equippedStatOffsets.splice(index, 1)"
				></Button>
			</InputGroup>
			<Divider></Divider>
		</div>
	</Panel>
</template>
