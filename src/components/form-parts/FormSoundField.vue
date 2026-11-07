<script setup>
import { inject, ref } from 'vue';
import { previewMediaKey } from '@/components/weapon-preview/usePreviewMedia';
const props = defineProps({ owner: Object, property: String, kind: String, label: String, id: String, options: Array, defaultValue: String });
const media = inject(previewMediaKey);
const input = ref(null);
function upload(event) { if (event.target.files[0]) props.owner[props.property + 'File'] = event.target.files[0]; event.target.value = ''; }
function reset() { const value = props.defaultValue; props.owner[props.property + 'File'] = null; props.owner[props.property] = value; }
</script>
<template>
  <div class="definition-sound" :id="id">
    <label :for="`${id}-selection`">{{ label }}</label>
    <div class="asset-row">
      <Select :input-id="`${id}-selection`" v-model="owner[property]" :aria-label="label" :options="options" option-label="defName" option-value="defName" filter reset-filter-on-hide reset-filter-on-clear show-clear :disabled="!!owner[property + 'File']" :placeholder="kind === 'interact' ? 'Game default: Standard_Pickup' : 'No sound'" />
      <Button :label="owner[property + 'File'] ? 'Replace File' : 'Upload File'" icon="pi pi-upload" @click="input.click()" />
      <Button v-if="owner[property + 'File']" label="Remove File" icon="pi pi-times" severity="secondary" @click="owner[property + 'File'] = null" />
      <input ref="input" type="file" accept="audio/*" hidden @change="upload" />
    </div>
    <p v-if="owner[property + 'File']" class="form-section-help">Using uploaded {{ owner[property + 'File'].name }}. Removing it restores the selected game sound.</p>
    <div class="weapon-preview__controls">
      <Button :label="media.activeKind.value === kind ? 'Stop sound' : 'Play sound'" :aria-label="`${media.activeKind.value === kind ? 'Stop' : 'Play'} ${label.toLowerCase()}`" :icon="media.activeKind.value === kind ? 'pi pi-stop' : 'pi pi-volume-up'" :aria-pressed="media.activeKind.value === kind" :disabled="!media.soundUrl(kind)" severity="secondary" outlined :fluid="false" @click="media.toggleSound(kind, { count: 1, includeTail: false })" />
      <Button label="Use template sound" :title="defaultValue || 'No sound'" severity="secondary" text :fluid="false" :disabled="defaultValue === undefined" @click="reset" />
    </div>
    <p v-if="!media.soundUrl(kind)" class="form-section-help">{{ owner[property] ? 'This SoundDef has no browser reference sample. Upload a clip to audition it; its game reference remains available for export.' : 'No sound is selected.' }}</p>
    <Message v-if="media.soundError.value && media.errorKind.value === kind" severity="warn" :closable="false">{{ media.soundError.value }}</Message>
  </div>
</template>
