<script setup>
import { inject, toRef } from 'vue';
import { usePreviewMedia, previewMediaKey } from '@/components/weapon-preview/usePreviewMedia';
const props = defineProps({ weapon: Object });
const { gunTextureUrl, gunTextureLabel, interactUrl, activeKind, playing, loading, soundError, toggleSound } = inject(previewMediaKey, null) || usePreviewMedia(toRef(props, 'weapon'));
</script>
<template>
  <Panel header="Melee preview">
    <div class="weapon-preview__media"><img v-if="gunTextureUrl" :src="gunTextureUrl" alt="Current melee weapon texture" width="64" height="64" /><span v-else>Texture reference unavailable</span><strong>{{ gunTextureLabel }}</strong><Button :label="activeKind === 'interact' ? 'Stop handling sound' : 'Handle weapon'" :icon="activeKind === 'interact' ? 'pi pi-stop' : 'pi pi-volume-up'" severity="secondary" outlined :disabled="!interactUrl" :aria-pressed="activeKind === 'interact'" :fluid="false" @click="toggleSound('interact')" /><span role="status">{{ loading ? 'Loading sound…' : playing ? 'Playing' : '' }}</span></div>
    <Message v-if="!interactUrl" severity="secondary" :closable="false">This game handling sound is used on export. Upload a handling clip in Weapon → Handling sound to audition it here.</Message>
    <Message v-if="soundError" severity="warn" :closable="false">{{ soundError }}</Message>
    <p class="form-section-help">Edit attacks in Attacks → Tools and weapon stats in Weapon → Stat Bases. Actual damage, penetration and cooldown also depend on material, quality and the wielder. This reference view does not simulate melee combat.</p>
  </Panel>
</template>
