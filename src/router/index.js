import LandingPage from '@/views/LandingPage.vue';
import WeaponPage from '@/views/WeaponPage.vue';

import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
	history: createWebHashHistory(import.meta.env.BASE_URL),
	routes: [
		{ path: '/reference', name: 'reference', component: () => import('@/views/EquipmentReference.vue') },
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
