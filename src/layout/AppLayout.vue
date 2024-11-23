<script setup></script>

<template>
	<header>
		<span class="float-text">Rim Maker</span>
	</header>
	<main class="fade-item">
		<Card>
			<template #content>
				<RouterView></RouterView>
			</template>
		</Card>
	</main>
	<footer class="fade-item">
		<Card>
			<template #content>
				<a href="https://github.com/TheInfinityIQ" target="blank" v-tooltip.top="'Github'">
					<i class="pi pi-github" />
				</a>
			</template>
		</Card>
	</footer>
</template>

<style scoped>
header {
	height: 15vh;
}

main {
	height: 70vh;
}

footer {
	height: 15vh;
}

span {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: top;
}

.float-text {
	font-size: 3rem;
	color: #fff;
	position: relative;
	opacity: 0;
	animation: floatUp 2s ease-out forwards;
}

.fade-item {
	animation: fadeIn 3.5s ease-out forwards;
}

@keyframes floatUp {
	0% {
		transform: translateY(100%);
		opacity: 0;
	}
	100% {
		transform: translateY(0);
		opacity: 1;
	}
}

@keyframes fadeIn {
	0% {
		opacity: 0;
	}
	100% {
		opacity: 1;
	}
}
</style>
