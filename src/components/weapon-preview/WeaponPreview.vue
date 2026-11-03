<script setup>
import { computed, getCurrentInstance, ref, watch } from 'vue';
import { WeaponRanged } from '@/models/weapon';
import { rangeOutline, targetReach, weaponRange } from '@/utility/rangePreview';
import scene from './firing-range.json';

const props = defineProps({
  weapon: { type: WeaponRanged, required: true },
});
const emit = defineEmits(['target-change']);
const id = `weapon-preview-${getCurrentInstance().uid}`;
const target = ref({ x: 10, y: 0 });
const zoom = ref(1);
const range = computed(() => weaponRange(props.weapon));
const reach = computed(() => targetReach(props.weapon, target.value));
const extent = computed(() => Math.min(110, Math.max(6, ((range.value ?? 15.9) + 5) * zoom.value)));
const viewBox = computed(() => `${-extent.value} ${-extent.value} ${extent.value * 2} ${extent.value * 2}`);
const outline = computed(() => range.value == null ? '' : rangeOutline(range.value));
const minOutline = computed(() => reach.value.minRange ? rangeOutline(reach.value.minRange) : '');
const rangeText = computed(() => range.value == null ? 'Set a range' : `${format(range.value)} tiles`);
const status = computed(() => reach.value.isOrigin ? 'Colonist position' : range.value == null ? 'Set a weapon range' : reach.value.within ? 'Within range' : 'Outside range');
const image = `${import.meta.env.BASE_URL}previews/firing-range.jpg`;
const imageBounds = { x: -scene.centerX / scene.pixelsPerTile, y: -scene.centerY / scene.pixelsPerTile,
  width: scene.width / scene.pixelsPerTile, height: scene.height / scene.pixelsPerTile };
watch([() => props.weapon, range], () => { zoom.value = 1; });
function format(value) { return Number(value.toFixed(1)).toString(); }
function moveTarget(x, y) {
  target.value = { x: Math.max(-110, Math.min(110, Math.round(x))), y: Math.max(-110, Math.min(110, Math.round(y))) };
  emit('target-change', { ...target.value, ...targetReach(props.weapon, target.value) });
}
function selectTarget(event) {
  const svg = event.currentTarget.querySelector('svg');
  const matrix = svg.getScreenCTM();
  if (!matrix) return;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  moveTarget(point.x, point.y);
  event.currentTarget.focus({ preventScroll: true });
}
function keyTarget(event) {
  const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
  if (!direction) return;
  event.preventDefault();
  const step = event.shiftKey ? 5 : 1;
  moveTarget(target.value.x + direction[0] * step, target.value.y + direction[1] * step);
}
</script>

<template>
  <section class="weapon-preview" aria-label="Weapon preview">
    <header class="weapon-preview__header">
      <div><h3>Weapon preview</h3><p>{{ weapon.gun.label || 'Unnamed weapon' }}</p></div>
      <Tag :value="rangeText" severity="secondary" data-testid="preview-range-value" />
    </header>
    <div class="weapon-preview__scene" tabindex="0" role="group" aria-label="Weapon range scene" :aria-describedby="`${id}-help ${id}-status`"
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown" @pointerup="selectTarget" @keydown="keyTarget">
      <svg :viewBox="viewBox" role="img" aria-label="Colonist with the selected weapon's white range outline" preserveAspectRatio="xMidYMid meet">
        <defs><pattern :id="`${id}-grid`" width="1" height="1" patternUnits="userSpaceOnUse" x="-.5" y="-.5"><path d="M1 0H0V1" fill="none" stroke="white" stroke-opacity=".055" stroke-width=".035" /></pattern></defs>
        <image :href="image" v-bind="imageBounds" />
        <rect x="-112" y="-112" width="224" height="224" :fill="`url(#${id}-grid)`" />
        <path :d="outline" fill="none" stroke="#101710" stroke-width="4" vector-effect="non-scaling-stroke" stroke-opacity=".55" />
        <path :d="outline" :data-radius="range" data-testid="preview-range-outline" fill="none" stroke="white" stroke-width="1.7" vector-effect="non-scaling-stroke" />
        <path v-if="minOutline" :d="minOutline" fill="none" stroke="white" stroke-dasharray="3 3" stroke-width="1.3" vector-effect="non-scaling-stroke" />
        <g class="weapon-preview__colonist">
          <path d="M-.8-.4V.3H-.1M.1.3H.8V-.4" fill="none" stroke="white" stroke-width="1.2" vector-effect="non-scaling-stroke" />
          <text x="0" :y="extent * .07" :font-size="extent * .045" text-anchor="middle" fill="white" stroke="#151b12" stroke-width=".14" paint-order="stroke">Colonist</text>
        </g>
        <g :transform="`translate(${target.x},${target.y})`" :class="['weapon-preview__target', { 'weapon-preview__target--outside': !reach.within }]">
          <path d="M-.85 0H-.3M.3 0H.85M0-.85V-.3M0 .3V.85M-.5-.5H.5V.5H-.5Z" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        </g>
        <slot name="scene-overlay" :target="target" :reach="reach" :extent="extent" />
      </svg>
      <span class="weapon-preview__scene-label">OPEN TERRAIN · REFERENCE COLONIST</span>
    </div>
    <div class="weapon-preview__readout" :id="`${id}-status`" aria-live="polite" aria-atomic="true">
      <Tag :value="status" :severity="reach.isOrigin ? 'secondary' : reach.within ? 'success' : 'warn'" />
      <span data-testid="preview-target-distance">{{ format(reach.distance) }} tiles from colonist</span>
    </div>
    <div class="weapon-preview__controls">
      <div class="weapon-preview__zoom" role="group" aria-label="Preview zoom">
        <Button icon="pi pi-search-plus" aria-label="Zoom in" severity="secondary" outlined :disabled="zoom <= .4" @click="zoom = Math.max(.4, zoom / 1.3)" />
        <Button icon="pi pi-search-minus" aria-label="Zoom out" severity="secondary" outlined :disabled="zoom >= 3" @click="zoom = Math.min(3, zoom * 1.3)" />
        <Button icon="pi pi-expand" aria-label="Fit weapon range" severity="secondary" outlined @click="zoom = 1" />
      </div>
      <slot name="controls" :target="target" :reach="reach" />
    </div>
    <p class="weapon-preview__help" :id="`${id}-help`">Click a tile or use arrow keys to move the target. Range alone does not account for cover, sight lines, or colonist accuracy.</p>
    <p v-if="range > 105" class="weapon-preview__help">This range extends beyond the captured scene.</p>
    <slot name="footer" :target="target" :reach="reach" />
  </section>
</template>
