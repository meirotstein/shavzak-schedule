import Lara from "@primevue/themes/lara";
import { createPinia } from "pinia";
import "primeicons/primeicons.css";
import PrimeVue from "primevue/config";
import Tooltip from "primevue/tooltip";
import { createApp } from "vue";
import App from "./App.vue";
import he_il from "./locale/he-IL";
import router from "./router";
import "./style.css";

const pinia = createPinia();
const app = createApp(App);
app.use(router);
app.use(pinia);
app.use(PrimeVue, {
  theme: {
    preset: Lara,
    options: {
      darkModeSelector: ".fake-dark-selector", // force a non-usage of the dark mode
    },
  },
  locale: he_il,
  pt: {
    listbox: {
      listContainer: {
        style: "max-height: none",
      },
    },
  },
});
app.directive("tooltip", Tooltip);
app.mount("#app");
