import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ColonyConsole from './theme/colonyConsole';
import App from './App.vue';
import router from './router';
import './assets/colony-console.css';

const app = createApp(App);
app.component('font-awesome-icon', FontAwesomeIcon);
app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
  theme: { preset: ColonyConsole, options: { darkModeSelector: '.colony-console' } },
  // The installed theme exposes padding tokens but no line-height token.
  pt: {
    inputtext: { root: { style: { lineHeight: '1.5rem' } } },
    textarea: { root: { style: { lineHeight: '1.5rem' } } },
    select: { label: { style: { lineHeight: '1.5rem' } } },
    multiselect: { label: { style: { lineHeight: '1.5rem' } } },
    button: { root: { style: { lineHeight: '1.5rem' } } },
  },
});
app.directive('tooltip', Tooltip);
app.mount('#app');
