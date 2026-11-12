<script setup>
import WeaponBalance from '@/components/balance/WeaponBalance.vue';
import { useWorkbenchStore } from '@/stores/workbench';
const workbench = useWorkbenchStore();
</script>
<template><section class="workbench" aria-label="Automatic weapon balance"><WeaponBalance :weapon="workbench.selectedWeapon" @edit="$router.push('/weapon')" /></section></template>
