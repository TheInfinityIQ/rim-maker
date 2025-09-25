<script setup></script>

<template>
	<header style="margin-bottom: 45px">
		<h1 class="float-text">Rim Maker</h1>
		<Card>
			<template #content>
				<div style="display: flex; justify-content: space-between; align-items: center">
					<div style="display: flex; gap: 10px; align-items: center">
						<p>Social links:</p>
						<a
							href="https://github.com/TheInfinityIQ/rim-maker"
							target="blank"
							v-tooltip.right="'Github'"
						>
							<i class="pi pi-github" />
						</a>
						<a
							href="https://buymeacoffee.com/theinfinityiq"
							target="blank"
							v-tooltip.right="
								'Help keep the website updated and add additional features!'
							"
						>
							<i class="pi pi-heart-fill" />
						</a>
					</div>
					<div style="display: flex; gap: 10px; align-items: center">
						<p>Forms:</p>
						<a
							href="https://forms.gle/Usf4L9ZvqjyzfT8s5"
							target="blank"
							v-tooltip.bottom="'RimWorld Bug Report Form'"
						>
							<i class="fa-solid fa-bug"></i>
						</a>
						<a
							href="https://forms.gle/kDW47qX7Sz9RaLKw8"
							target="blank"
							v-tooltip.bottom="'Website Bug Report Form'"
						>
							<i class="fa-solid fa-bug"></i>
						</a>
					</div>
				</div>
			</template>
		</Card>
	</header>
	<main class="fade-item">
		<Card>
			<template #content>
				<RouterView></RouterView>
			</template>
		</Card>
	</main>
	<footer style="display: flex; align-items: center">
		<p>Made in Canada</p>
		<i class="fa-brands fa-canadian-maple-leaf"></i>
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
