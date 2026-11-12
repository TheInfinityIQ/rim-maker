<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
const props = defineProps({ points: Array, title: String, xLabel: String, yLabel: String, bars: Boolean });
const emit = defineEmits(['inspect']);
const host = ref(null), width = ref(500);
let observer;
onMounted(() => { observer = new ResizeObserver(entries => { width.value = Math.max(180, entries[0].contentRect.width); }); observer.observe(host.value); });
onUnmounted(() => observer?.disconnect());
const points = computed(() => props.points.filter(p => Number.isFinite(p.y) && (props.bars || Number.isFinite(p.x))));
const padded = values => { const maximum = Math.max(1, ...values); return Number.isFinite(maximum * 1.08) ? maximum * 1.08 : maximum; };
const maximumY = computed(() => padded(points.value.map(p => p.y)));
const maximumX = computed(() => padded(points.value.map(p => p.x || 0)));
const x = value => 50 + value / maximumX.value * (width.value - 70);
const y = value => 205 - value / maximumY.value * 175;
const format = value => new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
</script>
<template>
  <section ref="host" class="balance-plot" :aria-label="title">
    <h3>{{ title }}</h3>
    <p class="balance-caption">{{ yLabel }}</p>
    <p v-if="!points.length" class="form-section-help">No comparable measurements for this selection. Missing values are not zero.</p>
    <ol v-else-if="bars" class="balance-bars">
      <li v-for="point in [...points].sort((a, b) => b.y - a.y)" :key="point.id" :class="{ 'balance-draft': point.draft }">
        <Button :label="`${point.draft ? '◆ ' : ''}${point.label}`" text severity="secondary" :aria-label="`Inspect ${point.label}`" @click="emit('inspect', point.id)" />
        <div class="balance-bar-track" aria-hidden="true"><div :style="{ width: `${point.y / maximumY * 100}%` }" /></div>
        <span class="balance-number">{{ format(point.y) }}</span>
      </li>
    </ol>
    <svg v-else :viewBox="`0 0 ${width} 260`" role="img" :aria-label="`${title}. ${xLabel} against ${yLabel}. Exact values and selection are available in the reference table below.`">
      <g v-for="i in [0, 1, 2, 3]" :key="i" class="balance-axis">
        <line x1="50" :x2="width - 20" :y1="y(maximumY * i / 3)" :y2="y(maximumY * i / 3)" />
        <text x="43" :y="y(maximumY * i / 3) + 4" text-anchor="end">{{ format(maximumY * i / 3) }}</text>
        <text :x="x(maximumX * i / 3)" y="225" :text-anchor="i === 3 ? 'end' : 'middle'">{{ format(maximumX * i / 3) }}</text>
      </g>
      <text :x="width / 2" y="250" text-anchor="middle">{{ xLabel }}</text>
      <g v-for="point in points" :key="point.id" :class="['balance-mark', { 'balance-mark--draft': point.draft }]" @click="emit('inspect', point.id)">
        <title>{{ point.label }}: {{ xLabel }} {{ format(point.x) }}; {{ yLabel }} {{ format(point.y) }}</title>
        <path v-if="point.draft" :d="`M${x(point.x)} ${y(point.y) - 7}l7 7-7 7-7-7Z`" />
        <circle v-else :cx="x(point.x)" :cy="y(point.y)" r="5" />
      </g>
    </svg>
    <p class="balance-caption">● Official reference <template v-if="points.some(p => p.draft)"> · ◆ Your draft</template></p>
  </section>
</template>
<style scoped>
.balance-plot { min-width: 0; }
h3 { font-size: 16px; font-weight: 500; }
.balance-caption { color: var(--p-text-muted-color); font-size: 12px; line-height: 1.7; margin-block: 8px; }
.balance-bars { list-style: none; padding: 0; display: grid; gap: 8px; }
.balance-bars li { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(20px, 1fr) 50px; gap: 8px; align-items: center; }
.balance-bars :deep(.p-button-label) { white-space: normal; overflow-wrap: anywhere; text-align: left; }
.balance-bar-track { background: var(--p-surface-800); height: 10px; }
.balance-bar-track > div { height: 100%; background: var(--p-primary-color); opacity: .65; }
.balance-draft .balance-bar-track > div { background: var(--p-text-color); opacity: 1; }
.balance-number { font-size: 13px; font-variant-numeric: tabular-nums; text-align: right; }
svg { display: block; width: 100%; overflow: visible; }
text { fill: var(--p-text-muted-color); font-size: 12px; }
.balance-axis line { stroke: var(--p-content-border-color); stroke-width: 1; }
.balance-mark { fill: var(--p-primary-color); cursor: pointer; }
.balance-mark--draft { fill: var(--p-text-color); }
</style>
