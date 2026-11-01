import { computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import { availableDefinitions, expansionPacks } from '@/utility/gameDefinitions';

export const useDefinitionStore = defineStore('definitions', () => {
  const enabled = reactive(Object.fromEntries(expansionPacks.map(pack => [pack.id, pack.id === 'Core'])));
  const enabledPacks = computed(() => expansionPacks.filter(pack => enabled[pack.id]).map(pack => pack.id));
  const collections = Object.fromEntries(['bullets', 'things', 'stats', 'skills', 'tools', 'sounds'].map(kind =>
    [kind, computed(() => availableDefinitions(kind, enabledPacks.value))],
  ));
  return { enabled, enabledPacks, ...collections };
});
