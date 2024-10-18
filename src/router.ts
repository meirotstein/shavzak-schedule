import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import AddSPIDPage from "./pages/AddSPIDPage.vue";
import SchedulePage from "./pages/SchedulePage.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "AddSPID",
    component: AddSPIDPage,
  },
  {
    path: "/spreadsheet/:id",
    name: "Schedule",
    component: SchedulePage,
  },
];

const router = createRouter({
  history: createWebHistory("/shavzak-schedule"),
  routes,
});

export default router;
