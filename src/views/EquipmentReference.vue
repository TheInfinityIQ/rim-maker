<script setup>
import { computed, ref } from 'vue';
import catalog from '@/utility/data/equipmentCatalog.json';
import { weaponTemplates } from '@/utility/weaponTypes';
const tab = ref('weapons'), search = ref('');
const records = computed(() => (tab.value === 'apparel' ? catalog.apparel : catalog.weapons).filter(row => `${row.label} ${row.defName} ${row.pack} ${row.verbs.join(' ')}`.toLowerCase().includes(search.value.toLowerCase())));
const supported = new Set(weaponTemplates.map(row => row.defName));
const families = [
  ['Projectile weapons', 'Bows, pila, pistols, shotguns, rifles, SMGs, machine guns, charge weapons and projectile-based energy weapons.', 'Verb_Shoot and a projectile definition. Current ranged editor.'],
  ['Explosive and utility launchers', 'Rockets, incendiary/inferno shells, EMP, smoke, firefoam, tox and specialised projectiles.', 'Projectile classes and effects matter; use the appropriate profile or existing projectile.'],
  ['Thrown grenades', 'Frag, molotov, EMP, and Biotech tox grenades.', 'Implemented: throwing verb, scatter, arc, impact/fuse effects and machining recipe. Vanilla equipped grenades are reusable weapons, not finite inventory stacks.'],
  ['Melee and improvised weapons', 'Blades, blunt weapons, spears, axes, breach axes, horns, tusks, logs and beer bottles.', 'Implemented: seven ordinary templates, tool capacities, damage, cooldown and variable materials.'],
  ['Special melee weapons', 'Monoswords, zeushammers, plasmaswords, persona/bladelink weapons and psyfocus staffs.', 'Inventoried; their extra damage, comps, bonding and abilities need dedicated controls.'],
  ['One-use weapons', 'Triple and doomsday rocket launchers.', 'Verb_ShootOneUse and item consumption need a separate editor; changing only the projectile does not implement them.'],
  ['Beams, sprays and continuous fire', 'Graser beams, mini flameblasters, incinerators and firefoam sprays.', 'Verb_ShootBeam, Verb_SpewFire, Verb_ArcSprayIncinerator and Verb_ArcSprayProjectile. Dedicated behavior is not editable yet.'],
  ['Turrets and artillery', 'Manned/automatic turrets, autocannons, mortars and rocketswarm launchers.', 'Building plus linked gun, ammunition, power/fuel, targeting and reload systems. Inventoried separately from handheld weapons.'],
  ['Other combat systems', 'Unique/legendary weapon traits, mech-only weapons, worn launchers, shield belts, offensive implants, natural attacks, psycasts and other abilities.', 'Some are equipment; others belong to Apparel, HediffDef, RaceProperties/tools or AbilityDef. They are not interchangeable with a gun ThingDef.'],
];
</script>
<template>
  <section class="workbench equipment-reference" aria-label="Equipment reference">
    <header class="workbench-heading"><div><p class="eyebrow">INSTALLED GAME REFERENCE</p><h1>Weapons & wearables</h1></div><RouterLink to="/weapon">Back to workbench</RouterLink></header>
    <p class="form-section-help">{{ catalog.gameVersion }} · Official XML snapshot: {{ catalog.weapons.length }} weapon/improvised/turret definitions and {{ catalog.apparel.length }} apparel definitions across Core and installed expansions. Includes NPC and building weapons; an entry here does not imply it is human-equippable or supported by the editor. Generated definitions and Workshop mods are outside this snapshot.</p>
    <p class="form-section-help"><RouterLink to="/balance">Review your draft automatically</RouterLink>, or use the <RouterLink to="/reference/balance">advanced balance reference browser</RouterLink> to inspect all 67 pawn-held references. These are a narrower scope than this equipment inventory.</p>
    <Tabs v-model:value="tab"><TabList><Tab value="weapons">Weapon types</Tab><Tab value="apparel">Armour & wearables</Tab></TabList><TabPanels>
      <TabPanel value="weapons"><div class="form-stack"><Panel v-for="family in families" :key="family[0]" :header="family[0]" toggleable><p>{{ family[1] }}</p><p class="form-section-help">{{ family[2] }}</p></Panel></div></TabPanel>
      <TabPanel value="apparel"><div class="form-stack">
        <Message severity="secondary" :closable="false">This is the implementation reference for a future apparel editor. Armour and wearables are not yet creatable or exportable from the workbench.</Message>
        <Panel header="Definition and crafting"><p>Wearables use a ThingDef with an Apparel class and an apparel section. Start with ApparelMakeableBase for clothing, ArmorSmithableBase for smithy armour, ArmorMachineableBase for machined armour, or the relevant headgear/utility parent. Use fixed costList ingredients or stuffCategories with costStuffCount, and author mass, work, hit points, research and skill requirements.</p></Panel>
        <Panel header="Coverage and compatibility"><p>apparel.bodyPartGroups specifies which body parts receive protection. apparel.layers controls wear conflicts and drawing: OnSkin, Middle, Shell, Belt, Overhead and EyeCover are Core layers. A shared layer and overlapping body coverage can prevent items being worn together; a picture alone does not define protection. Developmental stage, gender, body types and special exclusivity rules also need validation.</p></Panel>
        <Panel header="Protection and bonuses"><p>Set ArmorRating_Sharp, ArmorRating_Blunt and ArmorRating_Heat, plus insulation, equip delay and equipped stat offsets where needed. Values use 0–1 fractions: 1 is 100%. Quality and stuff affect final stats. The game checks apparel covering the struck body part, then natural armour. It subtracts penetration and rolls to deflect, halve, or pass damage; a reduced sharp hit can become blunt. Armour ratings are not flat damage reduction percentages.</p></Panel>
        <Panel header="Ground image and worn graphics"><p>graphicData.texPath is the ground/inventory image; apparel.wornGraphicPath is the pawn graphic path. Worn clothing needs the correct body-type and facing variants, and headgear has separate rendering rules. Colour masks, stuff shaders, child bodies, head/hair concealment and rendering comps must be checked against the selected template. The two texture roles cannot be replaced with a single generic weapon-image upload.</p></Panel>
        <Panel header="Special wearables and validation"><p>Shield belts, jump/smokepop/firefoam packs, integrated weapons, persona equipment and expansion apparel add their own classes, comps, abilities, charges or restrictions. Reuse those actual systems. A future editor should validate ingredient recipes, layering conflicts, body coverage, all body/facing textures, material/quality changes, damage categories and special effects in the installed game.</p></Panel>
      </div></TabPanel>
    </TabPanels></Tabs>
    <Panel :header="tab === 'apparel' ? 'Apparel definitions' : 'Weapon definitions'" toggleable>
      <label class="dialog-field">Search installed definitions<InputText v-model="search" aria-label="Search equipment definitions" placeholder="Name, defName, pack or verb class" fluid /></label>
      <div class="accuracy-report__scroll"><table class="accuracy-report__table"><thead><tr><th>Definition</th><th>Pack</th><th>{{ tab === 'apparel' ? 'Coverage / layers' : 'Type / behavior' }}</th><th>Source XML</th></tr></thead><tbody><tr v-for="row in records" :key="row.defName"><th>{{ row.label }}<small>{{ row.defName }}</small></th><td>{{ row.pack }}</td><td v-if="tab === 'apparel'">{{ row.bodyPartGroups.join(', ') || 'Special rules' }}<small>{{ row.layers.join(', ') }}</small></td><td v-else>{{ row.kind }}<small>{{ row.verbs.join(', ') || 'Melee tools' }}</small><Tag v-if="supported.has(row.defName)" value="Starting template" severity="secondary" /></td><td>{{ row.source }}</td></tr></tbody></table></div>
      <p v-if="!records.length" class="form-section-help">No matching definitions.</p>
    </Panel>
  </section>
</template>
