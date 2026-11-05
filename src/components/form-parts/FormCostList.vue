<script setup>


const props = defineProps({
	costList: {
		required: true,
		type: Array,
	},
	costListItems: {
		required: true,
		type: Array,
	},
});
</script>

<template>
	<Panel class="panel" toggleable>
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
		<Button icon="pi pi-plus" aria-label="Add resource" @click="props.costList.push({ defName: '', value: 1 })"></Button>

		<Divider></Divider>

		<div v-for="(item, index) in props.costList">
			<div class="resource-row">
				<Select
					:aria-label="`Resource ${index + 1}`"
					v-model="item.defName"
					:optionLabel="(option) => `${option.label} (defName: ${option.defName})`"
					:options="props.costListItems"
					filter
					optionValue="defName"
					placeholder="Type of resource"
				></Select>
				<InputNumber
					v-model="item.value"
					:aria-label="`Resource ${index + 1} amount`"
					:min="0"
					:max-fraction-digits="0"
					:use-grouping="false"
					placeholder="Amount of resource"
				></InputNumber>
				<Button icon="pi pi-times" aria-label="Remove resource" @click="props.costList.splice(index, 1)"></Button>
			</div>

			<Divider></Divider>
		</div>
	</Panel>
</template>
