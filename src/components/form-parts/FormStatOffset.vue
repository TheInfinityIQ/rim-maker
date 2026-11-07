<script setup>


const props = defineProps({
	equippedStatOffsets: {
		required: true,
		type: Array,
	},
	statListItems: {
		required: true,
		type: Array,
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
				Stat Offsets
				<a href="https://rimworldwiki.com/wiki/Stat" target="_blank">
					<i
						v-tooltip.right="
							'Stats that are affected when a pawn has the weapon equipped. Click the icon to learn more about stats'
						"
						class="pi pi-question-circle"
					></i>
				</a>
			</p>
		</template>

		<Button
			icon="pi pi-plus"
			aria-label="Add stat offset"
			@click="props.equippedStatOffsets.push({ defName: '', value: 0 })"
		></Button>

		<Divider></Divider>

		<div v-for="(item, index) in props.equippedStatOffsets">
			<div class="resource-row">
				<Select
					:aria-label="`Equipped stat ${index + 1}`"
					placeholder="Choose a stat"
					v-model="item.defName"
					:optionLabel="(option) => `${option.label} (defName: ${option.defName})`"
					:options="props.statListItems"
					filter reset-filter-on-hide
					optionValue="defName"
				></Select>
				<InputText v-model="item.value" inputmode="decimal" :aria-label="`Equipped stat ${index + 1} offset`" placeholder="Offset (negative or positive)" />
				<Button
					icon="pi pi-times"
					aria-label="Remove stat offset"
					@click="props.equippedStatOffsets.splice(index, 1)"
				></Button>
			</div>
			<Divider></Divider>
		</div>
	</Panel>
</template>
