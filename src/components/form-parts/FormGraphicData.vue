<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { referenceTextureUrl } from '@/utility/referenceTextures';
const props = defineProps({ graphic: Object, id: String, label: String, defaults: Object });
const input = ref(null), uploaded = ref('');
watch(() => props.graphic.textureFile, file => { if (uploaded.value) URL.revokeObjectURL(uploaded.value); uploaded.value = file && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : ''; }, { immediate: true });
onUnmounted(() => { if (uploaded.value) URL.revokeObjectURL(uploaded.value); });
const url = computed(() => uploaded.value || referenceTextureUrl(props.graphic.texPath));
function upload(event) { if (event.target.files[0]) props.graphic.textureFile = event.target.files[0]; event.target.value = ''; }
function reset() { props.graphic.textureFile = null; props.graphic.texPath = props.defaults?.texPath || ''; }
</script>
<template>
  <Panel :header="label" toggleable>
    <p class="form-section-help">graphicData · The image used by this definition in the game. Upload a PNG, or enter a game texture path without its extension.</p>
    <p class="form-section-help">Suggested image size: 128 × 128 pixels. Use .png for best results.</p>
    <div :id="id" class="asset-row">
      <div class="asset-reference"><img v-if="url" :src="url" :alt="label" width="56" height="56" /><i v-else class="pi pi-image" aria-hidden="true" /><span>{{ graphic.textureFile?.name || graphic.texPath || 'No texture selected' }}</span></div>
      <Button :label="graphic.textureFile ? 'Replace File' : 'Upload File'" icon="pi pi-upload" @click="input.click()" />
      <Button v-if="graphic.textureFile" label="Remove File" icon="pi pi-times" severity="secondary" @click="graphic.textureFile = null" />
      <input ref="input" type="file" accept="image/png" hidden @change="upload" />
    </div>
    <label class="dialog-field">Game texture path<InputText v-model="graphic.texPath" :aria-label="`${label} path`" :disabled="!!graphic.textureFile" fluid /></label>
    <p v-if="!url" class="form-section-help">No browser reference is available for this path. The path is preserved for the game; upload a PNG to preview a custom image.</p>
    <Button label="Use template texture" icon="pi pi-replay" severity="secondary" outlined :fluid="false" :disabled="!defaults" @click="reset" />
  </Panel>
</template>
