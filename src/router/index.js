import LandingPage from '@/views/LandingPage.vue';
import WeaponPage from '@/views/WeaponPage.vue';

import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
	history: createWebHashHistory(import.meta.env.BASE_URL),
	routes: [
		{ path: '/reference/balance', name: 'balance-reference', component: () => import('@/views/BalanceReferencePage.vue') },
		{ path: '/balance', name: 'balance', component: () => import('@/views/BalancePage.vue') },
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
