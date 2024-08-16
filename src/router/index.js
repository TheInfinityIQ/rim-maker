import LandingPage from '@/views/LandingPage.vue';
import WeaponPage from '@/views/WeaponPage.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'home',
			component: LandingPage,
		},
		{
			path: '/weapon',
			name: 'weapon',
			component: WeaponPage,
		},
	],
});

export default router;
