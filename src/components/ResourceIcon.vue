<script setup>
import { computed, ref, watch } from 'vue';
import resources from '@/utility/data/resource-icons.json';
const props = defineProps({ defName: { type: String, default: '' } });
const failed = ref(false);
const url = computed(() => {
  const icon = resources.icons[props.defName];
  return icon ? `${import.meta.env.BASE_URL}resources/${icon.file}` : '';
});
watch(url, () => { failed.value = false; });
</script>

<template>
  <span class="resource-icon" :data-resource="defName" aria-hidden="true">
    <img v-if="url && !failed" :src="url" alt="" width="32" height="32" loading="lazy" @error="failed = true" />
    <i v-else class="pi pi-box" :title="defName ? 'No reference icon available' : 'Choose a resource'" />
  </span>
</template>
