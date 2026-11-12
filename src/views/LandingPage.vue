<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<template>
  <div class="overview">
    <section class="overview-hero">
      <div class="hero-copy">
        <p class="eyebrow">A WORKBENCH FOR THE RIM</p>
        <h1>Your next mod<br />starts here.</h1>
        <p class="hero-description">Build a weapon. Shape its stats.<br />Bring something new to your colony.</p>
        <Button label="Create a weapon mod" icon="pi pi-arrow-right" iconPos="right" @click="router.push('/weapon')" />
        <p class="hero-footnote">Built for modders. No coding required.</p>
      </div>
      <Panel header="At your workbench" class="hero-panel">
        <div class="workbench-intro"><i class="pi pi-bullseye" aria-hidden="true" /><div><h2>Make it your own.</h2><p>From a dependable colony rifle to something a little less conventional.</p></div></div>
        <dl class="feature-list">
          <div><dt>01 <span>Design</span></dt><dd>Ranged weapons, melee attacks, grenades, and their combat stats.</dd></div>
          <div><dt>02 <span>Customize</span></dt><dd>Crafting costs, skills, textures, and sounds.</dd></div>
          <div><dt>03 <span>Compare</span></dt><dd><RouterLink to="/balance">Review your weapon automatically</RouterLink>, preview a tuning suggestion, and apply it when ready.</dd></div>
          <div><dt>04 <span>Export</span></dt><dd>Your weapons and assets, packaged as a mod ZIP.</dd></div>
        </dl>
      </Panel>
    </section>
    <div class="overview-bottom"><span><i class="pi pi-bullseye" aria-hidden="true" /> Ranged, melee & grenades</span><span><i class="pi pi-image" aria-hidden="true" /> Custom textures & sounds</span><span><i class="pi pi-box" aria-hidden="true" /> Mod folder export</span></div>
  </div>
</template>
