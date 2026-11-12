<script setup>
import { computed, getCurrentInstance, onUnmounted, ref, toRef, watch } from 'vue';
import { usePreviewMedia } from '@/components/weapon-preview/usePreviewMedia';
import { flightPlan, flightAt, graphicSize } from '@/utility/projectileFlight';
import { projectileDefinition } from '@/utility/weaponAccuracy';
import { referenceTextureUrl } from '@/utility/referenceTextures';
const props = defineProps({ weapon: Object, distance: Number, elapsed: Number, supported: Boolean, label: String });
const base = `${import.meta.env.BASE_URL}previews/`;
const tintId = `balance-shot-tint-${getCurrentInstance().uid}`;
const media = usePreviewMedia(toRef(props, 'weapon'));
const projectile = computed(() => props.weapon.kind === 'melee' ? null : projectileDefinition(props.weapon));
const uploaded = ref('');
watch(() => projectile.value?.graphicData?.textureFile, file => {
  if (uploaded.value) URL.revokeObjectURL(uploaded.value);
  uploaded.value = file && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : '';
}, { immediate: true });
onUnmounted(() => { if (uploaded.value) URL.revokeObjectURL(uploaded.value); });
const texture = computed(() => uploaded.value || referenceTextureUrl(projectile.value?.graphicData?.texPath));
const size = computed(() => graphicSize(projectile.value?.graphicData));
const gunSize = computed(() => graphicSize(props.weapon.gun.graphicData));
const tint = computed(() => {
  const values = String(projectile.value?.graphicData?.color || '(1,1,1)').match(/[\d.]+/g)?.map(Number) || [1, 1, 1];
  return values.slice(0, 3).map(n => Math.max(...values) > 1 ? n / 255 : n);
});
const plan = computed(() => {
  if (!props.supported) return null;
  try {
    const result = flightPlan(props.weapon, { x: 0, y: 0 }, { x: props.distance, y: 0 }, projectile.value);
    const count = Number(props.weapon.gun.verbs[0].burstShotCount ?? 1);
    if (!Number.isInteger(count) || count < 1 || count > 200) return null;
    // The interactive preview caps bursts at 20; comparison scenes also cover native 25-shot miniguns.
    result.count = count; result.lastShot = result.warmup + (count - 1) * result.gap;
    return result;
  } catch { return null; }
});
const shots = computed(() => {
  if (!plan.value || props.elapsed <= 0) return [];
  const period = plan.value.warmup + (plan.value.count - 1) * plan.value.gap + Math.max(1, plan.value.cooldown);
  // Keep earlier projectiles visible while the next firing cycle begins.
  const cycle = Math.floor(props.elapsed * 60 / period), result = [];
  const activeCycles = Math.min(100, Math.ceil(plan.value.flightTicks / period) + 1);
  for (let i = Math.max(0, cycle - activeCycles); i <= cycle; i++) {
    result.push(...flightAt(plan.value, props.elapsed * 60 - i * period).map(s => ({ ...s, id: `${i}-${s.id}` })));
  }
  return result;
});
</script>
<template>
  <svg class="balance-scene" :viewBox="`-3 -4 ${distance + 6} 8`" role="img" :aria-label="`${label}: fixed-size pawn and target at ${distance} cells. Open-lane travel illustration, not native hit or impact simulation.`">
    <defs><filter :id="tintId" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" :slope="tint[0]" /><feFuncG type="linear" :slope="tint[1]" /><feFuncB type="linear" :slope="tint[2]" /></feComponentTransfer></filter></defs>
    <rect x="-3" y="-4" :width="distance + 6" height="8" class="balance-scene-floor" />
    <path :d="`M-3 1H${distance + 3}M0 -4V4M${distance} -4V4`" class="balance-scene-guide" fill="none" />
    <circle v-if="Number(weapon.gun.verbs[0]?.range) > 0" :r="Number(weapon.gun.verbs[0]?.range)" fill="none" stroke="white" stroke-width=".07" />
    <image :href="`${base}colonist.png`" x="-1.33333" y="-1.33333" width="2.66667" height="2.66667" data-testid="balance-pawn" />
    <image v-if="media.gunTextureUrl.value" :href="media.gunTextureUrl.value" x=".1" :y="-gunSize[1] / 2" :width="gunSize[0]" :height="gunSize[1]" />
    <image :href="`${base}target.png`" :x="distance - .5" y="-.75" width="1" height="1.5" />
    <g v-for="shot in shots" :key="shot.id" :transform="`translate(${shot.x},${shot.y}) rotate(${shot.angle})`" data-testid="balance-projectile">
      <image v-if="texture" :href="texture" :x="-size[0] / 2" :y="-size[1] / 2" :width="size[0]" :height="size[1]" :filter="`url(#${tintId})`" />
      <circle v-else r=".08" fill="white" />
    </g>
    <text v-if="supported && !plan" x="0" y="3" fill="currentColor" font-size=".35">Travel illustration unavailable at these settings</text>
  </svg>
</template>
<style scoped>
.balance-scene { display: block; width: 100%; aspect-ratio: 2 / 1; background: var(--p-surface-900); }
.balance-scene-floor { fill: var(--p-surface-800); }
.balance-scene-guide { stroke: var(--p-surface-600); stroke-width: .04; }
</style>
