<script setup>
import { computed, getCurrentInstance, ref, toRef } from 'vue';
import { WeaponRanged } from '@/models/weapon';
import { overviewCamera, placementCell, rangeOutline, targetReach, weaponRange } from '@/utility/rangePreview';
import { usePreviewMedia } from './usePreviewMedia';
import scene from './firing-range.json';

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
const markerSize = computed(() => Math.max(1.8, extent.value * .16));
const validPosition = computed(() => placementCell(position.value, bounds, blocked).valid);
const rangeText = computed(() => range.value == null ? 'Set a range' : `${format(range.value)} tiles`);
const status = computed(() => reach.value.isOrigin ? 'Colonist position' : range.value == null ? 'Set a weapon range' : reach.value.within ? 'Within range' : 'Outside range');
const imageBounds = { x: -scene.centerX / scene.pixelsPerTile, y: -scene.centerY / scene.pixelsPerTile,
  width: scene.width / scene.pixelsPerTile, height: scene.height / scene.pixelsPerTile };
const { gunTextureUrl, gunTextureLabel, shotUrl, interactUrl, shotLabel, playing, loading, soundError, playSound, stopSound } = usePreviewMedia(toRef(props, 'weapon'));
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
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, world, origin: { ...colonist.value }, camera: { ...camera.value }, kind: onColonist ? 'colonist' : placing.value ? 'place' : 'ground', moved: false };
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
  if (pointer.kind === 'colonist') {
    if (pointer.moved) { moveColonist(ghost.value || pointer.origin); placing.value = false; }
    else placing.value = !placing.value;
  } else if (pointer.kind === 'place' && world) {
    if (moveColonist(world)) placing.value = false;
  } else if (!pointer.moved && world) { moveTarget(world); selected.value = 'target'; }
  pointer = null; ghost.value = null; dragging.value = false;
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
}
function pointerCancel() { pointer = null; ghost.value = null; dragging.value = false; }
function keyMove(event) {
  if (event.key === 'Escape') { placing.value = false; pointerCancel(); return; }
  const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
  if (!delta) return;
  event.preventDefault();
  const step = event.shiftKey ? 5 : 1, origin = selected.value === 'colonist' ? colonist.value : target.value;
  const next = { x: origin.x + delta[0] * step, y: origin.y + delta[1] * step };
  if (selected.value === 'colonist') moveColonist(next); else moveTarget(next);
}
</script>

<template>
  <section class="weapon-preview" aria-label="Weapon preview">
    <header class="weapon-preview__header">
      <div><h3>Raid village preview</h3><p>{{ weapon.gun.label || 'Unnamed weapon' }}</p></div>
      <Tag :value="rangeText" severity="secondary" data-testid="preview-range-value" />
    </header>
    <div :class="['weapon-preview__scene', { 'weapon-preview__scene--moving': placing || dragging }]" tabindex="0" role="group" aria-label="Weapon range scene" :aria-describedby="`${id}-help ${id}-status`"
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Escape" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerCancel" @keydown="keyMove">
      <svg :viewBox="viewBox" role="group" aria-label="Generated RimWorld village map" preserveAspectRatio="xMidYMid meet">
        <defs><pattern :id="`${id}-grid`" width="1" height="1" patternUnits="userSpaceOnUse" x="-.5" y="-.5"><path d="M1 0H0V1" fill="none" stroke="white" stroke-opacity=".045" stroke-width=".035" /></pattern></defs>
        <image :href="`${base}firing-range.jpg`" v-bind="imageBounds" />
        <rect x="-112" y="-112" width="224" height="224" :fill="`url(#${id}-grid)`" />
        <g :transform="`translate(${position.x},${position.y})`">
          <path :d="outline" fill="none" stroke="#101710" stroke-width="4" vector-effect="non-scaling-stroke" stroke-opacity=".55" />
          <path :d="outline" :data-radius="range" data-testid="preview-range-outline" fill="none" stroke="white" stroke-width="1.7" vector-effect="non-scaling-stroke" />
          <path v-if="minOutline" :d="minOutline" fill="none" stroke="white" stroke-dasharray="3 3" stroke-width="1.3" vector-effect="non-scaling-stroke" />
          <g data-colonist data-testid="preview-colonist" :data-x="colonist.x" :data-y="colonist.y" role="button" tabindex="0" aria-label="Colonist, drag to reposition" :aria-grabbed="placing || dragging" @focus="selected = 'colonist'" @keydown.enter.prevent="placing = !placing" @keydown.space.prevent="placing = !placing"
            :class="['weapon-preview__colonist', { 'weapon-preview__colonist--invalid': !validPosition }]">
            <rect :x="-markerSize * .7" :y="-markerSize * .7" :width="markerSize * 1.4" :height="markerSize * 1.4" fill="transparent" />
            <ellipse cx="0" :cy="markerSize * .16" :rx="markerSize * .18" :ry="markerSize * .07" fill="black" opacity=".35" />
            <image :href="`${base}colonist.png`" :x="-markerSize / 2" :y="-markerSize / 2" :width="markerSize" :height="markerSize" />
            <image :href="gunTextureUrl" data-testid="preview-equipped-texture" :x="markerSize * .04" :y="markerSize * .02" :width="markerSize * .48" :height="markerSize * .24" preserveAspectRatio="xMidYMid meet" />
            <text x="0" :y="markerSize * .52" :font-size="extent * .047" text-anchor="middle" fill="white" stroke="#151b12" :stroke-width="extent * .004" paint-order="stroke">Colonist</text>
          </g>
        </g>
        <g :transform="`translate(${scene.sandbag.x},${scene.sandbag.y})`" class="weapon-preview__sandbag">
          <circle r=".7" fill="none" stroke="#e5d7a4" stroke-width="1.6" vector-effect="non-scaling-stroke" />
          <text :x="extent * .025" :y="-extent * .045" :font-size="extent * .045" fill="white" stroke="#151b12" :stroke-width="extent * .004" paint-order="stroke">Outer sandbag</text>
        </g>
        <g :transform="`translate(${target.x},${target.y})`" :class="['weapon-preview__target', { 'weapon-preview__target--outside': !reach.within }]">
          <path d="M-.85 0H-.3M.3 0H.85M0-.85V-.3M0 .3V.85M-.5-.5H.5V.5H-.5Z" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        </g>
        <slot name="scene-overlay" :target="target" :colonist="position" :reach="reach" :extent="extent" />
      </svg>
      <span class="weapon-preview__scene-label">RAID VILLAGE Â· {{ placing || dragging ? 'PLACE COLONIST ON OPEN GROUND' : 'DRAG COLONIST TO REPOSITION' }}</span>
    </div>
    <div class="weapon-preview__readout" :id="`${id}-status`" aria-live="polite" aria-atomic="true">
      <Tag :value="status" :severity="reach.isOrigin ? 'secondary' : reach.within ? 'success' : 'warn'" />
      <span data-testid="preview-sandbag-distance">{{ format(sandbagDistance) }} tiles from outer sandbag</span>
      <span data-testid="preview-target-distance">Aim: {{ format(reach.distance) }} tiles</span>
    </div>
    <div class="weapon-preview__controls">
      <Button :label="placing ? 'Cancel move' : 'Pick up colonist'" icon="pi pi-arrows-alt" severity="secondary" outlined :fluid="false" :aria-pressed="placing" @click="togglePickup" />
      <Button label="Reset position" icon="pi pi-replay" severity="secondary" outlined :fluid="false" @click="resetPosition" />
      <div class="weapon-preview__zoom" role="group" aria-label="Preview zoom">
        <Button icon="pi pi-search-plus" aria-label="Zoom in" severity="secondary" outlined :fluid="false" :disabled="extent <= 5" @click="zoom(1 / 1.4)" />
        <Button icon="pi pi-search-minus" aria-label="Zoom out" severity="secondary" outlined :fluid="false" :disabled="extent >= 110" @click="zoom(1.4)" />
        <Button icon="pi pi-expand" aria-label="Fit weapon range" severity="secondary" outlined :fluid="false" @click="fitRange" />
        <Button icon="pi pi-map" aria-label="Village overview" severity="secondary" outlined :fluid="false" @click="camera = { ...initialView }" />
        <Button icon="pi pi-home" aria-label="View village" v-tooltip="'View village'" severity="secondary" outlined :fluid="false" @click="setCamera(scene.sandbag.x + 30, scene.sandbag.y, 60)" />
      </div>
      <slot name="controls" :target="target" :colonist="position" :reach="reach" />
    </div>
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
    <p class="weapon-preview__help" :id="`${id}-help`">Drag the colonist to move him, or pick him up and click open ground. Drag the ground to pan; click to aim. Arrow keys move the selected colonist or target. Cover, accuracy, and damage are not simulated here.</p>
    <slot name="footer" :target="target" :colonist="position" :reach="reach" />
  </section>
</template>
