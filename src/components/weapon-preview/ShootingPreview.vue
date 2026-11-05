<script setup>
import { computed, getCurrentInstance, nextTick, onDeactivated, onUnmounted, ref, watch } from 'vue';
import { nativeShootingRequest, validateNativeReplay } from '@/utility/nativeShooting';
import AccuracyReport from './AccuracyReport.vue';

const props = defineProps({ weapon: { type: Object, required: true }, colonist: { type: Object, required: true }, target: { type: Object, required: true }, scenario: { type: String, default: 'village' }, ranges: { type: Array, default: () => [3, 12, 25, 40] }, skill: { type: Number, default: 10 }, selected: Number, rangesValid: { type: Boolean, default: true } });
const emit = defineEmits(['select-range']);
const connectionId = `native-preview-key-${getCurrentInstance().uid}`;
const connectionCollapsed = ref(true), connectionInput = ref(null);
async function openConnection() { connectionCollapsed.value = false; await nextTick(); connectionInput.value?.$el.focus(); }
const base = `${import.meta.env.BASE_URL}previews/shooting/`;
const endpoint = 'http://127.0.0.1:47328';
const key = ref(''), connected = ref(false), busy = ref(false), error = ref('');
const replay = ref(null), title = ref(''), stale = ref(false), index = ref(0), playing = ref(false), speed = ref(.25);
const video = ref(null);
const accuracy = ref(null), accuracyStale = ref(false), progress = ref('Loading…');
const speeds = [{ label: '¼ speed', value: .25 }, { label: '½ speed', value: .5 }, { label: 'Game speed', value: 1 }];
const current = computed(() => replay.value?.frames[index.value]);
const seconds = computed(() => ((current.value?.tick || 0) / 60).toFixed(2));
let animation, lastTime, elapsed = 0, controller, generation = 0, accuracyGeneration = 0;
function pause() { playing.value = false; cancelAnimationFrame(animation); lastTime = null; video.value?.pause(); }
function advance(time) {
  if (!playing.value) return;
  if (video.value) elapsed = video.value.currentTime * 60;
  else if (lastTime != null) elapsed += (time - lastTime) * .06 * speed.value;
  lastTime = time;
  const frames = replay.value.frames;
  while (index.value + 1 < frames.length && frames[index.value + 1].tick <= elapsed) index.value++;
  if (elapsed >= replay.value.durationTicks) { pause(); return; }
  animation = requestAnimationFrame(advance);
}
function play(fromStart = false) {
  pause();
  if (fromStart || index.value === replay.value.frames.length - 1) index.value = 0;
  elapsed = replay.value.frames[index.value].tick; playing.value = true;
  if (video.value) {
    video.value.currentTime = elapsed / 60; video.value.playbackRate = speed.value;
    video.value.play().catch(failure => { pause(); error.value = failure.message; });
  }
  animation = requestAnimationFrame(advance);
}
function seek(value) { pause(); index.value = value; if (video.value) video.value.currentTime = replay.value.frames[value].tick / 60; }
function firstShot() {
  const tick = replay.value.shots?.[0]?.tick;
  if (tick == null) return;
  const frame = replay.value.frames.findIndex(frame => frame.tick >= tick);
  seek(Math.max(0, frame)); play();
}
async function show(value, label) {
  pause(); replay.value = validateNativeReplay(value); title.value = label; index.value = 0; stale.value = false;
  await nextTick(); video.value?.load(); play(true);
}
async function example(name) {
  if (busy.value) return;
  busy.value = true; error.value = '';
  progress.value = 'Loading shooting example…';
  controller = new AbortController();
  try {
    const response = await fetch(`${base}${name}.json`, { signal: controller.signal });
    if (!response.ok) throw new Error('The shooting example could not be loaded.');
    await show(await response.json(), name === 'rifle' ? 'Stock assault rifle example' : name === 'rocket' ? 'Stock explosive rocket example' : 'Stock inferno cannon example');
  } catch (failure) { if (failure.name !== 'AbortError') error.value = failure.message; }
  finally { busy.value = false; }
}
async function local(path, options = {}) {
  const response = await fetch(endpoint + path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key.value.trim()}` }, signal: controller?.signal });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'The local companion could not complete this request.');
  return value;
}
async function connect() {
  busy.value = true; error.value = ''; controller = new AbortController();
  progress.value = 'Connecting to the local companion…';
  try {
    const status = await local('/status');
    if (status.engine !== 'RimWorld' || status.schema !== 1) throw new Error('This companion version is incompatible. Update RimMaker locally.');
    connected.value = true;
  } catch (failure) {
    connected.value = false;
    if (failure.name !== 'AbortError') error.value = failure.message === 'Failed to fetch' ? 'Start npm run preview:engine in your local RimMaker folder, paste its connection key, and allow the browser to connect to your computer.' : failure.message;
  } finally { busy.value = false; }
}
async function shoot() {
  if (busy.value) return;
  busy.value = true; error.value = ''; pause(); controller = new AbortController();
  const version = generation;
  try {
    progress.value = 'RimWorld is generating the scene and recording the shot. This can take a few minutes.';
    const request = await nativeShootingRequest(props.weapon, props.colonist, props.target, { scenario: props.scenario, skill: props.skill });
    const result = await local('/shoot', { method: 'POST', body: JSON.stringify(request) });
    await show(result, 'Your weapon · native RimWorld recording'); stale.value = version !== generation;
  } catch (failure) { if (failure.name !== 'AbortError') error.value = failure.message; }
  finally { busy.value = false; }
}
async function measure(trials) {
  if (busy.value) return;
  busy.value = true; error.value = ''; controller = new AbortController();
  const version = accuracyGeneration;
  progress.value = `RimWorld is firing ${trials} independent test projectiles at each reachable distance. This can take a few minutes.`;
  try {
    const request = await nativeShootingRequest(props.weapon, props.colonist, props.target, { task: 'accuracy', scenario: 'white-room', ranges: props.ranges, skill: props.skill, trials });
    const result = await local('/accuracy', { method: 'POST', body: JSON.stringify(request) });
    if (result.engine !== 'RimWorld' || result.schema !== 1 || !Array.isArray(result.rows)) throw new Error('Invalid native accuracy results. Update the companion.');
    accuracy.value = result; accuracyStale.value = version !== accuracyGeneration;
  } catch (failure) { if (failure.name !== 'AbortError') error.value = failure.message; }
  finally { busy.value = false; }
}
watch(() => [props.weapon, props.colonist, props.target, props.scenario, props.skill], () => { generation++; if (replay.value && title.value.startsWith('Your weapon')) stale.value = true; }, { deep: true });
// Independent white-room measurements do not depend on the currently selected aim marker or village position.
watch(() => [props.weapon, props.ranges, props.skill], () => { accuracyGeneration++; if (accuracy.value) accuracyStale.value = true; }, { deep: true });
watch(key, () => { connected.value = false; });
watch(speed, value => { if (video.value) video.value.playbackRate = value; });
function cleanup() { pause(); controller?.abort(); }
onDeactivated(cleanup); onUnmounted(cleanup);
</script>

<template>
  <section class="shooting-preview" aria-label="Shooting example">
    <AccuracyReport v-if="scenario === 'white-room'" :weapon="weapon" :ranges="ranges" :skill="skill" :result="accuracy" :stale="accuracyStale" :connected="connected" :busy="busy" :selected="selected" :ranges-valid="rangesValid" @measure="measure" @select-range="emit('select-range', $event)" @connect="openConnection" />
    <div class="weapon-preview__header"><h3>Shooting example</h3><Tag value="Actual RimWorld engine" severity="secondary" /></div>
    <p class="weapon-preview__help">Watch the game's own projectiles in flight. These are native recordings, with real misses, cover, bursts, and impacts. Slow playback makes fast bullets easier to see.</p>
    <div class="weapon-preview__controls">
      <Button label="Assault rifle example" icon="pi pi-play" severity="secondary" outlined :fluid="false" :disabled="busy" @click="example('rifle')" />
      <Button label="Explosive example" severity="secondary" outlined :fluid="false" :disabled="busy" @click="example('rocket')" />
      <Button label="Inferno example" severity="secondary" outlined :fluid="false" :disabled="busy" @click="example('inferno')" />
    </div>
    <div v-if="replay" class="shooting-preview__replay" data-testid="native-replay">
      <video v-if="replay.video" ref="video" :src="base + replay.video" muted playsinline preload="auto" :aria-label="title" width="640" height="640" data-testid="native-replay-frame" :data-tick="current.tick" @ended="pause" />
      <img v-else :src="current.image" :alt="`${title}, game tick ${current.tick}`" width="640" height="640" data-testid="native-replay-frame" :data-tick="current.tick" />
      <div class="weapon-preview__readout"><strong>{{ title }}</strong><span>{{ seconds }} s · tick {{ current.tick }}</span></div>
      <Slider :model-value="index" :max="replay.frames.length - 1" :step="1" aria-label="Shooting replay timeline" @update:model-value="seek" />
      <div class="weapon-preview__controls">
        <Button :label="playing ? 'Pause replay' : 'Play replay'" :icon="playing ? 'pi pi-pause' : 'pi pi-play'" severity="secondary" outlined :fluid="false" @click="playing ? pause() : play()" />
        <Button label="Restart replay" icon="pi pi-replay" severity="secondary" outlined :fluid="false" @click="play(true)" />
        <Button label="First shot" icon="pi pi-bullseye" severity="secondary" outlined :fluid="false" :disabled="!replay.shots?.length" @click="firstShot" />
        <Button icon="pi pi-step-backward" aria-label="Previous replay frame" severity="secondary" outlined :fluid="false" :disabled="index === 0" @click="seek(index - 1)" />
        <Button icon="pi pi-step-forward" aria-label="Next replay frame" severity="secondary" outlined :fluid="false" :disabled="index === replay.frames.length - 1" @click="seek(index + 1)" />
        <Select v-model="speed" :options="speeds" option-label="label" option-value="value" aria-label="Replay speed" :fluid="false" />
      </div>
      <p class="weapon-preview__help">{{ replay.gameVersion }} · {{ replay.projectileClass }} · {{ replay.projectilesObserved }} projectiles observed. Skill {{ replay.shootingSkill }}, {{ replay.quality }} quality. Silent recording; audition sounds separately above.</p>
      <Message v-if="!replay.complete" severity="warn" :closable="false">Recording stopped at 30 game seconds. Effects may continue beyond the recording.</Message>
      <Message v-if="stale" severity="secondary" :closable="false">Weapon settings or positions changed after this recording. Run another shot to see the changes.</Message>
    </div>
    <Panel v-model:collapsed="connectionCollapsed" header="Shoot your weapon in RimWorld" toggleable>
      <div class="shooting-preview__connection">
        <p class="weapon-preview__help">Start <code>npm run preview:engine</code> in your local RimMaker folder and paste the connection key below. Your installed game tests this exported weapon in an isolated {{ scenario === 'white-room' ? 'white-room range' : 'generated village' }} and returns the result.</p>
        <label :for="connectionId">Local companion connection key</label>
        <InputText :id="connectionId" ref="connectionInput" v-model="key" type="password" autocomplete="off" placeholder="Paste connection key" :disabled="busy" @keydown.enter.prevent="!busy && key.trim() && connect()" />
        <div class="weapon-preview__controls">
          <Button label="Connect companion" icon="pi pi-link" severity="secondary" outlined :fluid="false" :disabled="busy || !key.trim()" @click="connect" />
          <Button label="Shoot target in RimWorld" icon="pi pi-bullseye" :fluid="false" :disabled="busy || !connected" @click="shoot" />
          <Tag v-if="connected" value="Connected locally" severity="success" />
        </div>
        <p class="weapon-preview__help">Uses the colonist and aim positions above, Shooting skill {{ skill }}, Normal weapon quality, and the exported XML and uploaded assets. Stock paths supply missing uploads. RimWorld decides whether it can shoot and computes combat outcomes. Other installed mods are not loaded.</p>
      </div>
    </Panel>
    <Message v-if="busy" severity="secondary" :closable="false" role="status">{{ progress }}</Message>
    <Message v-if="error" severity="warn" :closable="false" data-testid="native-preview-error">{{ error }}</Message>
  </section>
</template>
