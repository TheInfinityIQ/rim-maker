<script setup>

import { Tool } from '@/models/weapon';
import { getCurrentInstance } from 'vue';
const id = `melee-tool-${getCurrentInstance().uid}`;

const props = defineProps({
	expanded: Boolean,
	tools: {
		required: true,
		type: Array,
	},
	toolListItems: {
		required: true,
		type: Array,
	},
});

</script>

<template>
	<Panel class="panel" toggleable header="Tools" :collapsed="!expanded">
		<Button icon="pi pi-plus" aria-label="Add melee tool" @click="props.tools.push(new Tool())"></Button>
		<Divider></Divider>
		<div
			v-for="(tool, index) in props.tools"
			class="tool-fields"
		>
			<Divider v-if="index > 0" />
			<div class="container-header">
				<div style="display: flex; justify-content: space-between; width: 100%">
					<div class="tool-capacities">
						<label :for="`${id}-${index}-type`">
							Attack capacities
							<a
								href="https://rimworldwiki.com/wiki/Damage_Types#Damage_types"
								target="_blank"
							>
								<i
									v-tooltip="
										'Damage type of the weapon. Learn more by clicking the question mark icon.'
									"
									class="pi pi-question-circle"
								/>
							</a>
						</label>
						<MultiSelect
							:input-id="`${id}-${index}-type`"
							v-model="tool.capacities"
							:options="props.toolListItems"
							optionValue="defName"
							optionLabel="label"
							fluid
						>
						</MultiSelect>
					</div>
					<Button
						severity="danger"
						icon="pi pi-times"
						:aria-label="`Remove melee tool ${index + 1}`"
						variant="text"
						rounded
						@click="props.tools.splice(index, 1)"
					></Button>
				</div>
			</div>
			<div class="editor-field">
				<label :for="`${id}-${index}-label`">
					Label
					<i
						v-tooltip="
							'The value that is displayed in the Health Tab when damaged by this weapon.\n\nThink bayonet, stock, barrel, etc.'
						"
						class="pi pi-question-circle"
					/>
				</label>
				<InputText
					v-model="tool.label"
					:id="`${id}-${index}-label`"
					fluid
					:placeholder="`Value in Health tab when damaged by this tool`"
				/>
			</div>
			<div class="editor-field">
				<label :for="`${id}-${index}-power`">
					Damage amount
					<i
						v-tooltip="'Total damage done by tool per hit'"
						class="pi pi-question-circle"
					/>
				</label>
				<InputText
					v-model="tool.power"
					:id="`${id}-${index}-power`"
					inputmode="decimal"
					fluid
					:placeholder="`Damage part of weapon does.`"
				/>
			</div>
			<div class="editor-field">
				<label :for="`${id}-${index}-cooldown`">
					Tool Cooldown Time
					<i
						v-tooltip="
							'Total seconds on 1x game speed inbetween hits. On higher game speeds, seconds pass faster'
						"
						class="pi pi-question-circle"
					/>
				</label>
				<InputText
					v-model="tool.cooldownTime"
					:id="`${id}-${index}-cooldown`"
					inputmode="decimal"
					fluid
					:placeholder="`Seconds (on 1x speed) between hits.`"
				/>
			</div>
			<Divider></Divider>
			<div class="projectile-number-grid"><label>Armour penetration (1 = 100%)<InputNumber v-model="tool.armorPenetration" :min="0" :max-fraction-digits="3" placeholder="Game default" :aria-label="`Melee tool ${index + 1} armour penetration`" fluid /></label><label>Attack selection weight<InputNumber v-model="tool.chanceFactor" :min="0" :max-fraction-digits="3" placeholder="1" :aria-label="`Melee tool ${index + 1} selection weight`" fluid /></label></div>
		</div>
	</Panel>
</template>
