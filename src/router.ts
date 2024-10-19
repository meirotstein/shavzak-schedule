import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
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
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHashHistory("/shavzak-schedule"),
  routes,
});

export default router;
