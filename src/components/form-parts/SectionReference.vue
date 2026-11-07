<script setup>
defineProps({ href: { type: String, required: true }, label: { type: String, required: true } });
</script>

<template>
  <footer class="section-reference">
    <Divider />
    <p class="form-section-help">Further reading: <a :href="href" target="_blank" rel="noopener noreferrer">{{ label }} (RimWorld Wiki, opens in a new tab)</a></p>
  </footer>
</template>
