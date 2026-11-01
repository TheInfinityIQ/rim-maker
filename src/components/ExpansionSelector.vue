<script setup>
import { expansionPacks } from '@/utility/gameDefinitions';
import { useDefinitionStore } from '@/stores/definitions';
const definitions = useDefinitionStore();
</script>

<template>
  <section class="expansion-selector" aria-labelledby="expansion-selector-title">
    <div class="sidebar-title"><span id="expansion-selector-title" class="eyebrow">CONTENT PACKS</span><Tag value="Core included" severity="secondary" /></div>
    <div class="expansion-grid">
      <ToggleButton
        v-for="pack in expansionPacks.filter(pack => pack.id !== 'Core')" :key="pack.id"
        v-model="definitions.enabled[pack.id]" :aria-label="pack.id + ' definitions'"
        v-tooltip.top="(definitions.enabled[pack.id] ? 'Hide ' : 'Include ') + pack.id + ' definitions'"
      >
        <template #default><span class="expansion-choice"><img :src="pack.icon" alt="" width="36" height="36" /><span>{{ pack.id }}</span><span class="expansion-status">{{ definitions.enabled[pack.id] ? 'Included' : 'Not included' }}</span></span></template>
      </ToggleButton>
    </div>
    <p class="expansion-help">Include the expansions your mod will use. Core definitions are always available.</p>
  </section>
</template>
