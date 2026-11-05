<script setup>
import { computed, ref } from 'vue';
import { accuracyEstimate, accuracyGameVersion, confidenceInterval } from '@/utility/weaponAccuracy';
const props = defineProps({ weapon: Object, ranges: Array, skill: Number, result: Object, stale: Boolean, connected: Boolean, busy: Boolean });
const emit = defineEmits(['measure']);
const trials = ref(200);
const referenceUrl = `${import.meta.env.BASE_URL}previews/accuracy-reference.json`;
const rows = computed(() => props.ranges.map(distance => {
  const estimate = accuracyEstimate(props.weapon, distance, props.skill);
  const native = !props.stale && props.result?.rows.find(row => row.distance === distance);
  return { ...estimate, native, reachable: native ? native.reachable : estimate.reachable,
    chance: native ? native.reachable && native.analyticApplicable ? native.gameHitChance : null : estimate.chance };
}));
const percent = value => value == null ? '—' : `${(value * 100).toFixed(1)}%`;
const number = value => value == null ? '—' : Number(value.toFixed(3)).toString();
function score(row) { return row.effect ? row.effectCoverage : row.hits; }
function interval(row) { return confidenceInterval(score(row), row.trials)?.map(percent).join(' – '); }
function nativeValue(row, launch, impact, percentage = false) {
  const format = percentage ? percent : number;
  if (!row) return null;
  return row[launch] === row[impact] ? format(row[launch]) : `${format(row[launch])} → ${format(row[impact])}`;
}
</script>
<template>
  <section class="accuracy-report" aria-label="White room accuracy">
    <div class="weapon-preview__header"><h3>Accuracy by range</h3><Tag :value="result && !stale ? 'Measured in RimWorld' : 'Game-rule calculation'" severity="secondary" /></div>
    <p class="weapon-preview__help">Healthy adult shooter, Shooting {{ skill }}, Normal weapon quality, stationary human-sized unarmoured targets, clear weather and no cover. Each distance is tested separately.</p>
    <div class="accuracy-report__scroll">
      <table class="accuracy-report__table">
        <thead><tr><th>Range</th><th>Chance to hit</th><th>Native target events</th><th>Projectile damage</th><th>Armour penetration</th></tr></thead>
        <tbody><tr v-for="row in rows" :key="row.distance" :data-range="row.distance" :class="{ 'accuracy-report__outside': !row.reachable }">
          <th>{{ row.distance }} tiles</th>
          <td><span v-if="row.reachable" :title="row.reason" data-testid="range-hit-chance">{{ percent(row.chance) }}</span><span v-else>Out of range</span></td>
          <td v-if="row.native?.trials"><span>{{ score(row.native) }}/{{ row.native.trials }} ({{ percent(score(row.native) / row.native.trials) }})</span><small v-if="row.native.effect">{{ row.native.effect }} at target, 30 ticks after impact</small><small>95% interval {{ interval(row.native) }}</small><small v-if="!row.native.analyticApplicable">Impact centres: {{ row.native.centerImpacts }} · blast-footprint overlaps: {{ row.native.footprintOverlaps }}</small></td>
          <td v-else>Not measured</td>
          <td>{{ nativeValue(row.native, 'damageAtLaunch', 'damageAtImpact') ?? number(row.damage) }}</td>
          <td>{{ nativeValue(row.native, 'penetrationAtLaunch', 'penetrationAtImpact', true) ?? percent(row.penetration) }}</td>
        </tr></tbody>
      </table>
    </div>
    <p class="weapon-preview__help">Hit chance is per projectile, before armour. Native target events count shots that reached the target's damage/effect handler, including explosive effects. A blast-footprint overlap is spatial coverage, not a guarantee of injury or status effects.</p>
    <Message v-if="(!result || stale) && rows.some(row => row.reachable && row.reason)" severity="secondary" :closable="false">Special classes, forced scatter, and additional modifiers need the native test. A single ordinary hit percentage would misrepresent those weapons.</Message>
    <Message v-if="result && !stale && rows.some(row => row.native?.reachable && !row.native.analyticApplicable)" severity="secondary" :closable="false">This weapon uses special projectile rules. The measured target events and effect coverage are shown instead of an ordinary hit percentage.</Message>
    <div class="weapon-preview__controls">
      <label>Trials per distance <Select v-model="trials" :options="[100, 200, 500, 1000]" aria-label="Trials per distance" :fluid="false" :disabled="busy" /></label>
      <span v-tooltip="!connected ? 'Connect the local companion in Shoot your weapon in RimWorld below.' : ''"><Button label="Measure accuracy in RimWorld" icon="pi pi-chart-bar" :fluid="false" :disabled="!connected || busy || !ranges.length" @click="emit('measure', trials)" /></span>
    </div>
    <Message v-if="stale" severity="warn" :closable="false">Settings changed. Rerun the test to measure this configuration.</Message>
    <p class="weapon-preview__help">Standard projectile damage and penetration do not decay with firing distance in the reviewed {{ accuracyGameVersion }} code. Native measurements show launch → impact values if a special projectile changes them. Armour and damage workers still affect injury; explosion falloff uses distance from the blast centre.</p>
    <p class="weapon-preview__help">Validated against 900 native assault-rifle projectiles. <a :href="referenceUrl" target="_blank" rel="noopener">Reference test results</a></p>
  </section>
</template>
