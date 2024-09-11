import { createPinia } from "pinia";
import PrimeVue from 'primevue/config';
import { createApp } from "vue";
import App from "./App.vue";
import Lara from '@primevue/themes/lara';
import "./style.css";

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(PrimeVue, {
  theme: {
      preset: Lara,
      options: {
        darkModeSelector: '.fake-dark-selector', // force a non-usage of the dark mode
    },
  }
});
app.mount("#app");
