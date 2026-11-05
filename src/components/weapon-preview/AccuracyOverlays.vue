<script setup>
import { computed, reactive, watch } from 'vue';
import data from '@/utility/data/accuracyOverlays.json';
import { useDefinitionStore } from '@/stores/definitions';
const emit = defineEmits(['change']);
const definitions = useDefinitionStore();
const enabled = reactive({ weather: false, quality: false, skill: false, cover: false });
const selected = reactive({ weather: ['Rain', 'Fog'], quality: ['Awful', 'Legendary'], skill: [0, 5, 10, 15, 20], cover: ['Sandbags'] });
const categories = [{ id: 'weather', label: 'Weather' }, { id: 'quality', label: 'Weapon quality' }, { id: 'skill', label: 'Shooting skill' }, { id: 'cover', label: 'Cover' }];
const options = computed(() => ({
  weather: data.weather.filter(row => definitions.enabledPacks.includes(row.pack)).map(row => ({ ...row, label: `${row.label} (${Math.round(row.factor * 100)}%)` })),
  quality: data.qualities,
  skill: [0, 5, 10, 15, 20].map(value => ({ id: value, label: `Shooting ${value}` })),
  cover: data.cover.map(row => ({ ...row, label: `${row.label} (${Math.round(row.blockChance * 100)}% base block)` })),
}));
watch(() => options.value.weather, rows => { selected.weather = selected.weather.filter(id => rows.some(row => row.id === id)); });
const series = computed(() => categories.flatMap(category => enabled[category.id] ? options.value[category.id].filter(row => selected[category.id].includes(row.id)).map(row => ({
  id: `${category.id}:${row.id}`, label: category.id === 'skill' ? row.label : `${category.label}: ${row.label}`, conditions: category.id === 'skill' ? {} : { [category.id]: row.id }, skill: category.id === 'skill' ? row.id : null,
})) : []));
// Computed state keeps disabled content packs out of the comparison as well as the picker.
watch(series, value => emit('change', value), { immediate: true });
function clear() { for (const category of categories) enabled[category.id] = false; }
</script>

<template>
  <section class="accuracy-overlays" aria-label="Accuracy comparison overlays">
    <div class="weapon-preview__header"><h4>Comparison overlays</h4><Button label="Clear overlays" link :fluid="false" :disabled="!Object.values(enabled).some(Boolean)" @click="clear" /></div>
    <div class="accuracy-overlays__fields">
      <div v-for="category in categories" :key="category.id" class="accuracy-overlays__field">
        <ToggleButton v-model="enabled[category.id]" :aria-label="`${category.label} overlays`" :on-label="category.label" :off-label="category.label" on-icon="pi pi-check" off-icon="pi pi-plus" />
        <MultiSelect v-if="enabled[category.id]" v-model="selected[category.id]" :options="options[category.id]" option-label="label" option-value="id" :aria-label="`${category.label} comparisons`" placeholder="Choose comparisons" :max-selected-labels="1" :selected-items-label="'{0} comparisons'" :filter="category.id === 'weather'" fluid style="min-width: 0" />
      </div>
    </div>
    <p class="weapon-preview__help">One change per curve. Baseline: your Shooting skill, Normal quality, clear weather, no cover. The scene, table and measured results keep that baseline. Identical chances overlap.</p>
    <p v-if="enabled.weather" class="weapon-preview__help">Weather: steady conditions. Its penalty applies unless both shooter and target are roofed.</p>
    <p v-if="enabled.cover" class="weapon-preview__help">Cover: one obstacle directly next to the target, between target and shooter. Includes close-range reductions; excludes corners and other obstacles.</p>
  </section>
</template>
