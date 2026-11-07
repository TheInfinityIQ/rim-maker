<script setup>
import SectionReference from './SectionReference.vue';


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
	<Panel class="panel" toggleable header="Stat Offsets" collapsed>
        <p class="form-section-help">These bonuses or penalties affect the pawn while this weapon is equipped, rather than changing the weapon's own Stat Bases. Removing the weapon removes its contribution.</p>
        <p class="form-section-help">Choose a pawn stat and enter an additive offset in that stat's units. For example, Move Speed +0.2 adds 0.2 cells per second; a negative value reduces it. Percentage stats use decimal values: +0.05 means five percentage points, not a 5% multiplier.</p>
        <p class="form-section-help">Only stats that RimWorld evaluates for the equipped pawn have an effect here. Use the native game test to verify unusual modifiers; adding a stat to this list does not make it applicable to every weapon.</p>

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
		<SectionReference href="https://rimworldwiki.com/wiki/Stat" label="Stats and modifiers" />
	</Panel>
</template>
