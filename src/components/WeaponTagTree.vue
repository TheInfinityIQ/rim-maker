<script setup>
import { computed, ref } from 'vue';
import { weaponTagTree } from '@/utility/weaponTags';
const props = defineProps({ selected: Array, enabledPacks: Array });
defineEmits(['toggle-tag']);
const matchingOnly = ref(true);
const nodes = computed(() => weaponTagTree(props.selected, props.enabledPacks, matchingOnly.value));
</script>
<template>
  <p>Faction → unit type → accepted weapon tags. Expand a faction and unit to explore. Click a tag to add or remove it from this weapon.</p>
  <div class="choice-field"><Checkbox v-model="matchingOnly" binary input-id="tag-tree-matching" /><label for="tag-tree-matching">Only units matching selected tags</label></div>
  <p>One shared tag is enough. Selected tags are alternatives (OR), never a faction-plus-specialist requirement. A broad tag can include ordinary soldiers as well as specialists.</p>
  <Tree v-if="nodes.length" :value="nodes" filter filter-placeholder="Find a faction, unit or tag" filter-mode="lenient" aria-label="Faction unit and weapon tag relationships" :pt="{ root: { style: { width: '100%', overflowX: 'auto' } }, pcFilterInput: { root: { 'aria-label': 'Find a faction, unit or tag' } } }">
    <template #default="{ node }">
      <Button v-if="node.tag" :label="`${node.tag}${node.matched ? ' · selected' : ' · add tag'}`" :icon="node.matched ? 'pi pi-check' : 'pi pi-plus'" text @click.stop="$emit('toggle-tag', node.tag)" />
      <span v-else class="tag-tree-label"><strong>{{ node.title }}</strong><small>{{ node.detail }}</small></span>
    </template>
  </Tree>
  <Message v-else severity="secondary" :closable="false">No matching official faction links. Turn off the filter to explore all enabled units. Custom mods can supply other links.</Message>
  <p>Group/default-member associations come from faction definitions. “Default faction only” means affiliation, not evidence that a faction's raid groups generate that unit. A unit may appear in several factions. Budgets, capabilities, material and other equipment rules still apply; these branches are candidates, not guaranteed spawns.</p>
</template>
<style scoped>
p { line-height: 1.6; margin: 0 0 1rem; }
.choice-field { display: flex; align-items: center; gap: .65rem; margin: .75rem 0; }
.tag-tree-label { white-space: normal; overflow-wrap: anywhere; }
.tag-tree-label strong { display: block; font-weight: 500; }
.tag-tree-label small { display: block; color: var(--p-text-muted-color); font-size: .75rem; margin-top: .25rem; }
</style>
