<script setup>
import { computed, getCurrentInstance, onMounted, onUnmounted, ref } from 'vue';
import { accuracyEstimate, confidenceInterval } from '@/utility/weaponAccuracy';
import { weaponRange } from '@/utility/rangePreview';

const props = defineProps({ weapon: Object, ranges: Array, skill: Number, rows: Array, selected: Number });
const emit = defineEmits(['select-range']);
const id = `accuracy-curve-${getCurrentInstance().uid}`;
const hovered = ref(null);
const container = ref(null), width = ref(480);
let observer;
onMounted(() => {
  observer = new ResizeObserver(entries => { width.value = Math.max(180, entries[0].contentRect.width); });
  observer.observe(container.value);
});
onUnmounted(() => observer?.disconnect());
const plotWidth = computed(() => width.value - 72);
const limit = computed(() => Math.ceil(Math.max(10, ...props.ranges, weaponRange(props.weapon) || 0) / 10) * 10);
const minimum = computed(() => Math.max(0, Number(props.weapon.gun.verbs[0].minRange) || 0));
const maximum = computed(() => weaponRange(props.weapon) ?? 0);
const x = distance => 52 + distance / limit.value * plotWidth.value;
const y = chance => 232 - chance * 200;
const percent = value => value == null ? 'No ordinary hit percentage' : `${(value * 100).toFixed(1)}%`;
const samples = computed(() => {
  // Include interpolation knots and exact range limits so the line never bridges a forbidden range.
  const distances = new Set([0, 3, 12, 25, 40, minimum.value, maximum.value, ...props.ranges]);
  for (let i = 0; i <= 400; i++) distances.add(limit.value * (i / 400));
  return [...distances].filter(d => d >= 0 && d <= limit.value).sort((a, b) => a - b).map(d => accuracyEstimate(props.weapon, d, props.skill));
});
const path = computed(() => {
  let penDown = false;
  return samples.value.map(point => {
    if (point.chance == null || !point.reachable) { penDown = false; return ''; }
    const command = penDown ? 'L' : 'M'; penDown = true;
    return `${command}${x(point.distance).toFixed(2)},${y(point.chance).toFixed(2)}`;
  }).join(' ');
});
const measured = computed(() => props.rows.filter(row => row.native?.reachable && row.native.trials > 0).map(row => {
  const native = row.native, hits = native.effect ? native.effectCoverage : native.hits;
  return { distance: row.distance, chance: hits / native.trials, interval: confidenceInterval(hits, native.trials), effect: native.effect };
}));
const readout = computed(() => {
  const distance = hovered.value ?? props.selected;
  const row = props.rows.find(row => row.distance === distance) || accuracyEstimate(props.weapon, distance, props.skill);
  return `${Number(distance.toFixed(1))} tiles · ${row.reachable ? percent(row.chance) : 'Out of range'}`;
});
function inspect(event) {
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(event.currentTarget.getScreenCTM().inverse());
  hovered.value = Math.round(Math.max(0, Math.min(limit.value, (point.x - 52) / plotWidth.value * limit.value)) * 10) / 10;
}
</script>

<template>
  <div ref="container" class="accuracy-curve" role="group" aria-label="Accuracy curve">
    <svg :viewBox="`0 0 ${width} 282`" role="img" :aria-labelledby="`${id}-title ${id}-description`" @pointermove="inspect" @pointerleave="hovered = null">
      <title :id="`${id}-title`">Accuracy versus range, Shooting {{ skill }}</title>
      <desc :id="`${id}-description`">Y axis: chance to hit from zero to one hundred percent. X axis: range from zero to {{ limit }} tiles. The line follows game rules for ordinary bullets. Configured distances are circles; crosses mark distances without an ordinary hit percentage. Diamonds show measured target events or effects with 95 percent intervals. Unreachable distances are shaded. Select a distance using the buttons below.</desc>
      <defs><pattern :id="`${id}-outside`" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0" class="accuracy-curve__hatch" /></pattern></defs>
      <rect v-if="minimum > 0" x="52" y="32" :width="x(Math.min(minimum, limit)) - 52" height="200" :fill="`url(#${id}-outside)`" />
      <rect v-if="maximum < limit" :x="x(maximum)" y="32" :width="x(limit) - x(maximum)" height="200" :fill="`url(#${id}-outside)`" />
      <g v-for="tick in [0, .25, .5, .75, 1]" :key="tick">
        <path :d="`M52 ${y(tick)}H${x(limit)}`" class="accuracy-curve__grid" />
        <text x="43" :y="y(tick) + 4" text-anchor="end">{{ tick * 100 }}%</text>
      </g>
      <g v-for="i in [0, 1, 2, 3, 4]" :key="i">
        <text :x="x(limit * i / 4)" y="251" text-anchor="middle">{{ limit * i / 4 }}</text>
      </g>
      <text x="52" y="18">Accuracy</text><text :x="52 + plotWidth / 2" y="275" text-anchor="middle">Range (tiles)</text>
      <path :d="path" class="accuracy-curve__line" data-testid="accuracy-curve-line" fill="none" />
      <g v-for="row in rows" :key="row.distance" :class="['accuracy-curve__pin', { 'accuracy-curve__pin--selected': selected === row.distance }]" :data-curve-range="row.distance" :data-chance="row.chance" :data-reachable="row.reachable" @click="emit('select-range', row.distance)">
        <title>{{ row.distance }} tiles: {{ row.reachable ? percent(row.chance) : 'Out of range' }}. Click to aim.</title>
        <path :d="`M${x(row.distance)} 32V232`" class="accuracy-curve__guide" />
        <circle v-if="row.chance != null" :cx="x(row.distance)" :cy="y(row.chance)" r="6" />
        <path v-else :d="`M${x(row.distance) - 4} 228l8 8m-8 0 8-8`" stroke="currentColor" stroke-width="2" />
        <rect :x="x(row.distance) - 10" :y="y(row.chance ?? 0) - 12" width="20" height="24" fill="transparent" stroke="none" />
      </g>
      <g v-for="point in measured" :key="point.distance" class="accuracy-curve__measured" data-testid="accuracy-curve-measured">
        <title>{{ point.distance }} tiles: {{ percent(point.chance) }} measured {{ point.effect ? 'effect coverage' : 'target events' }}; 95% interval {{ point.interval?.map(percent).join(' to ') }}.</title>
        <path v-if="point.interval" :d="`M${x(point.distance) - 4} ${y(point.interval[0])}h8M${x(point.distance)} ${y(point.interval[0])}V${y(point.interval[1])}M${x(point.distance) - 4} ${y(point.interval[1])}h8`" />
        <path :d="`M${x(point.distance)} ${y(point.chance) - 5}l5 5-5 5-5-5Z`" />
      </g>
    </svg>
    <output class="accuracy-curve__readout" data-testid="accuracy-curve-readout">{{ readout }}</output>
    <div class="accuracy-curve__legend"><span><i class="accuracy-curve__legend-line" />Calculated chance</span><span v-if="measured.length"><i class="accuracy-curve__legend-measured" />Measured events / effects · 95% interval</span><span>Hatched: out of range</span><span v-if="rows.some(row => row.chance == null)">×: no hit percentage</span></div>
    <p v-if="!path.trim()" class="weapon-preview__help">No ordinary accuracy curve is available for these settings. Use the native test for special projectile effects.</p>
    <div class="weapon-preview__controls" role="group" aria-label="Aim at configured range">
      <Button v-for="row in rows" :key="row.distance" :label="`${row.distance} tiles`" :aria-label="`Aim at ${row.distance} tiles: ${row.reachable ? percent(row.chance) : 'out of range'}`" :aria-pressed="selected === row.distance" :outlined="selected !== row.distance" severity="secondary" :fluid="false" @click="emit('select-range', row.distance)" />
    </div>
    <p class="weapon-preview__help">Select a marker or a distance button to aim. Edit Target ranges above to move the markers. The calculated line stops at the weapon's range limits; measured points remain independent samples.</p>
  </div>
</template>
