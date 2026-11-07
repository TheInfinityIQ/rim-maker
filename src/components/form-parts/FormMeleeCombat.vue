<script setup>
import { toRef } from 'vue';
import { usePreviewMedia } from '@/components/weapon-preview/usePreviewMedia';
const props = defineProps({ weapon: Object });
const { gunTextureUrl, gunTextureLabel, interactUrl, activeKind, playing, loading, soundError, toggleSound } = usePreviewMedia(toRef(props, 'weapon'));
</script>
<template>
  <Panel header="Melee weapon">
    <div class="weapon-preview__media"><img :src="gunTextureUrl" alt="Current melee weapon texture" width="64" height="64" /><strong>{{ gunTextureLabel }}</strong><Button :label="activeKind === 'interact' ? 'Stop handling sound' : 'Handle weapon'" :icon="activeKind === 'interact' ? 'pi pi-stop' : 'pi pi-volume-up'" severity="secondary" outlined :disabled="!interactUrl" :aria-pressed="activeKind === 'interact'" :fluid="false" @click="toggleSound('interact')" /><span role="status">{{ loading ? 'Loading sound…' : playing ? 'Playing' : '' }}</span></div>
    <Message v-if="!interactUrl" severity="secondary" :closable="false">This game handling sound is used on export. Upload a handling clip in Files to audition it here.</Message>
    <Message v-if="soundError" severity="warn" :closable="false">{{ soundError }}</Message>
    <p class="form-section-help">Edit each attack below. RimWorld selects attacks from their capacities and chances; actual damage, penetration and cooldown also depend on material, quality and the wielder. Melee weapons export without gun verbs or a projectile.</p>
    <div class="projectile-number-grid">
      <label>Mass (kg)<InputNumber v-model="weapon.gun.statBases.Mass" :min="0.01" :max-fraction-digits="3" aria-label="Melee weapon mass" fluid /></label>
      <label>Work to make<InputNumber v-model="weapon.gun.statBases.WorkToMake" :min="1" aria-label="Melee work to make" fluid /></label>
    </div>
  </Panel>
</template>
