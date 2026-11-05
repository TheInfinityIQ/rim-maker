<script setup>
import { computed } from 'vue';
import { WeaponRangedBullet } from '@/models/projectile';
import { WeaponRanged } from '@/models/weapon';
import { applyProjectilePreset, projectilePresets } from '@/utility/projectileRules';
import { definitionByName } from '@/utility/gameDefinitions';

const props = defineProps({
  weapon: { required: true, type: WeaponRanged },
  verbs: { required: true, type: Array },
  bullet: { required: true, type: WeaponRangedBullet },
  bulletListItems: { required: true, type: Array },
});
const modes = [{ label: 'Create new projectile', value: 'custom' }, { label: 'Use existing projectile', value: 'existing' }];
const selected = computed(() => definitionByName('bullets', props.verbs[0].defaultProjectile));
const isExplosive = computed(() => props.bullet.thingClass === 'Projectile_Explosive');
function optionLabel(option) { return `${option.label} · ${option.pack} · ${option.behavior}`; }
</script>

<template>
  <Panel class="panel" toggleable header="Bullet" collapsed>
    <div class="projectile-mode"><SelectButton v-model="weapon.projectileMode" :options="modes" optionLabel="label" optionValue="value" :allowEmpty="false" aria-label="Projectile source" /></div>
    <div v-if="weapon.projectileMode === 'existing'" class="projectile-fields">
      <label for="existing-projectile">Game projectile</label>
      <Select inputId="existing-projectile" v-model="props.verbs[0].defaultProjectile" :options="bulletListItems" :optionLabel="optionLabel" optionValue="defName" filter :filterFields="['label', 'defName', 'pack', 'behavior']" placeholder="Choose a projectile" fluid />
      <Message v-if="selected" severity="secondary" :closable="false">
        <strong>{{ selected.behavior }}</strong> · {{ selected.thingClass }}<br />
        {{ selected.defName }}<br />
        <span v-if="selected.projectile.damageDef">Damage: {{ selected.projectile.damageDef }}. </span>
        <span v-if="selected.projectile.explosionRadius">Explosion radius: {{ selected.projectile.explosionRadius }} tiles. </span>
        The original game definition supplies its behavior and effects.
      </Message>
    </div>
    <div v-else class="projectile-fields">
      <label for="projectile-kind">Projectile behavior</label>
      <Select inputId="projectile-kind" aria-label="Projectile behavior" :modelValue="weapon.projectileKind" @update:modelValue="applyProjectilePreset(weapon, $event)" :options="projectilePresets" optionLabel="label" optionValue="value" fluid />
      <p class="form-section-help">Changing behavior loads a game-derived starting profile, including its effects and default texture. Rename and tune it below.</p>
      <Message severity="secondary" :closable="false">{{ isExplosive ? 'Area explosion' : 'Direct impact' }} · {{ bullet.thingClass }} · {{ bullet.projectile.damageDef }} damage</Message>
      <div>
        <label for="bulletLabel">Projectile Name</label>
        <InputText id="bulletLabel" v-model="bullet.label" placeholder="Uses the weapon name if left empty" fluid />
      </div>
      <div class="projectile-number-grid">
        <div><label for="bulletProjectileDamageAmountBase">Bullet Damage</label><InputNumber inputId="bulletProjectileDamageAmountBase" v-model="bullet.projectile.damageAmountBase" :min="0" placeholder="Game default" fluid /></div>
        <div><label for="bulletProjectileSpeed">Projectile Speed</label><InputNumber inputId="bulletProjectileSpeed" v-model="bullet.projectile.speed" :min="0.1" :maxFractionDigits="2" fluid /></div>
        <div v-if="!isExplosive"><label for="bulletProjectileStoppingPower">Stopping Power</label><InputNumber inputId="bulletProjectileStoppingPower" v-model="bullet.projectile.stoppingPower" :min="0" :maxFractionDigits="2" placeholder="Game default" fluid /></div>
        <div><label for="bulletProjectileArmorPenetration">Armor Penetration</label><InputNumber inputId="bulletProjectileArmorPenetration" v-model="bullet.projectile.armorPenetrationBase" :min="0" :maxFractionDigits="3" placeholder="Game default" fluid /></div>
      </div>
      <template v-if="isExplosive">
        <Divider />
        <div class="projectile-number-grid">
          <div><label for="bulletExplosionRadius">Explosion Radius (tiles)</label><InputNumber inputId="bulletExplosionRadius" v-model="bullet.projectile.explosionRadius" :min="0.1" :maxFractionDigits="2" fluid /></div>
          <div><label for="bulletExplosionDelay">Explosion delay (ticks)</label><InputNumber inputId="bulletExplosionDelay" v-model="bullet.projectile.explosionDelay" :min="0" placeholder="0 = on impact" fluid /></div>
          <div><label for="bulletFireChance">Chance to start fire (0–1)</label><InputNumber inputId="bulletFireChance" v-model="bullet.projectile.explosionChanceToStartFire" :min="0" :max="1" :maxFractionDigits="3" placeholder="0" fluid /></div>
          <div v-if="'preExplosionSpawnChance' in bullet.projectile"><label for="bulletFuelChance">Fuel spawn chance (0–1)</label><InputNumber inputId="bulletFuelChance" v-model="bullet.projectile.preExplosionSpawnChance" :min="0" :max="1" :maxFractionDigits="3" fluid /></div>
        </div>
        <div class="projectile-switch"><ToggleSwitch v-model="bullet.projectile.flyOverhead" inputId="projectile-overhead" /><label for="projectile-overhead">Fly overhead (mortar-style flight)</label></div>
        <p v-if="bullet.projectile.preExplosionSpawnThingDef" class="form-section-help">Before the explosion: {{ bullet.projectile.preExplosionSpawnThingDef }}.</p>
        <p v-if="bullet.projectile.postExplosionGasType" class="form-section-help">Explosion gas: {{ bullet.projectile.postExplosionGasType }}.</p>
        <p v-if="bullet.projectile.postExplosionSpawnThingDef" class="form-section-help">After the explosion: {{ bullet.projectile.postExplosionSpawnThingDef }}.</p>
      </template>
      <p class="form-section-help">For liquid sprays, spawning projectiles, fire arrows, doomsday rockets, and other specialized classes, use an existing game projectile to preserve its special rules.</p>
    </div>
  </Panel>
</template>
