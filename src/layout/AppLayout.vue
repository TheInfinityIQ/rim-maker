<script setup>
import { useRoute } from 'vue-router';
const route = useRoute();
function skipToContent() { document.getElementById('main-content')?.focus(); }
</script>

<template>
  <a class="skip-link" href="#main-content" @click.prevent="skipToContent">Skip to content</a>
  <div class="site-shell">
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="RimMaker home">
        <i class="pi pi-hammer" aria-hidden="true" />
        <span>RIM<span class="brand-accent">MAKER</span><small>A WORKBENCH FOR THE RIM</small></span>
      </RouterLink>
      <nav class="site-nav" aria-label="Main navigation">
        <RouterLink to="/" :aria-current="route.name === 'home' ? 'page' : undefined">Overview</RouterLink>
        <RouterLink to="/weapon" :aria-current="route.name === 'weapon' ? 'page' : undefined">Workbench</RouterLink>
      </nav>
      <span class="site-credit">By TheInfinityIQ</span>
    </header>
    <main id="main-content" class="site-main" tabindex="-1">
      <RouterView v-slot="{ Component }"><KeepAlive><component :is="Component" /></KeepAlive></RouterView>
    </main>
    <footer class="site-footer">
      <span>Made in Canada <span aria-hidden="true">·</span> Independent RimWorld fan tool</span>
      <nav aria-label="Community links">
        <a href="https://github.com/TheInfinityIQ/rim-maker" target="_blank" rel="noopener noreferrer">GitHub <i class="pi pi-arrow-up-right" aria-hidden="true" /></a>
        <a href="https://forms.gle/Usf4L9ZvqjyzfT8s5" target="_blank" rel="noopener noreferrer">Report a mod bug</a>
        <a href="https://forms.gle/kDW47qX7Sz9RaLKw8" target="_blank" rel="noopener noreferrer">Report a site bug</a>
        <a href="https://buymeacoffee.com/theinfinityiq" target="_blank" rel="noopener noreferrer">Support RimMaker</a>
      </nav>
    </footer>
  </div>
</template>
