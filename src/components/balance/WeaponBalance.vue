<script setup>
import { computed, getCurrentInstance, ref, watch } from 'vue';
import BalancePlot from './BalancePlot.vue';
import { balanceCatalog, technologyLevels, balanceSkills, balanceDistances, technologyFor, referenceFor, selectPeers,
  referenceOutput, assessDraft, summarizePeers, comparisonExplanation, ingredientEffort, readableRole } from '@/utility/weaponBalance';
const props = defineProps({ weapon: Object });
const emit = defineEmits(['edit']);
const uid = `balance-${getCurrentInstance().uid}`;
const technology = ref(props.weapon ? technologyFor(props.weapon) : 'Industrial');
const kind = ref(props.weapon?.kind === 'melee' ? 'melee' : 'ranged');
const role = ref('all'), distance = ref(12), skill = ref(10), explanationOpen = ref(false), selectedId = ref(null);
const search = ref(''), sort = ref('name');
watch(() => props.weapon?.gun.techLevel, () => { if (props.weapon) technology.value = technologyFor(props.weapon); });
watch([technology, kind], () => { role.value = 'all'; selectedId.value = null; search.value = ''; });
watch(role, () => { selectedId.value = null; });
const basePeers = computed(() => selectPeers(technology.value, kind.value));
const roles = computed(() => [{ id: 'all', label: 'All roles in this bracket' }, ...[...new Set(basePeers.value.map(r => r.role))].map(id => ({ id, label: readableRole(id) }))]);
const peers = computed(() => selectPeers(technology.value, kind.value, role.value === 'all' ? '' : role.value).map(row => ({ ...row, output: referenceOutput(row, distance.value, skill.value) })));
const roster = computed(() => peers.value.filter(r => `${r.label} ${r.id} ${r.pack}`.toLowerCase().includes(search.value.toLowerCase())).sort((a, b) => {
  if (sort.value === 'output') return (b.output.value ?? -Infinity) - (a.output.value ?? -Infinity) || a.label.localeCompare(b.label);
  if (sort.value === 'work') return (a.work ?? Infinity) - (b.work ?? Infinity) || a.label.localeCompare(b.label);
  return a.label.localeCompare(b.label);
}));
const summary = computed(() => summarizePeers(peers.value.map(row => row.output.value)));
const draft = computed(() => props.weapon ? assessDraft(props.weapon, distance.value, skill.value) : null);
const ingredients = computed(() => props.weapon ? ingredientEffort(props.weapon.gun.costList) : []);
const selected = computed(() => balanceCatalog.items.find(row => row.id === selectedId.value));
const points = computed(() => {
  const rows = peers.value.filter(r => r.output.value != null).map(r => ({ id: r.id, label: r.label, y: r.output.value, range: kind.value === 'melee' ? r.penetration : r.range, work: r.work }));
  if (draft.value?.value != null) rows.push({ id: 'draft', label: props.weapon.gun.label || 'Your draft', y: draft.value.value, range: draft.value.range, work: draft.value.work, draft: true });
  return rows;
});
const reachPoints = computed(() => points.value.filter(r => r.range != null).map(r => ({ ...r, x: r.range })));
const workPoints = computed(() => points.value.filter(r => r.work != null).map(r => ({ ...r, x: r.work })));
const outputLabel = computed(() => kind.value === 'melee' ? 'Native average-primary DPS · excludes hit/dodge and armour' : 'Aim-weighted primary input / second · not final injury DPS');
const format = value => value == null ? 'Not measured' : new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
function inspect(id) { if (id === 'draft') explanationOpen.value = true; else selectedId.value = id; }
function edit(section, id) { explanationOpen.value = false; emit('edit', { section, id }); }
const effectNames = {
  'primary.peakInjury': 'Peak injury severity', 'primary.stunnedTicks': 'Observed stun (ticks)',
  'primary.staggeredTicks': 'Observed stagger (ticks)', 'primary.peakTox': 'Peak toxic buildup',
  'primary.burningTicks': 'Burning (ticks)', 'primary.minimumShield': 'Minimum shield energy', 'primary.deaths': 'Deaths (mean per trial)',
};
</script>
<template>
  <div class="balance-adviser" data-testid="balance-adviser">
    <div class="balance-intro"><h2>{{ weapon ? 'Compare your weapon' : 'Official weapon balance library' }}</h2>
      <p>Start with technology, then role and a shared scenario. Compare trade-offs rather than a single power score.</p></div>
    <div class="balance-filters">
      <div class="editor-field"><label :for="`${uid}-tech`">Compare with technology</label><Select :input-id="`${uid}-tech`" aria-label="Compare with technology" v-model="technology" :options="technologyLevels" fluid /></div>
      <div v-if="!weapon" class="editor-field"><label :for="`${uid}-group`">Weapon group</label><Select :input-id="`${uid}-group`" aria-label="Balance weapon group" v-model="kind" :options="[{ id: 'ranged', label: 'Ranged & grenades' }, { id: 'melee', label: 'Melee' }]" option-label="label" option-value="id" fluid /></div>
      <div class="editor-field"><label :for="`${uid}-role`">Role comparison</label><Select :input-id="`${uid}-role`" aria-label="Role comparison" v-model="role" :options="roles" option-label="label" option-value="id" fluid /></div>
      <template v-if="kind !== 'melee'">
        <div class="editor-field"><label :for="`${uid}-distance`">Distance (cells)</label><Select :input-id="`${uid}-distance`" aria-label="Balance distance" v-model="distance" :options="balanceDistances" fluid /></div>
        <div class="editor-field"><label :for="`${uid}-skill`">Shooting skill</label><Select :input-id="`${uid}-skill`" aria-label="Balance shooting skill" v-model="skill" :options="balanceSkills" fluid /></div>
      </template>
    </div>
    <p class="balance-caption">{{ kind === 'melee' ? 'Reference native melee averages; no pawn hit/dodge model.' : 'Standing, clear, uncovered, unarmoured target. Reference quality: Normal (where applicable); native default stuff.' }} All official DLCs are included as references; browsing never enables DLC dependencies.</p>
    <Message severity="secondary" :closable="false" data-testid="balance-coverage">{{ peers.length }} definitions in this selection · {{ summary.n }} comparable outputs · {{ peers.length - summary.n }} unmeasured or out of range. Library total: 67 weapons (40 ranged, 4 grenades, 23 melee).</Message>
    <Message v-if="summary.n < 5" severity="warn" :closable="false">{{ summary.n ? 'Small comparison group: no reliable balance band can be inferred.' : 'No comparable outputs in this selection. The complete reference roster remains available below.' }}</Message>
    <Panel v-if="weapon" header="Your current draft">
      <div class="balance-summary" aria-live="polite" data-testid="draft-assessment" :data-output="draft.value">
        <strong>{{ draft.value == null ? 'Output not estimated' : `${format(draft.value)} primary input / second` }}</strong>
        <span v-if="draft.value == null">{{ draft.reason }}</span>
        <span v-else>{{ format(draft.chance * 100) }}% aim · {{ format(draft.damage) }} damage × {{ draft.burst }} shots · {{ format(draft.cycle) }} second nominal cycle.</span>
        <span>Authored technology: {{ technologyFor(weapon) }}. Comparing with {{ technology }} does not change the exported weapon.</span>
        <span v-if="summary.n">Observed peer median {{ format(summary.median) }}; range {{ format(summary.min) }}–{{ format(summary.max) }}. These are observations, not targets.</span>
        <Button label="Explain balance" icon="pi pi-info-circle" severity="secondary" :fluid="false" @click="explanationOpen = true" />
      </div>
      <p v-if="referenceFor(weapon)?.notes.length" class="balance-caption">The starting template also has special behavior. This primary estimate does not measure those effects.</p>
    </Panel>
    <div class="balance-charts">
      <BalancePlot :points="points" title="Primary output among peers" :y-label="outputLabel" bars @inspect="inspect" />
      <BalancePlot :points="reachPoints" :title="kind === 'melee' ? 'Penetration and output' : 'Reach and output'" :x-label="kind === 'melee' ? 'Armour penetration (fraction)' : 'Range (cells)'" :y-label="outputLabel" @inspect="inspect" />
      <BalancePlot :points="workPoints" title="Crafting workload and output" x-label="Nominal crafting work" :y-label="outputLabel" @inspect="inspect" />
    </div>
    <p class="balance-caption">Crafting work excludes resource acquisition, bench speed, hauling and research. A longer-range or specialist weapon need not match a close-range weapon's output. Neither chart determines the correct technology tier by itself.</p>
    <Panel header="Every reference in this selection">
      <div class="balance-filters">
        <div class="editor-field"><label :for="`${uid}-search`">Find a reference</label><InputText :id="`${uid}-search`" v-model="search" placeholder="Name, definition or DLC" fluid /></div>
        <div class="editor-field"><label :for="`${uid}-sort`">Sort references</label><Select :input-id="`${uid}-sort`" v-model="sort" :options="[{ id: 'name', label: 'Weapon name' }, { id: 'output', label: 'Highest measured output' }, { id: 'work', label: 'Lowest crafting work' }]" option-label="label" option-value="id" fluid /></div>
      </div>
      <p class="balance-caption">Showing {{ roster.length }} of {{ peers.length }} references. This search changes the roster only; graphs retain the full selected cohort.</p>
      <DataView :value="roster" data-key="id" paginator :rows="10" :rows-per-page-options="[10, 25, 50]" aria-label="Official balance references">
        <template #empty>No official weapons match this bracket and role.</template>
        <template #list="{ items }"><div class="balance-roster"><article v-for="row in items" :key="row.id">
          <div><Button :label="row.label" :data-reference-id="row.id" text severity="secondary" @click="inspect(row.id)" /><small class="balance-row-note">{{ row.pack }} · {{ readableRole(row.role) }}</small></div>
          <dl><div><dt>Primary output</dt><dd>{{ row.output.value == null ? row.output.reason : format(row.output.value) }}</dd></div><div><dt>Crafting work</dt><dd>{{ row.work == null ? 'No direct work reference' : format(row.work) }}</dd></div></dl>
        </article></div></template>
      </DataView>
    </Panel>
    <Panel v-if="selected" :header="`Reference: ${selected.label}`" data-testid="balance-reference-detail">
      <dl class="balance-facts"><div><dt>Native definition</dt><dd>{{ selected.id }} · {{ selected.pack }}</dd></div><div><dt>Technology / role</dt><dd>{{ selected.tech }} · {{ readableRole(selected.role) }}</dd></div><div><dt>Reference configuration</dt><dd>{{ selected.quality }} quality · {{ selected.stuff || 'no stuff' }}</dd></div><div><dt>Range / penetration</dt><dd>{{ format(selected.range) }} cells · AP {{ format(selected.penetration) }}</dd></div><div><dt>Research roots</dt><dd>{{ selected.research.join(', ') || 'No direct recipe research root recorded' }}</dd></div><div><dt>NPC weapon tags</dt><dd>{{ selected.tags?.join(', ') || 'None recorded' }}</dd></div><div><dt>Fixed ingredients</dt><dd>{{ selected.ingredients.map(i => `${i.count} ${i.id}`).join(', ') || 'None; inspect stuff / alternative acquisition' }}</dd></div></dl>
      <ul v-if="selected.notes.length"><li v-for="note in selected.notes" :key="note">{{ note }}</li></ul>
      <div v-for="effect in selected.effects" :key="effect.profile + effect.protocol" class="balance-effect">
        <h3>{{ effect.profile }} target · {{ effect.seeds }} seeds</h3>
        <p class="balance-caption">{{ effect.protocol }} · {{ effect.horizon?.join(', ') || 'protocol-specific' }} observation ticks. Reference-only stationary trials; injury is not uncapped damage. EMP exposure may be cut off by the observation window.</p>
        <dl class="balance-facts"><div v-for="(value, metric) in effect.outcomes" :key="metric"><dt>{{ effectNames[metric] }}</dt><dd>{{ format(value) }}</dd></div></dl>
      </div>
      <p v-if="!selected.effects.length" class="balance-caption">No dedicated effect trial for this definition in this extract. Missing utility is not zero utility.</p>
    </Panel>
    <Panel v-if="weapon" header="Materials and production effort" toggleable>
      <p class="form-section-help">These are alternative direct-step effort routes for each fixed ingredient quantity, in game working hours (2,500 ticks). They exclude complete supply chains, upkeep, transport and scarcity. Recipe references and observed mining/harvest jobs are different protocols. Do not add alternative routes together.</p>
      <p v-if="weapon.gun.stuffCategories?.length" class="form-section-help">Variable stuff also requires {{ weapon.gun.costStuffCount }} material units. Select and test the actual material in game; it is not included in the fixed list below.</p>
      <p v-if="!ingredients.length">No fixed ingredients. This does not mean the weapon is free to obtain.</p>
      <details v-for="item in ingredients" :key="item.id" class="balance-resource">
        <summary>{{ item.quantity ?? 'Invalid quantity' }} {{ item.label }} · {{ item.min == null ? 'effort unknown' : `${format(item.min)}–${format(item.max)} direct-step hours` }}</summary>
        <ul v-if="item.routes.length"><li v-for="route in item.routes" :key="route.source + route.kind">{{ route.source }} · {{ route.kind }} · {{ format(route.hours) }} hours for this quantity</li></ul>
        <p v-else>No numeric direct-effort route for this item/quantity. Unknown is not zero.</p>
      </details>
      <p class="balance-caption">Fixed recipe quantities do not directly increase ordinary weapon damage. Choosing stuff or consuming ammunition is a separate mechanic.</p>
    </Panel>
    <Panel header="Special effects: measured rules and limits" toggleable collapsed>
      <ul class="balance-rule-list"><li>Fresh scyther EMP controls: 25/50/100 EMP amount gave 750/1,500/3,000 stun ticks. A repeat at tick 100 did not refresh adapted stun. Shield controls broke the shield without ordinary human injury.</li><li>Nerve controls: surviving adult humans had 90/120/150/180 stun ticks at Awful/Normal/Masterwork/Legendary. Damage 1/15/30 did not change stun within a profile. Body size and target type matter.</li><li>One valid rifle shoot line crossing smoke applied one 0.7 aim factor; more smoke cells did not stack it. This is not minus 30 percentage points.</li><li>Stopping power can cross a body-size threshold for stagger. Beam shield bypass, fire, gas, area coverage and charged abilities need separate outcomes, not an invented damage bonus.</li></ul>
    </Panel>
    <div class="balance-caption">Evidence: installed game {{ balanceCatalog.gameVersion }}, Core + five official expansions. Native numerical research; no game DLLs or source bodies are shipped. <details><summary>Assembly fingerprint and limitations</summary><p class="balance-fingerprint">{{ balanceCatalog.assemblySha256 }}</p><p>Nominal primary rates are not full combat simulations. Generated traits, stuff, armour, cover, weather, moving targets and utility can alter comparisons. Version.txt reports rev590 while startup reported rev591 with the same assembly hash. No single fairness threshold or automatic adjustment is inferred.</p></details></div>
    <Dialog v-model:visible="explanationOpen" modal header="Why this comparison?" class="balance-dialog">
      <template v-if="weapon">
        <p>{{ comparisonExplanation(draft, summary) }}</p>
        <p>Change fields manually, then return to Balance. Nothing here edits your weapon automatically.</p>
        <div v-if="kind !== 'melee'" class="balance-edit-actions">
          <p>Higher damage, accuracy or burst can raise primary output. Damage may also raise implicit armour penetration. A shorter warmup or cooldown raises output; longer times lower it.</p>
          <Button label="Edit projectile settings" severity="secondary" @click="edit('projectile', 'bulletProjectileDamageAmountBase')" />
          <Button label="Edit range and burst" severity="secondary" @click="edit('attacks', 'weaponRange')" />
          <Button label="Edit accuracy" severity="secondary" @click="edit('weapon', 'accuracyShort')" />
          <Button label="Edit cooldown" severity="secondary" @click="edit('weapon', 'rangedCooldown')" />
        </div>
        <Button v-else label="Edit melee tools" severity="secondary" @click="edit('attacks')" />
        <p>Work and ingredients describe production burden. Research, skill requirements and NPC tags describe access. Raising these does not reduce combat output.</p>
        <div class="balance-edit-actions"><Button label="Edit crafting work" severity="secondary" @click="edit('weapon', 'workToMake')" /><Button label="Edit ingredients and research" severity="secondary" @click="edit('crafting')" /><Button label="Edit technology level" severity="secondary" @click="edit('weapon', 'weaponTechLevel')" /></div>
      </template>
    </Dialog>
  </div>
</template>
<style scoped>
.balance-adviser { display: grid; gap: 22px; min-width: 0; }
.balance-intro h2 { font-size: 22px; font-weight: 400; margin-bottom: 10px; }
.balance-intro p, .balance-dialog p { line-height: 1.7; }
.balance-filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(190px, 100%), 1fr)); gap: 14px; }
.balance-filters .editor-field { margin: 0; }
.balance-filters label { font-size: 13px; }
.balance-caption, .balance-row-note { color: var(--p-text-muted-color); font-size: 12px; line-height: 1.7; }
.balance-row-note { display: block; }
.balance-summary { display: grid; justify-items: start; gap: 12px; line-height: 1.7; }
.balance-charts { display: grid; gap: 28px; min-width: 0; }
.balance-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap: 16px; margin-block: 12px; }
.balance-facts dt { color: var(--p-text-muted-color); font-size: 12px; margin-bottom: 5px; }
.balance-facts dd { margin: 0; font-size: 13px; overflow-wrap: anywhere; line-height: 1.7; }
.balance-effect { border-top: 1px solid var(--p-content-border-color); padding-top: 16px; margin-top: 16px; }
.balance-effect h3 { font-size: 15px; font-weight: 500; }
.balance-resource { margin-block: 16px; line-height: 1.7; overflow-wrap: anywhere; }
.balance-fingerprint { overflow-wrap: anywhere; }
.balance-rule-list { padding-left: 20px; line-height: 1.8; }
.balance-rule-list li + li { margin-top: 12px; }
.balance-edit-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-block: 18px; }
:global(.balance-dialog) { width: min(660px, calc(100vw - 32px)); }
:global(.balance-dialog p) { line-height: 1.7; margin-bottom: 14px; }
.balance-roster article { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 2fr); gap: 16px; padding-block: 16px; border-bottom: 1px solid var(--p-content-border-color); }
.balance-roster dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; font-size: 13px; line-height: 1.7; }
.balance-roster dt { color: var(--p-text-muted-color); font-size: 12px; }
.balance-roster dd { margin: 4px 0 0; overflow-wrap: anywhere; }
.balance-roster :deep(.p-button-label) { white-space: normal; text-align: left; }
@media (max-width: 640px) { .balance-roster article { grid-template-columns: minmax(0, 1fr); } }
</style>
