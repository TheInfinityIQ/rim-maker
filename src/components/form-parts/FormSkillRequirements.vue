<script setup>

import { RecipeMaker } from '@/models/weapon';
import { computed, getCurrentInstance, ref } from 'vue';
import { useDefinitionStore } from '@/stores/definitions';
import { recipeResearch, setRecipeResearch, recipeOptions, uniqueDefinitions } from '@/utility/recipeChoices';
import ResourceIcon from '@/components/ResourceIcon.vue';

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
const definitions = useDefinitionStore();
const id = `recipe-${getCurrentInstance().uid}`;
const benches = computed({ get: () => props.recipeMaker.recipeUsers || [], set: values => { props.recipeMaker.recipeUsers = uniqueDefinitions(values); } });
const research = computed({ get: () => recipeResearch(props.recipeMaker), set: values => { setRecipeResearch(props.recipeMaker, values); } });
const benchOptions = computed(() => recipeOptions('benches', definitions.enabledPacks, benches.value));
const researchOptions = computed(() => recipeOptions('research', definitions.enabledPacks, research.value));
// Reserve clear-button space for wrapped chips and keep search results from moving under the pointer.
const selectionLayout = {
  labelContainer: { style: { minWidth: '0', paddingInlineEnd: '1.5rem' } },
  label: { style: { display: 'flex', flexWrap: 'wrap', gap: '.35rem' } },
  chipItem: { style: { maxWidth: '100%', overflow: 'hidden' } },
  pcChip: {
    root: { style: { maxWidth: '100%' } },
    label: { style: { minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis' } },
    removeIcon: { style: { flexShrink: '0' } },
  },
  listContainer: { style: { height: '14rem' } },
  overlay: { style: { maxWidth: 'calc(100vw - 2rem)' } },
};
const customKind = ref(null), customId = ref('');
const customValid = computed(() => /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(customId.value.trim()));
function openCustom(kind) { customId.value = ''; customKind.value = kind; }
function addCustom() {
  if (!customValid.value) return;
  const selection = customKind.value === 'bench' ? benches : research;
  selection.value = [...selection.value, customId.value.trim()];
  customKind.value = null;
}
</script>

<template>
	<Panel class="panel" toggleable header="Recipe maker" collapsed>
		<p class="form-section-help">recipeMaker · Where this weapon is crafted, its research requirement and the crafter's minimum skills.</p>
		<div class="editor-field"><label :for="`${id}-benches`">Crafting benches</label>
          <MultiSelect :input-id="`${id}-benches`" v-model="benches" :options="benchOptions" option-label="label" option-value="defName" :filter-fields="['label', 'defName', 'pack']" filter reset-filter-on-hide display="chip" show-clear fluid :pt="selectionLayout" aria-label="Crafting benches" :aria-describedby="`${id}-bench-help`" placeholder="Choose crafting benches">
            <template #option="{ option }"><div class="recipe-choice"><ResourceIcon :def-name="option.defName" kind="bench" /><span>{{ option.label }}<small>{{ option.defName }} · {{ option.pack }}</small></span></div></template>
            <template #footer><Button label="Add custom bench definition" icon="pi pi-plus" text @click="openCustom('bench')" /></template>
          </MultiSelect>
          <small :id="`${id}-bench-help`">recipeUsers · Tick every bench that should offer this recipe. Options follow the enabled expansions.</small>
        </div>
		<div class="editor-field"><label :for="`${id}-research`">Required research</label>
          <MultiSelect :input-id="`${id}-research`" v-model="research" :options="researchOptions" option-label="label" option-value="defName" :filter-fields="['label', 'defName', 'pack']" filter reset-filter-on-hide display="chip" show-clear fluid :pt="selectionLayout" aria-label="Required research" :aria-describedby="`${id}-research-help`" placeholder="No research requirement">
            <template #option="{ option }"><div class="recipe-choice"><i class="pi pi-book" aria-hidden="true" /><span>{{ option.label }}<small>{{ option.defName }} · {{ option.pack }}</small></span></div></template>
            <template #footer><Button label="Add custom research definition" icon="pi pi-plus" text @click="openCustom('research')" /></template>
          </MultiSelect>
          <small :id="`${id}-research-help`">All selected projects must be completed. Exports researchPrerequisite and researchPrerequisites using their game definition IDs.</small>
        </div>
		<Button
			icon="pi pi-plus"
			aria-label="Add skill requirement"
			@click="props.recipeMaker.skillRequirements.push({ defName: '', value: 0 })"
		></Button>

		<Divider></Divider>

		<div v-for="(item, index) in props.recipeMaker.skillRequirements">
			<div class="resource-row">
				<Select
					:aria-label="`Required skill ${index + 1}`"
					placeholder="Choose a skill"
					v-model="item.defName"
					:optionLabel="(option) => `${option.skillLabel} (defName: ${option.defName})`"
					:options="props.skillListItems"
					filter reset-filter-on-hide
					optionValue="defName"
				></Select>
				<InputNumber v-model="item.value" :aria-label="`Required skill ${index + 1} level`" :min="0" :max="20" :max-fraction-digits="0" :use-grouping="false" />
				<Button
					icon="pi pi-times"
					aria-label="Remove skill requirement"
					@click="props.recipeMaker.skillRequirements.splice(index, 1)"
				></Button>
			</div>
			<Divider></Divider>
		</div>
	</Panel>
	<Dialog :visible="Boolean(customKind)" @update:visible="visible => { if (!visible) customKind = null; }" modal :header="customKind === 'bench' ? 'Custom crafting bench' : 'Custom research project'" :style="{ width: '28rem', maxWidth: 'calc(100vw - 2rem)' }">
      <form @submit.prevent="addCustom">
        <p>For a definition supplied by another mod. Enter its exact defName and include that mod when testing in RimWorld.</p>
        <div class="editor-field"><label :for="`${id}-custom`">Definition ID</label><InputText :id="`${id}-custom`" v-model="customId" autofocus fluid autocomplete="off" :aria-describedby="`${id}-custom-help`" /><small :id="`${id}-custom-help`">Use letters, numbers, underscores, periods or hyphens.</small></div>
        <Button type="submit" label="Add definition" :disabled="!customValid" />
      </form>
    </Dialog>
</template>
<style scoped>
.recipe-choice { display: flex; align-items: center; gap: 12px; min-width: 0; white-space: normal; }
.recipe-choice > span { min-width: 0; overflow-wrap: anywhere; }
.recipe-choice small { display: block; color: var(--p-text-muted-color); font-size: 11px; margin-top: 4px; }
.editor-field > small { color: var(--p-text-muted-color); line-height: 1.6; }
</style>
