<script setup>
import { computed } from 'vue';
const props = defineProps({ gun: Object });
const choices = ['Metallic', 'Woody', 'Stony', 'Fabric', 'Leathery'];
const enabled = computed({ get: () => Array.isArray(props.gun.stuffCategories), set(value) {
  if (value) { props.gun.stuffCategories = ['Metallic']; props.gun.costStuffCount = 50; }
  else { delete props.gun.stuffCategories; delete props.gun.costStuffCount; if (!props.gun.costList.length) props.gun.costList.push({ defName: 'Steel', value: 50 }); }
} });
</script>
<template>
  <Panel header="Crafting material" toggleable>
    <label class="choice-field"><Checkbox v-model="enabled" binary aria-label="Choose material when crafting" />Choose material when crafting</label>
    <div v-if="enabled" class="dialog-field"><label>Allowed material categories<MultiSelect v-model="gun.stuffCategories" :options="choices" aria-label="Allowed material categories" fluid /></label><label>Material required<InputNumber v-model="gun.costStuffCount" :min="1" aria-label="Material required" fluid /></label></div>
    <p class="form-section-help">Variable materials use costStuffCount and can change the weapon's performance. Cost List entries below are additional fixed ingredients. Turn this off to use only fixed ingredients.</p>
  </Panel>
</template>
