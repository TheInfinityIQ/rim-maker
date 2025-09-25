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
	<Panel class="panel" toggleable collapsed>
		<template #header>
			<p
				style="
					display: flex;
					justify-content: center;
					align-items: center;
					gap: 10px;
					font-weight: bold;
				"
			>
				Cost List
				<i
					v-tooltip.right="'Resources required to craft item'"
					class="pi pi-question-circle"
				></i>
			</p>
		</template>
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
					placeholder="Type of resource"
				></Select>
				<InputNumber
					v-model="item.value"
					inputId="integeronly"
					placeholder="Amount of resource"
				></InputNumber>
				<Button icon="pi pi-times" @click="props.costList.splice(index, 1)"></Button>
			</InputGroup>

			<Divider></Divider>
		</div>
	</Panel>
</template>
