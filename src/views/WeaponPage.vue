<script setup>
import { reactive, ref, computed } from 'vue';
import FormRangedWeapon from '@/components/FormRangedWeapon.vue';
import exportXML from '@/utility/scripts/buildXML';
import { WeaponRanged } from '@/models/weapon';
import { Sound } from '@/models/sound';
import { getExportDisabledReason } from '@/utility/exportValidation';
import ExpansionSelector from '@/components/ExpansionSelector.vue';
import { useDefinitionStore } from '@/stores/definitions';
import { unavailableReferenceReason } from '@/utility/gameDefinitions';

const weapons = reactive([]);
const definitions = useDefinitionStore();


const sounds = reactive([]);

const newMenu = reactive({
	numNewRangedWeapon: 0,
	numNewMeleeWeapon: 0,
	numNewRangedExplosiveWeapon: 0,
	numNewGrenadeWeapon: 0,
});

async function initExport(modName) {
	sounds.splice(0);
	const fileNames = new Set();

	for (const weapon of weapons) {
		weapon.gun.defName = `${modName}_${weapon.gun.label.replace(/ /g, '')}`;

		if (
			weapon.gun.verbs[0].soundCastFile &&
			!fileNames.has(weapon.gun.verbs[0].soundCastFile.name)
		) {
			const soundDef = `${modName}Shot_${weapon.gun.defName}`;

			sounds.push(
				new Sound(
					soundDef,
					`${modName}/${weapon.gun.verbs[0].soundCastFile.name.replace(/\.[^/.]+$/, '')}`
				)
			);
			weapon.gun.verbs[0].soundCast = soundDef;
		}

		if (
			weapon.gun.verbs[0].soundCastTailFile &&
			!fileNames.has(weapon.gun.verbs[0].soundCastTailFile.name)
		) {
			const soundTailDef = `${modName}GunTail_${weapon.gun.defName}`;

			sounds.push(
				new Sound(
					soundTailDef,
					`${modName}/${weapon.gun.verbs[0].soundCastTailFile.name.replace(
						/\.[^/.]+$/,
						''
					)}`,
					true
				)
			);

			weapon.gun.verbs[0].soundCastTail = soundTailDef;
		}

		if (weapon.gun.soundInteractFile && !fileNames.has(weapon.gun.soundInteractFile.name)) {
			const soundInteractDef = `${modName}Interact_${weapon.gun.defName}`;

			sounds.push(
				new Sound(
					soundInteractDef,
					`${modName}/${weapon.gun.soundInteractFile.name.replace(/\.[^/.]+$/, '')}`
				)
			);

			weapon.gun.soundInteract = soundInteractDef;
		}
	}

	await exportXML(weapons, sounds, modName);
}

const isSelectItemOpen = ref(false);
const selectedIndex = ref(0);
const selectedWeapon = computed(() => weapons[selectedIndex.value]);
const modName = ref('TestMod');
const exporting = ref(false);
const exportError = ref('');
const removePrompt = ref(false);
const weaponIds = new WeakMap();
let nextWeaponId = 0;
function weaponKey(weapon) {
  if (!weaponIds.has(weapon)) weaponIds.set(weapon, ++nextWeaponId);
  return weaponIds.get(weapon);
}
const validModName = computed(() => /^[A-Za-z][A-Za-z0-9_]*$/.test(modName.value));
const referenceError = computed(() => unavailableReferenceReason(weapons, definitions.enabledPacks));
const exportDisabledReason = computed(() => [getExportDisabledReason(weapons, modName.value, exporting.value), referenceError.value].filter(Boolean).join(' '));
const canExport = computed(() => !exportDisabledReason.value);

function openAddWeapons() {
  newMenu.numNewRangedWeapon = 1;
  isSelectItemOpen.value = true;
}
function createNewItems() {
  const firstNewIndex = weapons.length;
  const count = Math.max(1, Math.min(10, Math.floor(Number(newMenu.numNewRangedWeapon) || 1)));
  for (let index = 0; index < count; index++) weapons.push(new WeaponRanged());
  selectedIndex.value = firstNewIndex;
  isSelectItemOpen.value = false;
}
function removeSelectedWeapon() {
  weapons.splice(selectedIndex.value, 1);
  selectedIndex.value = Math.max(0, Math.min(selectedIndex.value, weapons.length - 1));
  removePrompt.value = false;
}
async function handleExport() {
  if (!canExport.value || exporting.value) return;
  exporting.value = true;
  exportError.value = '';
  try { await initExport(modName.value); }
  catch { exportError.value = 'The mod could not be exported. Please check your files and try again.'; }
  finally { exporting.value = false; }
}
</script>

<template>
  <section class="workbench" aria-labelledby="workbench-title">
    <header class="workbench-heading">
      <div><p class="eyebrow">MOD WORKBENCH</p><h1 id="workbench-title">Your armory</h1></div>
      <span
        class="export-trigger"
        v-tooltip.bottom="{ value: exportDisabledReason, disabled: canExport }"
        :tabindex="canExport ? undefined : 0"
        :aria-label="canExport ? undefined : 'Export unavailable. ' + exportDisabledReason"
      >
        <Button label="Export mod" icon="pi pi-box" :disabled="!canExport" :loading="exporting" @click="handleExport" />
      </span>
    </header>
    <Message v-if="exportError" severity="error" :closable="false">{{ exportError }}</Message>
    <Message v-if="referenceError" severity="warn" :closable="false">{{ referenceError }}</Message>
    <div class="workbench-grid">
      <aside class="weapon-sidebar" aria-label="Mod weapons">
        <ExpansionSelector />
        <div class="sidebar-title"><span class="eyebrow">WEAPONS</span><Badge :value="weapons.length" severity="secondary" /></div>
        <div class="weapon-list">
          <Button v-for="(weapon, index) in weapons" :key="weaponKey(weapon)" severity="secondary" :outlined="index !== selectedIndex" :aria-pressed="index === selectedIndex" @click="selectedIndex = index">
            <span class="weapon-choice"><i class="pi pi-bullseye" aria-hidden="true" /><span>{{ weapon.gun.label || 'Weapon ' + (index + 1) }}<small>Ranged weapon</small></span></span>
          </Button>
        </div>
        <Button label="Add weapons" icon="pi pi-plus" severity="secondary" fluid @click="openAddWeapons" />
        <div class="sidebar-settings">
          <label for="mod-name">Mod folder name</label>
          <InputText id="mod-name" v-model="modName" fluid :invalid="!validModName" aria-describedby="mod-name-help" />
          <small id="mod-name-help">Start with a letter. Use letters, numbers, and underscores.</small>
        </div>
        <p class="sidebar-note">Edit your weapons, then export them together as a mod ZIP. Give every weapon a name to enable export.</p>
      </aside>
      <div class="weapon-editor">
        <Panel v-if="selectedWeapon">
          <template #header>
            <div class="editor-header">
              <div><p class="eyebrow">RANGED WEAPON</p><h2>{{ selectedWeapon.gun.label || 'Weapon ' + (selectedIndex + 1) }}</h2></div>
              <Button label="Delete" icon="pi pi-trash" severity="danger" text size="small" @click="removePrompt = true" />
            </div>
          </template>
          <KeepAlive><FormRangedWeapon :key="weaponKey(selectedWeapon)" :weapon="selectedWeapon" /></KeepAlive>
        </Panel>
        <Panel v-else>
          <div class="empty-workbench">
            <i class="pi pi-bullseye" aria-hidden="true" /><p class="eyebrow">AN IDEA IS ALL IT TAKES</p>
            <h2>Make your first weapon.</h2>
            <p>Add a ranged weapon to start shaping its stats, crafting requirements, textures, and sounds.</p>
            <Button label="Add your first weapon" icon="pi pi-plus" @click="openAddWeapons" />
          </div>
        </Panel>
        <p class="editor-note">Your work stays in this tab while you browse. Export before refreshing or closing the page.</p>
      </div>
    </div>
    <Dialog v-model:visible="isSelectItemOpen" modal header="Add weapons" class="add-weapons-dialog">
      <p class="form-section-help">Add up to ten ranged weapons at a time. Each one can have its own stats, textures, and sounds.</p>
      <div class="dialog-field"><label for="ranged-weapon-count">Number of ranged weapons</label><InputNumber v-model="newMenu.numNewRangedWeapon" inputId="ranged-weapon-count" :min="1" :max="10" showButtons fluid /></div>
      <Divider />
      <div class="coming-soon"><div v-for="kind in ['Melee weapons', 'Grenades', 'Explosive ranged weapons']" :key="kind"><span>{{ kind }}</span><Tag severity="secondary" value="In development" /></div></div>
      <template #footer><Button label="Cancel" severity="secondary" text @click="isSelectItemOpen = false" /><Button label="Add weapons" icon="pi pi-plus" @click="createNewItems" /></template>
    </Dialog>
    <Dialog v-model:visible="removePrompt" modal header="Delete weapon?" class="add-weapons-dialog">
      <p>This removes {{ selectedWeapon?.gun.label || 'this weapon' }} from your current mod.</p>
      <template #footer><Button label="Cancel" severity="secondary" text @click="removePrompt = false" /><Button label="Delete weapon" severity="danger" @click="removeSelectedWeapon" /></template>
    </Dialog>
  </section>
</template>
