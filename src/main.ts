import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import { createApp } from "vue";
import App from "./App.vue";
import Lara from "./presets/lara";
import "./style.css";

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(PrimeVue, {
  unstyled: true,
  pt: Lara,
});
app.mount("#app");
