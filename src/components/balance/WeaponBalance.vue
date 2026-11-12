<script setup>
import { computed, onDeactivated, onUnmounted, ref, watch } from 'vue';
import { createWeapon, weaponTemplates } from '@/utility/weaponTypes';
import { assessDraft, ingredientEffort, readableRole, technologyFor } from '@/utility/weaponBalance';
import { proposeBalance, balanceSignature } from '@/utility/automaticBalance';
import { useWorkbenchStore } from '@/stores/workbench';
import BalanceScene from './BalanceScene.vue';
import BalancePlot from './BalancePlot.vue';
const props = defineProps({ weapon: Object });
const emit = defineEmits(['edit']);
const workbench = useWorkbenchStore();
const example = createWeapon(); example.gun.label = 'Assault rifle example';
const weapon = computed(() => props.weapon || example);
const power = ref(100), playing = ref(false), elapsed = ref(0), notice = ref('');
const proposal = computed(() => proposeBalance(weapon.value, power.value));
const comparison = computed(() => proposal.value.comparison);
const reference = computed(() => comparison.value.reference);
const referenceWeapon = computed(() => reference.value && weaponTemplates.some(t => t.defName === reference.value.id) ? createWeapon(reference.value.kind, reference.value.id) : null);
const current = computed(() => assessDraft(weapon.value, comparison.value.distance, 10));
const proposed = computed(() => proposal.value.preview ? assessDraft(proposal.value.preview, comparison.value.distance, 10) : null);
const referenceAssessment = computed(() => referenceWeapon.value ? assessDraft(referenceWeapon.value, comparison.value.distance, 10) : null);
const ingredients = computed(() => ingredientEffort(weapon.value.gun.costList));
const points = computed(() => proposal.value.samples.flatMap(r => [
  { id: `r-${r.distance}`, label: `Reference at ${r.distance} cells`, x: r.distance, y: r.reference },
  { id: `c-${r.distance}`, label: `Current at ${r.distance} cells`, x: r.distance, y: r.current, draft: true },
  { id: `p-${r.distance}`, label: `Proposed at ${r.distance} cells`, x: r.distance, y: r.proposed, proposal: true },
]));
const format = value => value == null ? 'Not estimated' : new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
let frame, start;
function stop() { cancelAnimationFrame(frame); playing.value = false; elapsed.value = 0; }
function animate(time) { elapsed.value = (time - start) / 1000; if (elapsed.value >= 15) { stop(); return; } frame = requestAnimationFrame(animate); }
function play() {
  if (playing.value) { stop(); return; }
  stop(); playing.value = true; start = performance.now(); frame = requestAnimationFrame(animate);
}
function apply() { stop(); notice.value = workbench.apply(weapon.value, proposal.value) ? 'Adjustments applied. Your draft and exported mod now use this recovery time.' : 'The draft changed or no edit was needed. Review the refreshed preview.'; }
function undo() { stop(); notice.value = workbench.undo(weapon.value) ? 'Previous recovery time restored.' : 'Recovery time was edited afterwards; Undo will not overwrite that change.'; }
watch(() => balanceSignature(weapon.value), stop);
watch(power, () => { stop(); notice.value = ''; });
watch(() => props.weapon, () => { power.value = 100; notice.value = ''; stop(); });
onDeactivated(stop); onUnmounted(stop);
</script>
<template>
  <div class="automatic-balance" data-testid="automatic-balance">
    <header><h2>Balance your weapon</h2><p>RimMaker picks the comparison and test conditions. Review the result, then apply only if you like it.</p></header>
    <Message v-if="!props.weapon" severity="secondary" :closable="false">This is an assault-rifle demonstration. Create a weapon in the workbench to review and adjust your own draft. <RouterLink to="/weapon">Open workbench</RouterLink></Message>
    <div class="auto-match" data-testid="automatic-match"><strong>{{ technologyFor(weapon) }} · {{ reference ? readableRole(reference.role) : 'No reference' }}</strong><span>{{ comparison.reason }}</span></div>
    <div class="auto-scenes">
      <Panel header="Closest official comparison" data-testid="auto-reference">
        <h3>{{ reference?.label || 'No compatible reference' }}</h3>
        <BalanceScene v-if="referenceWeapon" :weapon="referenceWeapon" :distance="comparison.distance" :elapsed="elapsed" :supported="referenceAssessment?.value != null" label="Official reference" />
        <p>{{ reference?.id || 'Native test needed' }}</p><p>{{ reference?.pack }}<template v-if="reference"> · {{ reference.tech }}</template></p>
        <p>Primary input: {{ format(reference?.rates.find(r => r.distance === comparison.distance && r.skill === 10 && r.reachable)?.rate) }} / sec</p>
      </Panel>
      <Panel header="Your current build" data-testid="auto-current">
        <h3>{{ weapon.gun.label || 'Your weapon' }}</h3>
        <BalanceScene :weapon="weapon" :distance="comparison.distance" :elapsed="elapsed" :supported="current.value != null" label="Current build" />
        <p>Primary input: <strong>{{ format(current.value) }}</strong> / sec</p><p>Recovery: {{ format(current.cooldown) }} sec · Aim {{ current.chance == null ? 'not estimated' : `${format(current.chance * 100)}%` }}</p>
      </Panel>
      <Panel header="Suggested adjustment" data-testid="auto-proposed">
        <h3>{{ proposal.ready ? proposal.changed ? 'Preview only' : 'Current setting matches target' : 'Native evaluation needed' }}</h3>
        <BalanceScene v-if="proposal.preview" :weapon="proposal.preview" :distance="comparison.distance" :elapsed="elapsed" :supported="proposed?.value != null" label="Proposed build" />
        <p>Primary input: <strong>{{ format(proposed?.value) }}</strong> / sec</p><p v-if="proposal.ready">Recovery: {{ format(current.cooldown) }} → {{ format(proposal.cooldown) }} sec</p>
        <p v-else>{{ proposal.reason }}</p>
      </Panel>
    </div>
    <div class="auto-actions"><Button :label="playing ? 'Stop comparison' : 'Play comparison'" :icon="playing ? 'pi pi-stop' : 'pi pi-play'" severity="secondary" :disabled="current.value == null" :aria-pressed="playing" @click="play" /><span class="auto-caption">Shooting 10 · {{ comparison.distance }} cells · clear, uncovered, unarmoured target.</span></div>
    <p class="auto-caption">RimWorld-style open lane: fixed-size game pawn and weapon assets, projectile travel and burst timing. No simulated hit rolls or impact effects are shown. The numbers use verified primary-output rules; this is not a complete RimWorld combat simulation.</p>
    <Panel v-if="proposal.ready" header="Optional power preference">
      <div class="auto-power"><label for="balance-power">Power level: {{ power }}% of the chosen reference's primary output</label><Slider id="balance-power" v-model="power" :min="75" :max="125" :step="5" aria-label="Power level" /><p class="auto-caption">100% aims for the reference across shared captured ranges. This is a tuning preference, not a total-strength score or a discovered fairness target. The slider changes the preview only.</p></div>
    </Panel>
    <Message v-if="proposal.limited" severity="warn" :closable="false">The requested output cannot be reached with recovery time alone. The preview shows the nearest supported recovery time, not a guaranteed target.</Message>
    <p v-if="proposal.ready && !proposal.changed" class="auto-caption">Recovery already matches this preview target; no adjustment is needed.</p>
    <div class="auto-actions"><Button label="Apply adjustments" icon="pi pi-check" :disabled="!props.weapon || !proposal.ready || !proposal.changed" @click="apply" /><Button label="Undo adjustment" icon="pi pi-undo" severity="secondary" :disabled="!workbench.canUndo(weapon)" @click="undo" /><Button v-if="props.weapon" label="Edit weapon" text severity="secondary" @click="emit('edit', { section: 'weapon' })" /></div>
    <p v-if="notice" role="status">{{ notice }}</p>
    <p v-if="proposal.ready" class="auto-caption">{{ proposal.reason }} Achieved primary-output ratio: {{ format(proposal.achieved) }}%. Actual game ticks can prevent an exact match.</p>
    <details><summary>Why this recommendation?</summary><div class="auto-details">
      <p>{{ comparison.cohortSize }} official definitions in the authored technology/type group. The chosen role comes from the starting template; changing the weapon radically may need native review. A single reference is an anchor, not a proven ideal.</p>
      <p v-if="comparison.shared.length">The calculation automatically checks Shooting 10 at {{ comparison.shared.map(s => s.distance).join(', ') }} cells where both weapons have a verified primary estimate. Each distance contributes one equal-duration sample; recovery is fitted to the ratio of their summed outputs.</p>
      <p>Damage and implicit armour penetration are deliberately preserved. This first automatic proposal changes recovery only; it does not claim to balance every effect, material, research gate or faction tag.</p>
      <BalancePlot v-if="points.length" :points="points" title="Automatic range checks" x-label="Distance (cells)" y-label="Primary input per second" />
      <p>Nominal crafting work: {{ format(weapon.gun.statBases.WorkToMake) }}. Fixed ingredients:</p>
      <ul><li v-for="item in ingredients" :key="item.id">{{ item.quantity }} {{ item.label }} · {{ item.min == null ? 'direct effort unknown' : `${format(item.min)}–${format(item.max)} alternative direct-step hours` }}</li></ul>
      <p>Those effort routes exclude complete supply chains and are not added together. Costs never set the reference's power. Special effects and edited melee remain unmeasured here; export is still available.</p>
    </div></details>
    <p class="auto-caption">For actual hit rolls, armour, cover, special effects and full native behavior, use the RimWorld engine test in Preview. Reference recordings cannot stand in for measurements of your edited weapon.</p>
  </div>
</template>
<style scoped>
.automatic-balance { display: grid; gap: 22px; min-width: 0; }
header h2 { font-size: 24px; font-weight: 400; margin-bottom: 10px; }
header p, .automatic-balance p { line-height: 1.7; }
.auto-match { display: grid; gap: 8px; line-height: 1.7; }
.auto-match span, .auto-caption { color: var(--p-text-muted-color); font-size: 12px; }
.auto-scenes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.auto-scenes h3 { font-size: 16px; font-weight: 500; margin-bottom: 14px; overflow-wrap: anywhere; }
.auto-scenes p { font-size: 13px; overflow-wrap: anywhere; margin-top: 10px; }
.auto-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.auto-power, .auto-details { display: grid; gap: 18px; }
.auto-power { padding: 8px; }
.auto-power label { font-size: 14px; line-height: 1.7; }
@media (max-width: 1000px) { .auto-scenes { grid-template-columns: minmax(0, 1fr); } }
</style>
