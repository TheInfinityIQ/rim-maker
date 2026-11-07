import { computed, onDeactivated, onUnmounted, ref, watch } from 'vue';
import { flightAt, flightPlan, graphicSize } from '@/utility/projectileFlight';
import { projectileDefinition } from '@/utility/weaponAccuracy';
import textures from './projectile-textures.json';

const base = `${import.meta.env.BASE_URL}previews/projectiles/`;
export function useFlightPreview(weapon, colonist, target, audio, stopAudio = () => {}) {
  const shots = ref([]), firing = ref(false), phase = ref('Ready'), speed = ref(1);
  const definition = computed(() => projectileDefinition(weapon.value));
  const uploaded = ref(''); let frame, started, plan, generation = 0;
  watch(() => definition.value?.graphicData?.textureFile, file => {
    if (uploaded.value) URL.revokeObjectURL(uploaded.value);
    uploaded.value = file && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : '';
  }, { immediate: true });
  const texture = computed(() => uploaded.value || (textures[definition.value?.graphicData?.texPath] ? base + textures[definition.value.graphicData.texPath].file : ''));
  const size = computed(() => graphicSize(definition.value?.graphicData));
  const tint = computed(() => {
    const values = String(definition.value?.graphicData?.color || '(1,1,1)').match(/[\d.]+/g)?.map(Number) || [1, 1, 1];
    return values.slice(0, 3).map(n => Math.max(...values) > 1 ? n / 255 : n);
  });
  function finish() { cancelAnimationFrame(frame); shots.value = []; firing.value = false; phase.value = 'Ready'; }
  function stop() { generation++; finish(); stopAudio(); }
  function update(time) {
    const ticks = (time - started) * .06 * speed.value;
    shots.value = flightAt(plan, ticks);
    phase.value = ticks < plan.warmup ? 'Aiming' : ticks <= plan.lastShot ? 'Firing' : ticks < plan.lastShot + plan.cooldown ? 'Cooldown' : 'Projectile in flight';
    if (ticks > plan.lastShot + Math.max(plan.flightTicks, plan.cooldown)) { finish(); return; }
    frame = requestAnimationFrame(update);
  }
  async function fire() {
    stop(); plan = flightPlan(weapon.value, colonist.value, target.value, definition.value);
    const version = generation;
    firing.value = true; phase.value = 'Preparing sound…';
    try { await audio('shot', { delay: plan.warmup / 60 / speed.value, gap: plan.gap / 60 / speed.value, count: plan.count }); }
    catch (error) { if (version === generation) stop(); throw error; }
    if (version !== generation) return;
    started = performance.now(); firing.value = true; frame = requestAnimationFrame(update);
  }
  watch([weapon, colonist, target], stop, { deep: true }); watch(speed, stop);
  onDeactivated(stop);
  onUnmounted(() => { stop(); if (uploaded.value) URL.revokeObjectURL(uploaded.value); });
  return { shots, firing, phase, speed, texture, tint, size, fire, stop };
}
