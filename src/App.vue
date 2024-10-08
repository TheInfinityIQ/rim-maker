<script setup>
import { RouterView } from 'vue-router';
import 'primeicons/primeicons.css';

function toggleDarkMode() {
	document.documentElement.classList.toggle('dark-mode');
}
</script>

<template>
	<header>
		<Button icon="pi pi-moon" @click="toggleDarkMode()"></Button>
	</header>
	<RouterView></RouterView>
</template>
