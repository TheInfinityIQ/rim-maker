<script setup>
import { computed, getCurrentInstance, reactive, ref, toRef, watch } from 'vue';
import { WeaponRanged } from '@/models/weapon';
import { overviewCamera, placementCell, rangeOutline, targetReach, weaponRange } from '@/utility/rangePreview';
import { usePreviewMedia } from './usePreviewMedia';
import scene from './firing-range.json';
import ShootingPreview from './ShootingPreview.vue';
import { parseTargetRanges } from '@/utility/weaponAccuracy';
import { useFlightPreview } from './useFlightPreview';
import { graphicSize } from '@/utility/projectileFlight';

const props = defineProps({ weapon: { type: WeaponRanged, required: true } });
const emit = defineEmits(['target-change', 'colonist-change']);
const id = `weapon-preview-${getCurrentInstance().uid}`;
const base = `${import.meta.env.BASE_URL}previews/`;
const bounds = scene.bounds;
const blocked = new Set(scene.blocked.map(([x, y]) => `${x},${y}`));
const start = scene.colonistStart;
const colonist = ref({ ...start }), target = ref({ ...scene.sandbag });
const ghost = ref(null), placing = ref(false), dragging = ref(false), notice = ref('');
const selected = ref('colonist');
const scenario = ref('village'), rangeInput = ref('3, 12, 25, 40'), skill = ref(10), activeDistance = ref(12);
const scenarios = [{ label: 'Raid village', value: 'village' }, { label: 'White room', value: 'white-room' }];
const whiteRoom = computed(() => scenario.value === 'white-room');
const parsedRanges = computed(() => parseTargetRanges(rangeInput.value));
const distances = computed(() => parsedRanges.value.ranges);
const whiteOrigin = { x: -48, y: 0 };
let villageState;
const initialView = overviewCamera(start, scene.sandbag, bounds);
const camera = ref({ ...initialView });
const extent = computed(() => camera.value.extent);
const position = computed(() => ghost.value || colonist.value);
const range = computed(() => weaponRange(props.weapon));
const reach = computed(() => targetReach(props.weapon, target.value, position.value));
const sandbagDistance = computed(() => Math.hypot(position.value.x - scene.sandbag.x, position.value.y - scene.sandbag.y));
const viewBox = computed(() => `${camera.value.x - extent.value} ${camera.value.y - extent.value} ${extent.value * 2} ${extent.value * 2}`);
const outline = computed(() => range.value == null ? '' : rangeOutline(range.value));
const minOutline = computed(() => reach.value.minRange ? rangeOutline(reach.value.minRange) : '');
// RenderPawn's capture zoom is .75: its full transparent image spans 2 / .75 tiles.
// Keep this world size fixed; zoom changes pixels per tile, not the pawn's body size.
const markerSize = 2 / .75;
const pickupSize = computed(() => Math.max(2, extent.value * .12));
const gunSize = computed(() => graphicSize(props.weapon.gun.graphicData));
const validPosition = computed(() => placementCell(position.value, bounds, blocked).valid);
const rangeText = computed(() => range.value == null ? 'Set a range' : `${format(range.value)} tiles`);
const status = computed(() => reach.value.isOrigin ? 'Colonist position' : range.value == null ? 'Set a weapon range' : reach.value.within ? 'Within range' : 'Outside range');
const imageBounds = { x: -scene.centerX / scene.pixelsPerTile, y: -scene.centerY / scene.pixelsPerTile,
  width: scene.width / scene.pixelsPerTile, height: scene.height / scene.pixelsPerTile };
const { gunTextureUrl, gunTextureLabel, shotUrl, interactUrl, shotLabel, playing, loading, soundError, playSound, stopSound } = usePreviewMedia(toRef(props, 'weapon'));
const flight = reactive(useFlightPreview(toRef(props, 'weapon'), colonist, target, playSound, stopSound));
const previewSpeeds = [{ label: 'Game speed', value: 1 }, { label: '¼ speed', value: .25 }];
function whiteCamera() { const max = Math.max(12, ...distances.value); return { x: whiteOrigin.x + max / 2, y: 0, extent: Math.max(10, max / 2 + 6) }; }
function selectDistance(distance) { stopFiring(); activeDistance.value = distance; moveTarget({ x: whiteOrigin.x + distance, y: whiteOrigin.y }); }
watch(scenario, value => {
  stopFiring(); pointerCancel(); placing.value = false;
  if (value === 'white-room') {
    villageState = { colonist: { ...colonist.value }, target: { ...target.value }, camera: { ...camera.value } };
    colonist.value = { ...whiteOrigin }; selectDistance(distances.value.includes(activeDistance.value) ? activeDistance.value : distances.value[0] || 12); camera.value = whiteCamera();
  } else if (villageState) { colonist.value = villageState.colonist; target.value = villageState.target; camera.value = villageState.camera; }
  notice.value = '';
});
watch(distances, values => { if (whiteRoom.value && values.length) { if (!values.includes(activeDistance.value)) selectDistance(values[0]); camera.value = whiteCamera(); } });
function stopFiring() { flight.stop(); stopSound(); }
async function fireVisual() { try { notice.value = ''; await flight.fire(); } catch (error) { notice.value = error.message; } }
let pointer;
function format(value) { return Number(value.toFixed(1)).toString(); }
function pointAt(event) {
  const svg = event.currentTarget.querySelector('svg');
  const matrix = svg.getScreenCTM();
  return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null;
}
function moveColonist(point) {
  const cell = placementCell(point, bounds, blocked);
  if (!cell.valid) { notice.value = 'Choose open ground. This tile is blocked or outside the scene.'; return false; }
  colonist.value = { x: cell.x, y: cell.y };
  notice.value = '';
  emit('colonist-change', { ...colonist.value, distanceToSandbag: Math.hypot(cell.x - scene.sandbag.x, cell.y - scene.sandbag.y) });
  return true;
}
function moveTarget(point) {
  target.value = { x: Math.max(bounds.minX, Math.min(bounds.maxX, Math.round(point.x))), y: Math.max(bounds.minY, Math.min(bounds.maxY, Math.round(point.y))) };
  emit('target-change', { ...target.value, ...targetReach(props.weapon, target.value, colonist.value) });
}
function resetPosition() {
  if (whiteRoom.value) { stopFiring(); colonist.value = { ...whiteOrigin }; selectDistance(activeDistance.value); camera.value = whiteCamera(); return; }
  stopSound(); ghost.value = null; placing.value = false; dragging.value = false;
  moveColonist(start); camera.value = { ...initialView }; selected.value = 'colonist';
  notice.value = 'Colonist reset to 100 tiles from the outer sandbag.';
}
function setCamera(x, y, size) {
  const e = Math.max(5, Math.min(110, size));
  camera.value = { x: Math.max(bounds.minX + e, Math.min(bounds.maxX - e, x)), y: Math.max(bounds.minY + e, Math.min(bounds.maxY - e, y)), extent: e };
}
function zoom(factor) { setCamera(camera.value.x, camera.value.y, extent.value * factor); }
function fitRange() { setCamera(colonist.value.x, colonist.value.y, (range.value ?? 15.9) + 5); }
function togglePickup() { placing.value = !placing.value; selected.value = 'colonist'; notice.value = ''; }
function pointerDown(event) {
  if (event.button !== 0) return;
  const world = pointAt(event); if (!world) return;
  const onColonist = !!event.target.closest?.('[data-colonist]');
  const board = event.target.closest?.('[data-range-distance]');
  if (whiteRoom.value && onColonist) { notice.value = 'The white-room shooter stays on the firing line. Select a marked distance to aim.'; return; }
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, world, origin: { ...colonist.value }, camera: { ...camera.value }, kind: board ? 'range-target' : placing.value ? 'place' : onColonist ? 'colonist' : 'ground', distance: Number(board?.getAttribute('data-range-distance')), moved: false };
  if (onColonist) { selected.value = 'colonist'; dragging.value = true; }
  event.currentTarget.setPointerCapture(event.pointerId);
  event.currentTarget.focus({ preventScroll: true });
}
function pointerMove(event) {
  if (!pointer || pointer.id !== event.pointerId) return;
  const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
  pointer.moved ||= Math.hypot(dx, dy) > 4;
  if (pointer.kind === 'colonist' || pointer.kind === 'place') {
    const world = pointAt(event); if (!world) return;
    const point = pointer.kind === 'colonist' ? { x: pointer.origin.x + world.x - pointer.world.x, y: pointer.origin.y + world.y - pointer.world.y } : world;
    ghost.value = { x: Math.round(point.x), y: Math.round(point.y) };
  } else if (pointer.moved) {
    const box = event.currentTarget.getBoundingClientRect();
    setCamera(pointer.camera.x - dx / box.width * pointer.camera.extent * 2, pointer.camera.y - dy / box.height * pointer.camera.extent * 2, pointer.camera.extent);
  }
}
function pointerUp(event) {
  if (!pointer || pointer.id !== event.pointerId) return;
  const world = pointAt(event);
  if (pointer.kind === 'range-target') selectDistance(pointer.distance);
  else if (pointer.kind === 'colonist') {
    if (pointer.moved) { moveColonist(ghost.value || pointer.origin); placing.value = false; }
    else placing.value = !placing.value;
  } else if (pointer.kind === 'place' && world) {
    if (moveColonist(world)) placing.value = false;
  } else if (!pointer.moved && world && !whiteRoom.value) { moveTarget(world); selected.value = 'target'; }
  pointer = null; ghost.value = null; dragging.value = false;
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
}
function pointerCancel() { pointer = null; ghost.value = null; dragging.value = false; }
function keyMove(event) {
  if (event.key === 'Escape') { placing.value = false; pointerCancel(); return; }
  const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
  if (!delta) return;
  event.preventDefault();
  if (whiteRoom.value) { const index = distances.value.indexOf(activeDistance.value), direction = delta[0] || delta[1]; selectDistance(distances.value[Math.max(0, Math.min(distances.value.length - 1, index + direction))] || 12); return; }
  const step = event.shiftKey ? 5 : 1, origin = selected.value === 'colonist' ? colonist.value : target.value;
  const next = { x: origin.x + delta[0] * step, y: origin.y + delta[1] * step };
  if (selected.value === 'colonist') moveColonist(next); else moveTarget(next);
}
</script>

<template>
  <section class="weapon-preview" aria-label="Weapon preview">
    <header class="weapon-preview__header">
      <div><h3>{{ whiteRoom ? 'White-room gun range' : 'Raid village preview' }}</h3><p>{{ weapon.gun.label || 'Unnamed weapon' }}</p></div>
      <Tag :value="rangeText" severity="secondary" data-testid="preview-range-value" />
    </header>
    <SelectButton v-model="scenario" :options="scenarios" option-label="label" option-value="value" :allow-empty="false" aria-label="Preview scenario" :fluid="false" />
    <div v-if="whiteRoom" class="weapon-preview__range-settings">
      <label :for="`${id}-distances`">Target ranges (tiles)<InputText :id="`${id}-distances`" v-model="rangeInput" placeholder="3, 12, 25, 40" /></label>
      <label :for="`${id}-skill`">Shooting skill<InputNumber :input-id="`${id}-skill`" v-model="skill" :min="0" :max="20" :step="1" :use-grouping="false" show-buttons @input="skill = $event.value" /></label>
    </div>
    <Message v-if="whiteRoom && parsedRanges.error" severity="warn" :closable="false">{{ parsedRanges.error }}</Message>
    <div :class="['weapon-preview__scene', { 'weapon-preview__scene--moving': placing || dragging, 'weapon-preview__scene--white': whiteRoom }]" tabindex="0" role="group" aria-label="Weapon range scene" :aria-describedby="`${id}-help ${id}-status`"
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Escape" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerCancel" @lostpointercapture="pointerCancel" @keydown="keyMove">
      <svg :viewBox="viewBox" role="group" aria-label="Generated RimWorld village map" preserveAspectRatio="xMidYMid meet">
        <defs><pattern :id="`${id}-grid`" width="1" height="1" patternUnits="userSpaceOnUse" x="-.5" y="-.5"><path d="M1 0H0V1" fill="none" :stroke="whiteRoom ? '#667176' : 'white'" :stroke-opacity="whiteRoom ? .2 : .045" stroke-width=".035" /></pattern><filter :id="`${id}-tint`" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" :slope="flight.tint[0]" /><feFuncG type="linear" :slope="flight.tint[1]" /><feFuncB type="linear" :slope="flight.tint[2]" /></feComponentTransfer><feDropShadow dx="0" dy="0" stdDeviation=".055" flood-color="#152831" flood-opacity="1" /></filter></defs>
        <rect v-if="whiteRoom" x="-112" y="-112" width="224" height="224" fill="#edf0e9" />
        <image v-else :href="`${base}firing-range.jpg`" v-bind="imageBounds" />
        <rect x="-112" y="-112" width="224" height="224" :fill="`url(#${id}-grid)`" />
        <g v-if="whiteRoom"><path :d="`M${whiteOrigin.x} -8V8`" stroke="#657a78" stroke-width=".1" /><g v-for="distance in distances" :key="distance" :transform="`translate(${whiteOrigin.x + distance},0)`" :data-range-distance="distance" role="button" tabindex="0" :aria-label="`Target at ${distance} tiles`" @keydown.enter.prevent="selectDistance(distance)" @keydown.space.prevent="selectDistance(distance)">
          <rect x="-1.5" y="-2" width="3" height="4" fill="transparent" /><image :href="`${base}target.png`" x="-.5" y="-.75" width="1" height="1.5" :opacity="distance === activeDistance ? 1 : .45" /><text x="0" y="3" :font-size="extent * .04" text-anchor="middle" fill="#26363b">{{ distance }} tiles</text>
        </g></g>
        <g :transform="`translate(${position.x},${position.y})`">
          <path :d="outline" fill="none" stroke="#101710" stroke-width="4" vector-effect="non-scaling-stroke" stroke-opacity=".55" />
          <path :d="outline" :data-radius="range" data-testid="preview-range-outline" fill="none" stroke="white" stroke-width="1.7" vector-effect="non-scaling-stroke" />
          <path v-if="minOutline" :d="minOutline" fill="none" stroke="white" stroke-dasharray="3 3" stroke-width="1.3" vector-effect="non-scaling-stroke" />
          <g data-colonist data-testid="preview-colonist" :data-x="colonist.x" :data-y="colonist.y" role="button" tabindex="0" aria-label="Colonist, drag to reposition" :aria-grabbed="placing || dragging" @focus="selected = 'colonist'" @keydown.enter.prevent="placing = !placing" @keydown.space.prevent="placing = !placing"
            :class="['weapon-preview__colonist', { 'weapon-preview__colonist--invalid': !validPosition }]">
            <rect :x="-pickupSize / 2" :y="-pickupSize / 2" :width="pickupSize" :height="pickupSize" fill="transparent" />
            <ellipse cx="0" cy=".25" rx=".32" ry=".11" fill="black" opacity=".35" />
            <image :href="`${base}colonist.png`" data-testid="preview-pawn-sprite" :x="-markerSize / 2" :y="-markerSize / 2" :width="markerSize" :height="markerSize" />
            <image :href="gunTextureUrl" data-testid="preview-equipped-texture" x=".1" :y="-gunSize[1] / 2" :width="gunSize[0]" :height="gunSize[1]" :transform="`rotate(${Math.atan2(target.y - position.y, target.x - position.x) * 180 / Math.PI})`" preserveAspectRatio="xMidYMid meet" />
            <text x="0" :y="markerSize * .52" :font-size="extent * .047" text-anchor="middle" fill="white" stroke="#151b12" :stroke-width="extent * .004" paint-order="stroke">Colonist</text>
          </g>
        </g>
        <g v-if="!whiteRoom" :transform="`translate(${scene.sandbag.x},${scene.sandbag.y})`" class="weapon-preview__sandbag">
          <circle r=".7" fill="none" stroke="#e5d7a4" stroke-width="1.6" vector-effect="non-scaling-stroke" />
          <text :x="extent * .025" :y="-extent * .045" :font-size="extent * .045" fill="white" stroke="#151b12" :stroke-width="extent * .004" paint-order="stroke">Outer sandbag</text>
        </g>
        <g v-for="shot in flight.shots" :key="shot.id" :transform="`translate(${shot.x},${shot.y}) rotate(${shot.angle})`" data-testid="preview-projectile"><image :href="flight.texture" :x="-flight.size[0] / 2" :y="-flight.size[1] / 2" :width="flight.size[0]" :height="flight.size[1]" :filter="`url(#${id}-tint)`" /></g>
        <g :transform="`translate(${target.x},${target.y})`" :class="['weapon-preview__target', { 'weapon-preview__target--outside': !reach.within }]">
          <path d="M-.85 0H-.3M.3 0H.85M0-.85V-.3M0 .3V.85M-.5-.5H.5V.5H-.5Z" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        </g>
        <slot name="scene-overlay" :target="target" :colonist="position" :reach="reach" :extent="extent" />
      </svg>
      <span class="weapon-preview__scene-label">{{ whiteRoom ? 'WHITE ROOM · SELECT A MARKED TARGET' : 'RAID VILLAGE · DRAG COLONIST TO REPOSITION' }}</span>
    </div>
    <div class="weapon-preview__readout" :id="`${id}-status`" aria-live="polite" aria-atomic="true">
      <Tag :value="status" :severity="reach.isOrigin ? 'secondary' : reach.within ? 'success' : 'warn'" />
      <span v-if="!whiteRoom" data-testid="preview-sandbag-distance">{{ format(sandbagDistance) }} tiles from outer sandbag</span>
      <span data-testid="preview-target-distance">Aim: {{ format(reach.distance) }} tiles</span>
    </div>
    <div class="weapon-preview__controls">
      <Button v-if="!whiteRoom" :label="placing ? 'Cancel move' : 'Pick up colonist'" icon="pi pi-arrows-alt" severity="secondary" outlined :fluid="false" :aria-pressed="placing" @click="togglePickup" />
      <Button label="Reset position" icon="pi pi-replay" severity="secondary" outlined :fluid="false" @click="resetPosition" />
      <div class="weapon-preview__zoom" role="group" aria-label="Preview zoom">
        <Button icon="pi pi-search-plus" aria-label="Zoom in" severity="secondary" outlined :fluid="false" :disabled="extent <= 5" @click="zoom(1 / 1.4)" />
        <Button icon="pi pi-search-minus" aria-label="Zoom out" severity="secondary" outlined :fluid="false" :disabled="extent >= 110" @click="zoom(1.4)" />
        <Button icon="pi pi-expand" aria-label="Fit weapon range" severity="secondary" outlined :fluid="false" @click="fitRange" />
        <Button icon="pi pi-map" :aria-label="whiteRoom ? 'Range overview' : 'Village overview'" severity="secondary" outlined :fluid="false" @click="camera = whiteRoom ? whiteCamera() : { ...initialView }" />
        <Button v-if="!whiteRoom" icon="pi pi-home" aria-label="View village" v-tooltip="'View village'" severity="secondary" outlined :fluid="false" @click="setCamera(scene.sandbag.x + 30, scene.sandbag.y, 60)" />
      </div>
      <slot name="controls" :target="target" :colonist="position" :reach="reach" />
    </div>
    <div class="weapon-preview__controls">
      <Button v-if="flight.firing" label="Stop firing" icon="pi pi-stop" :fluid="false" @click="stopFiring" />
      <span v-else v-tooltip="!reach.within ? 'Aim inside the weapon range, or move closer.' : ''"><Button label="Fire weapon" icon="pi pi-bullseye" :fluid="false" :disabled="!reach.within || reach.isOrigin" @click="fireVisual" /></span>
      <Select v-model="flight.speed" :options="previewSpeeds" option-label="label" option-value="value" aria-label="Flight preview speed" :fluid="false" :disabled="flight.firing" />
      <Tag :value="flight.phase" severity="secondary" data-testid="visual-fire-state" />
    </div>
    <p class="weapon-preview__help">Firing here previews texture, travel speed, and burst spacing in an open lane. Native shooting below tests actual hit rolls and impact effects. Missing uploads use stock reference assets.</p>
    <div class="weapon-preview__media">
      <img :src="gunTextureUrl" alt="Current weapon texture" width="64" height="40" />
      <div><span data-testid="preview-texture-name">{{ gunTextureLabel }}</span><small data-testid="preview-shot-name">{{ shotLabel }}</small></div>
      <Button v-if="playing" label="Stop sound" icon="pi pi-stop" severity="secondary" outlined :fluid="false" @click="stopSound" />
      <Button v-else label="Test fire" icon="pi pi-volume-up" severity="secondary" outlined :fluid="false" :disabled="!shotUrl" :loading="loading" @click="playSound()" />
      <Button label="Handle weapon" icon="pi pi-hand-paper" severity="secondary" outlined :fluid="false" :disabled="!interactUrl || loading" @click="playSound('interact')" />
      <small data-testid="preview-sound-state" aria-live="polite">{{ loading ? 'Loading soundâ€¦' : playing ? 'Playing' : 'Ready' }}</small>
    </div>
    <Message v-if="soundError" severity="warn" :closable="false" data-testid="preview-sound-error">{{ soundError }}</Message>
    <Message v-if="!shotUrl" severity="secondary" :closable="false">Upload a sound file in Files to audition this selected game sound.</Message>
    <p v-if="notice" class="weapon-preview__help" role="status">{{ notice }}</p>
    <p class="weapon-preview__help" :id="`${id}-help`"><template v-if="whiteRoom">The shooter stays on the firing line. Select a marked target or use arrow keys to change distance. Faded targets are distance guides; each target is tested separately.</template><template v-else>Drag the colonist to move him, or pick him up and click open ground. Drag the ground to pan; click to aim. Arrow keys move the selected colonist or target. Use the native test below to evaluate cover and impacts.</template></p>
    <ShootingPreview :weapon="weapon" :colonist="colonist" :target="target" :scenario="scenario" :ranges="distances" :skill="skill ?? 10" />
    <slot name="footer" :target="target" :colonist="position" :reach="reach" />
  </section>
</template>
