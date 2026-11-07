<script setup>
import { computed } from 'vue';
import { WeaponRangedBullet } from '@/models/projectile';
import { WeaponRanged } from '@/models/weapon';
import { applyProjectilePreset, projectilePresets } from '@/utility/projectileRules';
import { definitionByName } from '@/utility/gameDefinitions';
import { templateFor } from '@/utility/weaponTypes';

const props = defineProps({
  weapon: { required: true, type: WeaponRanged },
  verbs: { required: true, type: Array },
  bullet: { required: true, type: WeaponRangedBullet },
  bulletListItems: { required: true, type: Array },
});
const modes = [{ label: 'Create new projectile', value: 'custom' }, { label: 'Use existing projectile', value: 'existing' }];
const selected = computed(() => definitionByName('bullets', props.verbs[0].defaultProjectile));
const availablePresets = computed(() => projectilePresets.filter(preset => props.bulletListItems.some(bullet => bullet.defName === preset.definition)));
function restoreTemplate() {
  const id = templateFor(props.weapon)?.verbProperties[0]?.defaultProjectile;
  const source = definitionByName('bullets', id); if (!source) return;
  props.weapon.projectileMode = 'custom'; props.weapon.projectileKind = 'template';
  props.bullet.thingClass = source.thingClass; props.bullet.projectile = structuredClone(source.projectile); props.bullet.graphicData = { ...structuredClone(source.graphicData), textureFile: null };
}
const isExplosive = computed(() => props.bullet.thingClass === 'Projectile_Explosive');
function optionLabel(option) { return `${option.label} · ${option.pack} · ${option.behavior}`; }
</script>

<template>
  <Panel class="panel" toggleable header="Projectile definition">
    <p class="form-section-help">A separate ThingDef, with its own graphicData and projectile properties. {{ weapon.projectileMode === 'existing' ? 'An existing game definition is referenced without editing it.' : 'A custom definition is exported with this weapon.' }}</p>
    <p class="form-section-help">The projectile is what travels from the weapon and applies the impact. Its class controls special behavior such as explosions; changing damage alone does not turn a normal bullet into a grenade. Use an existing projectile to keep its game behavior, or create a new one to edit the supported properties.</p>
    <div class="projectile-mode"><SelectButton v-model="weapon.projectileMode" :options="modes" optionLabel="label" optionValue="value" :allowEmpty="false" aria-label="Projectile source" /></div>
    <div v-if="weapon.projectileMode === 'existing'" class="projectile-fields">
      <label for="existing-projectile">Game projectile</label>
      <Select inputId="existing-projectile" v-model="props.verbs[0].defaultProjectile" :options="bulletListItems" :optionLabel="optionLabel" optionValue="defName" filter reset-filter-on-hide :filterFields="['label', 'defName', 'pack', 'behavior']" placeholder="Choose a projectile" fluid />
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
      <Select inputId="projectile-kind" aria-label="Projectile behavior" :modelValue="weapon.projectileKind" @update:modelValue="$event === 'template' ? restoreTemplate() : applyProjectilePreset(weapon, $event)" :options="[{ value: 'template', label: 'Weapon template projectile' }, ...availablePresets]" optionLabel="label" optionValue="value" fluid />
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
      <p class="form-section-help">Damage is the base amount before the target's defenses and the damage type's rules. Speed controls travel, not attack frequency. Armour penetration affects armour checks rather than accuracy; 0.2 represents 20% penetration. Blank optional values use game defaults. Special damage types can have effects instead of ordinary health damage.</p>
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
