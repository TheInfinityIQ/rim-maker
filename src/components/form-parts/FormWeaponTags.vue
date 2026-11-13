<script setup>
import { computed, ref } from 'vue';
import { useDefinitionStore } from '@/stores/definitions';
import { normalizeWeaponTags, weaponTagOptions, weaponTagContexts } from '@/utility/weaponTags';
import WeaponTagTree from '@/components/WeaponTagTree.vue';
const props = defineProps({ gun: { type: Object, required: true }, templateTags: { type: Array, default: () => [] } });
const definitions = useDefinitionStore();
const customTag = ref('');
const showTree = ref(false);
const tags = computed({ get: () => props.gun.weaponTags || [], set: value => { props.gun.weaponTags = normalizeWeaponTags(value); } });
const options = computed(() => weaponTagOptions(definitions.enabledPacks, tags.value));
const contexts = computed(() => weaponTagContexts(tags.value, definitions.enabledPacks));
const tagDescriptions = computed(() => Object.fromEntries(options.value.map(tag => [tag, weaponTagContexts([tag], definitions.enabledPacks).map(f => f.label).join(', ') || 'No faction group match in enabled official content'])));
const canAdd = computed(() => customTag.value.trim().length > 0 && !tags.value.includes(customTag.value.trim()));
const generationDisabled = computed(() => props.gun.generateAllowChance === 0 || props.gun.generateCommonality === 0);
function addTag() { if (canAdd.value) { tags.value = [...tags.value, customTag.value.trim()]; customTag.value = ''; } }
</script>
<template>
  <Panel header="NPC equipment tags" toggleable collapsed>
    <p class="form-section-help">Let newly generated NPCs consider this weapon by matching their equipment tags. Tags are case-sensitive and can match several faction types.</p>
    <div class="editor-field">
      <label for="npc-weapon-tags">Weapon tags</label>
      <MultiSelect input-id="npc-weapon-tags" v-model="tags" :options="options" display="chip" filter reset-filter-on-hide fluid aria-label="Weapon tags" aria-describedby="npc-tags-help" placeholder="No NPC equipment tags" :pt="{ listContainer: { style: { height: '14rem' } }, label: { style: { flexWrap: 'wrap' } }, option: { style: { whiteSpace: 'normal' } }, overlay: { style: { maxWidth: 'calc(100vw - 2rem)' } } }">
        <template #option="{ option }"><span>{{ option }}<small class="tag-factions">{{ tagDescriptions[option] }}</small></span></template>
      </MultiSelect>
    </div>
    <p class="form-section-help">Any shared tag is enough (OR). Adding a general tag plus a specialist tag broadens the candidate pool; it does not require both tags or restrict the weapon to one faction.</p>
    <Button label="Explore factions and unit tags" icon="pi pi-sitemap" severity="secondary" outlined @click="showTree = true" />
    <Dialog v-model:visible="showTree" modal header="Faction and unit weapon tags" :style="{ width: '64rem', maxWidth: 'calc(100vw - 2rem)' }">
      <WeaponTagTree :selected="tags" :enabled-packs="definitions.enabledPacks" @toggle-tag="tag => tags = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]" />
    </Dialog>
    <div class="npc-tags__custom">
      <div class="editor-field"><label for="custom-weapon-tag">Custom tag</label><InputText id="custom-weapon-tag" v-model="customTag" fluid maxlength="80" aria-describedby="custom-tag-help" @keydown.enter.prevent="addTag" /></div>
      <Button label="Add tag" icon="pi pi-plus" :fluid="false" :disabled="!canAdd" @click="addTag" />
    </div>
    <p id="custom-tag-help" class="form-section-help">For another mod's pawn kinds, enter its exact tag. A custom tag needs a pawn kind that uses the same spelling.</p>
    <div class="npc-tags__actions"><Button label="Clear tags" severity="secondary" text :fluid="false" :disabled="!tags.length" @click="tags = []" /><Button label="Restore template tags" severity="secondary" text :fluid="false" @click="tags = templateTags" /></div>
    <p v-if="!tags.length" class="form-section-help" data-testid="npc-tag-contexts">This weapon is excluded from ordinary tagged NPC equipment selection. Colonists can still equip it.</p>
    <div v-else data-testid="npc-tag-contexts">
      <p class="form-section-help">{{ contexts.length ? 'Faction types with matching pawn-kind tags:' : 'No faction-type tag matches in the enabled official content. Other mods can add matching pawn kinds.' }}</p>
      <ul v-if="contexts.length" class="npc-tags__contexts"><li v-for="context in contexts" :key="context.id">{{ context.label }} <small>({{ context.tags.join(', ') }})</small></li></ul>
    </div>
    <Message v-if="generationDisabled" severity="warn" :closable="false">This definition also disables equipment generation through generateAllowChance or generateCommonality. Tags alone will not enable it.</Message>
    <p id="npc-tags-help" class="form-section-help">A tag match is a candidate, not a guaranteed spawn or faction restriction. The NPC's weapon budget, material, capabilities, ideology and other generation rules still apply. This does not change trader stock, rewards or existing pawns.</p>
    <p class="form-section-help"><code>ThingDef/weaponTags/li</code> · Exports the selected list with inheritance disabled, so clearing it also clears inherited tags.</p>
  </Panel>
</template>
<style scoped>.tag-factions { display: block; font-size: .75rem; color: var(--p-text-muted-color); margin-top: .3rem; overflow-wrap: anywhere; }</style>
