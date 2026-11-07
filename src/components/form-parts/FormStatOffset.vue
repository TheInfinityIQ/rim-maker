<script setup>
import SectionReference from './SectionReference.vue';
import { getCurrentInstance } from 'vue';
const id = `equipped-stat-${getCurrentInstance().uid}`;

function percentageStat(item) { return props.statListItems.find(stat => stat.defName === item.defName)?.toStringStyle?.startsWith('Percent'); }
function points(item) { return item.value == null || item.value === '' ? null : Number((Number(item.value) * 100).toPrecision(12)); }
function updatePoints(item, value) { item.value = value == null ? null : Number((value / 100).toPrecision(12)); }
function signed(value) { return value == null || value === '' ? 'No offset entered' : `${Number(value) > 0 ? '+' : ''}${value}`; }

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
        <p class="form-section-help">For percentage stats, enter percentage points directly: 5 adds five points, -5 removes five points. The translator shows the actual decimal offset added in the game: +5 points becomes +0.05. For example, 80% plus five points becomes 85%, before other applicable modifiers; this is not a 5% multiplier.</p>
        <p class="form-section-help">Other stats keep their own units. For example, Move Speed +0.2 adds 0.2 cells per second. The readout shows the stored offset, not the pawn's final stat or final chance to hit.</p>
        <p class="form-section-help">Only stats that RimWorld evaluates for the equipped pawn have an effect here. Use the native game test to verify unusual modifiers; adding a stat to this list does not make it applicable to every weapon.</p>

		<Button
			icon="pi pi-plus"
			aria-label="Add stat offset"
			@click="props.equippedStatOffsets.push({ defName: '', value: 0 })"
		></Button>

		<Divider></Divider>

		<div v-for="(item, index) in props.equippedStatOffsets">
			<div class="resource-row resource-row--offset">
                <div class="editor-field"><label :for="`${id}-${index}`">Pawn stat</label>
				<Select
					:input-id="`${id}-${index}`"
					:aria-label="`Equipped stat ${index + 1}`"
					placeholder="Choose a stat"
					v-model="item.defName"
					:optionLabel="(option) => `${option.label} (defName: ${option.defName})`"
					:options="props.statListItems"
					filter reset-filter-on-hide
					optionValue="defName"
				></Select></div>
				<label v-if="percentageStat(item)" class="editor-field">Percentage points<InputNumber :model-value="points(item)" @update:model-value="updatePoints(item, $event)" :aria-label="`Equipped stat ${index + 1} percentage points`" :max-fraction-digits="6" :use-grouping="false" placeholder="e.g. 5" fluid /></label>
				<label v-else class="editor-field">Offset<InputText v-model="item.value" inputmode="decimal" :aria-label="`Equipped stat ${index + 1} offset`" placeholder="Offset (negative or positive)" /></label>
				<Button
					icon="pi pi-times"
					aria-label="Remove stat offset"
					@click="props.equippedStatOffsets.splice(index, 1)"
				></Button>
			</div>
			<p class="form-section-help" :data-testid="`stat-offset-value-${index + 1}`" aria-live="polite">{{ percentageStat(item) ? `${points(item) ?? '—'} percentage points → ` : '' }}Actual offset added: <strong>{{ signed(item.value) }}</strong></p>
			<Divider></Divider>
		</div>
		<SectionReference href="https://rimworldwiki.com/wiki/Stat" label="Stats and modifiers" />
	</Panel>
</template>
