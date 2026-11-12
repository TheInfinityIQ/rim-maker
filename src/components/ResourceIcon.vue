<script setup>
import { computed, ref, watch } from 'vue';
import resources from '@/utility/data/resource-icons.json';
import benches from '@/utility/data/bench-icons.json';
const props = defineProps({ defName: { type: String, default: '' }, size: { type: Number, default: 32 }, kind: { type: String, default: 'resource' } });
const failed = ref(false);
const url = computed(() => {
  const icon = (props.kind === 'bench' ? benches : resources).icons[props.defName];
  return icon ? `${import.meta.env.BASE_URL}${props.kind === 'bench' ? 'benches' : 'resources'}/${icon.file}` : '';
});
watch(url, () => { failed.value = false; });
</script>

<template>
  <span class="resource-icon" :data-resource="kind === 'resource' ? defName : undefined" :data-bench="kind === 'bench' ? defName : undefined" :style="{ width: `${size}px`, height: `${size}px`, flexBasis: `${size}px` }" aria-hidden="true">
    <img v-if="url && !failed" :src="url" alt="" width="32" height="32" loading="lazy" @error="failed = true" />
    <i v-else :class="kind === 'bench' ? 'pi pi-hammer' : 'pi pi-box'" :title="defName ? 'No reference icon available' : 'Choose a definition'" />
  </span>
</template>
