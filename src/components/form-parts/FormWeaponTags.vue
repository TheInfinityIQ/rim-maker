<script setup>
import { computed, ref } from 'vue';
import { useDefinitionStore } from '@/stores/definitions';
import { normalizeWeaponTags, weaponTagOptions, weaponTagContexts } from '@/utility/weaponTags';
const props = defineProps({ gun: { type: Object, required: true }, templateTags: { type: Array, default: () => [] } });
const definitions = useDefinitionStore();
const customTag = ref('');
const tags = computed({ get: () => props.gun.weaponTags || [], set: value => { props.gun.weaponTags = normalizeWeaponTags(value); } });
const options = computed(() => weaponTagOptions(definitions.enabledPacks, tags.value));
const contexts = computed(() => weaponTagContexts(tags.value, definitions.enabledPacks));
const canAdd = computed(() => customTag.value.trim().length > 0 && !tags.value.includes(customTag.value.trim()));
const generationDisabled = computed(() => props.gun.generateAllowChance === 0 || props.gun.generateCommonality === 0);
function addTag() { if (canAdd.value) { tags.value = [...tags.value, customTag.value.trim()]; customTag.value = ''; } }
</script>
<template>
  <Panel header="NPC equipment tags" toggleable collapsed>
    <p class="form-section-help">Let newly generated NPCs consider this weapon by matching their equipment tags. Tags are case-sensitive and can match several faction types.</p>
    <div class="editor-field">
      <label for="npc-weapon-tags">Weapon tags</label>
      <MultiSelect input-id="npc-weapon-tags" v-model="tags" :options="options" display="chip" filter reset-filter-on-hide fluid aria-label="Weapon tags" aria-describedby="npc-tags-help" placeholder="No NPC equipment tags" />
    </div>
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
