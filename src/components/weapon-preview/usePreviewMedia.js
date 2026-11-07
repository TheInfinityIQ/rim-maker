import { computed, onDeactivated, onUnmounted, ref, watch } from 'vue';
import references from '@/utility/data/templateMedia.json';
import { templateFor } from '@/utility/weaponTypes';
export const previewMediaKey = Symbol('weapon preview media');

const defName = value => typeof value === 'object' ? value?.label : value;

export function usePreviewMedia(weapon) {
  const verb = computed(() => weapon.value.gun.verbs[0] || {});
  const ownedUrls = new Set();
  const playing = ref(false), loading = ref(false), activeKind = ref(null), soundError = ref(''), errorKind = ref(null);
  let context, sources = [], timer, generation = 0;
  const cache = new Map();
  function fileUrl(getFile) {
    const url = ref('');
    watch(getFile, file => {
      if (url.value) { URL.revokeObjectURL(url.value); ownedUrls.delete(url.value); }
      url.value = file && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : '';
      if (url.value) ownedUrls.add(url.value);
    }, { immediate: true });
    return url;
  }
  const texture = fileUrl(() => weapon.value.gun.graphicData.textureFile);
  const shot = fileUrl(() => verb.value.soundCastFile);
  const tail = fileUrl(() => verb.value.soundCastTailFile);
  const interact = fileUrl(() => weapon.value.gun.soundInteractFile);
  const gunTextureUrl = computed(() => texture.value || (references.images[weapon.value.gun.graphicData.texPath] ? `${import.meta.env.BASE_URL}reference-media/${references.images[weapon.value.gun.graphicData.texPath].file}` : ''));
  const gunTextureLabel = computed(() => weapon.value.gun.graphicData.textureFile?.name || (templateFor(weapon.value)?.graphicData.texPath === weapon.value.gun.graphicData.texPath ? templateFor(weapon.value).label : weapon.value.gun.graphicData.texPath) || 'No texture selected');
  function resolve(file, selected, fallback = '') {
    const name = defName(selected) || fallback;
    return file || (references.sounds[name] ? `${import.meta.env.BASE_URL}reference-media/${references.sounds[name].file}` : '');
  }
  const shotUrl = computed(() => resolve(shot.value, verb.value.soundCast));
  const tailUrl = computed(() => resolve(tail.value, verb.value.soundCastTail));
  const interactUrl = computed(() => resolve(interact.value, weapon.value.gun.soundInteract, 'Standard_Pickup'));
  const shotLabel = computed(() => verb.value.soundCastFile?.name || defName(verb.value.soundCast) || 'No firing sound');
  const soundUrl = kind => ({ shot: shotUrl.value, tail: tailUrl.value, interact: interactUrl.value })[kind] || '';
  function stopSound() {
    generation++;
    clearTimeout(timer);
    for (const source of sources) { try { source.stop(); } catch { /* Already finished. */ } }
    sources = []; playing.value = false; loading.value = false; activeKind.value = null;
  }
  async function buffer(url) {
    if (!cache.has(url)) cache.set(url, fetch(url).then(response => {
      if (!response.ok) throw new Error('The preview sound could not be loaded.');
      return response.arrayBuffer();
    }).then(data => context.decodeAudioData(data)).catch(error => { cache.delete(url); throw error; }));
    return cache.get(url);
  }
  async function playSound(kind = 'shot', timing = null) {
    stopSound(); soundError.value = ''; errorKind.value = null;
    const version = generation;
    const url = soundUrl(kind);
    if (!url) return;
    activeKind.value = kind; loading.value = true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Sound preview is unavailable in this browser.');
      context ||= new AudioContext();
      await context.resume();
      if (version !== generation) return;
      const clip = await buffer(url);
      const ending = kind === 'shot' && timing?.includeTail !== false && tailUrl.value ? await buffer(tailUrl.value) : null;
      if (version !== generation) return;
      const count = timing?.count ?? (kind === 'shot' ? Math.min(20, Math.max(1, Math.round(Number(verb.value.burstShotCount) || 1))) : 1);
      const ticks = Number(verb.value.ticksBetweenBurstShots);
      const gap = timing?.gap ?? (Number.isFinite(ticks) && ticks > 0 ? ticks : 1) / 60;
      const start = context.currentTime + .03 + (timing?.delay || 0);
      let end = start;
      function schedule(audio, time, volume) {
        const source = context.createBufferSource(), gain = context.createGain();
        source.buffer = audio; gain.gain.value = volume;
        source.connect(gain); gain.connect(context.destination); source.start(time);
        source.onended = () => { source.disconnect(); gain.disconnect(); };
        sources.push(source); end = Math.max(end, time + audio.duration);
      }
      for (let i = 0; i < count && i * gap <= 10; i++) schedule(clip, start + i * gap, .55);
      if (ending) schedule(ending, Math.min(end, start + (count - 1) * gap + .1), .35);
      loading.value = false; playing.value = true;
      timer = setTimeout(() => { if (generation === version) { playing.value = false; activeKind.value = null; sources = []; } }, (end - context.currentTime) * 1000 + 50);
    } catch (error) {
      if (generation === version) { stopSound(); errorKind.value = kind; soundError.value = error.message || 'This sound file could not be played.'; }
    }
  }
  function toggleSound(kind = 'shot', timing = null) {
    if (activeKind.value === kind) { stopSound(); return; }
    return playSound(kind, timing);
  }
  watch([shotUrl, tailUrl, interactUrl], () => { stopSound(); cache.clear(); soundError.value = ''; errorKind.value = null; });
  onDeactivated(stopSound);
  onUnmounted(() => { stopSound(); context?.close(); for (const url of ownedUrls) URL.revokeObjectURL(url); ownedUrls.clear(); });
  return { gunTextureUrl, gunTextureLabel, shotUrl, interactUrl, tailUrl, soundUrl, shotLabel, playing, loading, activeKind, soundError, errorKind, playSound, toggleSound, stopSound };
}
