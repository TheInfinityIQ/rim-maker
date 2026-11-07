<script setup>
import { computed, provide, ref, toRef, watch } from 'vue';
import { WeaponRanged } from '@/models/weapon';
import { useDefinitionStore } from '@/stores/definitions';
import { projectileCausesExplosion, syncProjectileVerb } from '@/utility/projectileRules';
import { templateFor } from '@/utility/weaponTypes';
import { definitionByName } from '@/utility/gameDefinitions';
import { projectilePresets } from '@/utility/projectileRules';
import { usePreviewMedia, previewMediaKey } from './weapon-preview/usePreviewMedia';
import WeaponPreview from './weapon-preview/WeaponPreview.vue';
import FormDetails from './form-parts/FormDetails.vue';
import FormStatBases from './form-parts/FormStatBases.vue';
import FormStatOffset from './form-parts/FormStatOffset.vue';
import FormVerbs from './form-parts/FormVerbs.vue';
import FormTools from './form-parts/FormTools.vue';
import FormBullet from './form-parts/FormBullet.vue';
import FormCostList from './form-parts/FormCostList.vue';
import FormSkillRequirements from './form-parts/FormSkillRequirements.vue';
import FormWeaponMaterial from './form-parts/FormWeaponMaterial.vue';
import FormMeleeCombat from './form-parts/FormMeleeCombat.vue';
import FormGraphicData from './form-parts/FormGraphicData.vue';
import FormSoundField from './form-parts/FormSoundField.vue';
const props = defineProps({ weapon: { type: WeaponRanged, required: true } });
const activeSection = ref('weapon');
const definitions = useDefinitionStore();
const melee = computed(() => props.weapon.kind === 'melee');
const template = computed(() => templateFor(props.weapon));
const defaults = computed(() => template.value || { soundInteract: 'Interact_Rifle', verbProperties: [{ soundCast: 'Shot_AssaultRifle', soundCastTail: 'GunTail_Medium' }], graphicData: { texPath: 'Things/Item/Equipment/WeaponRanged/AssaultRifle' } });
const projectileDefaults = computed(() => definitionByName('bullets', projectilePresets.find(row => row.value === props.weapon.projectileKind)?.definition || template.value?.verbProperties[0]?.defaultProjectile || 'Bullet_AssaultRifle')?.graphicData);
const media = usePreviewMedia(toRef(props, 'weapon'));
provide(previewMediaKey, media);
watch(activeSection, media.stopSound);
const explosive = computed(() => projectileCausesExplosion(props.weapon));
watch(explosive, () => syncProjectileVerb(props.weapon), { immediate: true });
</script>
<template>
  <div class="editor-form">
    <p class="definition-origin" data-testid="weapon-origin">{{ weapon.isCustom ? `Custom weapon · baseline: ${template?.label}` : template ? `Based on: ${template.label} · ${template.pack}` : 'Custom ranged weapon' }}<span v-if="template"> · {{ template.defName }}</span></p>
    <Tabs v-model:value="activeSection" scrollable>
      <TabList aria-label="Weapon definition sections"><Tab value="weapon">Weapon</Tab><Tab value="attacks">Attacks</Tab><Tab v-if="!melee" value="projectile">Projectile</Tab><Tab value="crafting">Crafting</Tab><Tab value="preview">Preview</Tab></TabList>
      <TabPanels>
        <TabPanel value="weapon"><Fluid class="form-stack">
          <FormDetails :gun="weapon.gun" />
          <FormGraphicData :graphic="weapon.gun.graphicData" id="gunGraphicData" label="Weapon graphic" :defaults="defaults.graphicData" />
          <Panel header="Handling sound" toggleable><p class="form-section-help">soundInteract · Played when handling this weapon. The template's own SoundDef is used.</p><FormSoundField :owner="weapon.gun" property="soundInteract" kind="interact" label="Weapon interact sound" id="weaponInteractSound" :options="definitions.sounds" :default-value="defaults.soundInteract" /></Panel>
          <FormStatBases :stat-bases="weapon.gun.statBases" :kind="weapon.kind" />
          <FormStatOffset :equipped-stat-offsets="weapon.gun.equippedStatOffsets" :stat-list-items="definitions.stats" />
        </Fluid></TabPanel>
        <TabPanel value="attacks"><Fluid class="form-stack">
          <FormVerbs v-if="!melee" :verbs="weapon.gun.verbs" :explosive="explosive" :weapon="weapon">
            <Divider />
            <FormSoundField :owner="weapon.gun.verbs[0]" property="soundCast" kind="shot" :label="weapon.kind === 'grenade' ? 'Throwing sound' : 'Firing sound'" id="weaponGunSound" :options="definitions.sounds" :default-value="defaults.verbProperties[0]?.soundCast || ''" />
            <FormSoundField :owner="weapon.gun.verbs[0]" property="soundCastTail" kind="tail" label="Firing tail sound" id="weaponGunTailSound" :options="definitions.sounds" :default-value="defaults.verbProperties[0]?.soundCastTail || ''" />
          </FormVerbs>
          <p class="form-section-help">tools · {{ melee ? 'Primary melee attacks.' : 'Melee attacks used when this weapon is used at close quarters.' }} Each tool has capacities, power and cooldown.</p>
          <FormTools :tools="weapon.gun.tools" :tool-list-items="definitions.tools" :expanded="melee" />
        </Fluid></TabPanel>
        <TabPanel v-if="!melee" value="projectile"><Fluid class="form-stack">
          <FormBullet :weapon="weapon" :bullet="weapon.bullet" :verbs="weapon.gun.verbs" :bullet-list-items="definitions.bullets" />
          <FormGraphicData v-if="weapon.projectileMode === 'custom'" :graphic="weapon.bullet.graphicData" id="bulletGraphicData" label="Projectile graphic" :defaults="projectileDefaults" />
        </Fluid></TabPanel>
        <TabPanel value="crafting"><Fluid class="form-stack">
          <FormWeaponMaterial :gun="weapon.gun" />
          <FormCostList :cost-list="weapon.gun.costList" :cost-list-items="definitions.things" />
          <FormSkillRequirements :recipe-maker="weapon.gun.recipeMaker" :skill-list-items="definitions.skills" />
        </Fluid></TabPanel>
        <TabPanel value="preview"><Fluid class="form-stack"><FormMeleeCombat v-if="melee" :weapon="weapon" /><WeaponPreview v-else :weapon="weapon" :active="activeSection === 'preview'" /></Fluid></TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
