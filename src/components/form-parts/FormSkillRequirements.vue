<script setup>

import { RecipeMaker } from '@/models/weapon';
import { ref, watch } from 'vue';

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
const benchInput = ref(props.recipeMaker.recipeUsers?.join(', ') || '');
watch(() => props.recipeMaker.recipeUsers, values => { benchInput.value = values?.join(', ') || ''; });
function commitBenches() { props.recipeMaker.recipeUsers = benchInput.value.split(',').map(value => value.trim()).filter(Boolean); }
</script>

<template>
	<Panel class="panel" toggleable header="Recipe maker" collapsed>
		<p class="form-section-help">recipeMaker · Where this weapon is crafted, its research requirement and the crafter's minimum skills.</p>
		<p class="form-section-help">Crafting benches are the worktables that offer this recipe. Enter their exact definition names, such as ElectricSmithy, separated by commas. Research is the prerequisite for unlocking the recipe; leave it blank for no requirement. Skill requirements are minimum crafter levels, not bonuses to the finished weapon. Ingredients are set in Cost List and Crafting material; workload is in Weapon → Stat Bases.</p>
		<label class="dialog-field">Crafting benches (defNames, separated by commas)<InputText v-model="benchInput" @blur="commitBenches" @keydown.enter="commitBenches" aria-label="Crafting benches" fluid /></label>
		<label class="dialog-field">Required research<InputText v-model="recipeMaker.researchPrerequisite" placeholder="No research requirement" aria-label="Required research" fluid /></label>
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
</template>
