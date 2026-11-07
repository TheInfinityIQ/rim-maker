import { computed, onDeactivated, onUnmounted, ref, watch } from 'vue';
import resourceIcons from '@/utility/data/resource-icons.json';
import { definitionByName } from '@/utility/gameDefinitions';

const base = `${import.meta.env.BASE_URL}previews/`;
const soundFiles = { Shot_AssaultRifle: 'assault-rifle-shot.wav', GunTail_Medium: 'assault-rifle-tail.wav', Interact_Rifle: 'assault-rifle-interact.wav' };
const defName = value => typeof value === 'object' ? value?.label : value;

export function usePreviewMedia(weapon) {
  const verb = computed(() => weapon.value.gun.verbs[0] || {});
  const ownedUrls = new Set();
  const playing = ref(false), loading = ref(false), activeKind = ref(null), soundError = ref('');
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
  const gunTextureUrl = computed(() => texture.value || (resourceIcons.icons[weapon.value.templateDefName] ? `${import.meta.env.BASE_URL}resources/${resourceIcons.icons[weapon.value.templateDefName].file}` : base + 'assault-rifle.png'));
  const gunTextureLabel = computed(() => weapon.value.gun.graphicData.textureFile?.name || definitionByName('things', weapon.value.templateDefName)?.label || 'Assault rifle');
  function resolve(file, selected, fallback) {
    const name = defName(selected) || fallback;
    return file || (soundFiles[name] ? base + soundFiles[name] : '');
  }
  const shotUrl = computed(() => resolve(shot.value, verb.value.soundCast, weapon.value.kind ? '' : 'Shot_AssaultRifle'));
  const tailUrl = computed(() => resolve(tail.value, verb.value.soundCastTail, weapon.value.kind ? '' : 'GunTail_Medium'));
  const interactUrl = computed(() => resolve(interact.value, weapon.value.gun.soundInteract, 'Interact_Rifle'));
  const shotLabel = computed(() => verb.value.soundCastFile?.name || defName(verb.value.soundCast) || 'Shot_AssaultRifle');
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
    stopSound(); soundError.value = '';
    const version = generation;
    const url = kind === 'interact' ? interactUrl.value : shotUrl.value;
    if (!url) { soundError.value = 'Upload a sound file in Files to audition this selected game sound.'; return; }
    activeKind.value = kind; loading.value = true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Sound preview is unavailable in this browser.');
      context ||= new AudioContext();
      await context.resume();
      if (version !== generation) return;
      const clip = await buffer(url);
      const ending = kind === 'shot' && tailUrl.value ? await buffer(tailUrl.value) : null;
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
      if (generation === version) { stopSound(); soundError.value = error.message || 'This sound file could not be played.'; }
    }
  }
  function toggleSound(kind = 'shot') {
    if (activeKind.value === kind) { stopSound(); return; }
    return playSound(kind);
  }
  watch([shotUrl, tailUrl, interactUrl], () => { stopSound(); cache.clear(); soundError.value = ''; });
  onDeactivated(stopSound);
  onUnmounted(() => { stopSound(); context?.close(); for (const url of ownedUrls) URL.revokeObjectURL(url); ownedUrls.clear(); });
  return { gunTextureUrl, gunTextureLabel, shotUrl, interactUrl, shotLabel, playing, loading, activeKind, soundError, playSound, toggleSound, stopSound };
}
