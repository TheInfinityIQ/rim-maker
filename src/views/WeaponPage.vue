<script setup>
import { ref } from 'vue';
import WeaponForm from '@/components/WeaponForm.vue';

const weapons = ref(0);
</script>

<template>
	<Button label="Make a Weapon" @click="weapons++" />

	<WeaponForm v-for="weapon in weapons" style="margin-top: 50px"></WeaponForm>
</template>
