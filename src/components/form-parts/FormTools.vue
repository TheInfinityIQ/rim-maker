<script setup>
import { defineProps } from 'vue';
import { Tool } from '@/models/weapon';

const props = defineProps({
	tools: {
		required: true,
		type: [Tool],
	},
	toolListItems: {
		required: true,
		type: [],
	},
});

function isOptionDisabled(toolCapacities, toolCapacityOption) {
	const selectedOptions = props.tools.map((tool) => tool.capacities[0]);

	return (
		toolCapacities[0] != toolCapacityOption.defName &&
		selectedOptions.includes(toolCapacityOption.defName)
	);
}
</script>

<template>
	<Panel class="panel" toggleable header="Tools" collapsed>
		<Button icon="pi pi-plus" @click="props.tools.push(new Tool())"></Button>
		<Divider></Divider>
		<div
			v-for="(tool, index) in props.tools"
			style="display: flex; flex-direction: column; gap: 20px"
		>
			<div class="container-header">
				<div style="display: flex; justify-content: space-between; width: 100%">
					<div style="display: flex; flex-direction: column">
						<label for="toolDamageType">
							Damage Type
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
						<Select
							id="toolDamageType"
							v-model="tool.capacities[0]"
							:optionDisabled="(option) => isOptionDisabled(tool.capacities, option)"
							:options="props.toolListItems"
							optionValue="defName"
							optionLabel="label"
						>
						</Select>
					</div>
					<Button
						severity="danger"
						icon="pi pi-times"
						variant="text"
						rounded
						@click="props.tools.splice(index, 1)"
					></Button>
				</div>
			</div>
			<div>
				<label :for="tool.label">
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
					:id="tool.label"
					fluid
					:placeholder="`Value in Health tab when damaged by this tool`"
				/>
			</div>
			<div>
				<label :for="tool.power">
					Damage amount
					<i
						v-tooltip="'Total damage done by tool per hit'"
						class="pi pi-question-circle"
					/>
				</label>
				<InputText
					v-model="tool.power"
					:id="tool.power"
					fluid
					:placeholder="`Damage part of weapon does.`"
				/>
			</div>
			<div>
				<label :for="tool.cooldownTime">
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
					:id="tool.cooldownTime"
					fluid
					:placeholder="`Seconds (on 1x speed) between hits.`"
				/>
			</div>
			<Divider></Divider>
		</div>
	</Panel>
</template>
