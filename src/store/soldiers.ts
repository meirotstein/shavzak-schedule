import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { PresenceModel } from "../model/presence";
import { ISoldier, SoldierModel } from "../model/soldier";
import { useGAPIStore } from "./gapi";

export const useSoldiersStore = defineStore("soldiers", () => {
  const gapi = useGAPIStore();
  const draggedSoldier = ref<ISoldier | undefined>();

  const soldiers = computed(() => {
    return gapi.soldiers.map((soldier) => {
      const sol = reactive(
        new SoldierModel(
          soldier.id,
          soldier.name,
          soldier.role,
          soldier.platoon
        )
      );

      const solPresence = gapi.presence?.soldiersPresence[soldier.id];

      solPresence?.presence.forEach((presence) => {
        sol.addPresence(new PresenceModel(presence.day, presence.presence));
      });

      return sol;
    });
  });

  function setDraggedSoldier(soldier?: ISoldier) {
    draggedSoldier.value = soldier;
  }

  function findSoldierById(id: string): ISoldier | undefined {
    return soldiers.value.find((soldier) => soldier.id === id);
  }

  return {
    soldiers,
    draggedSoldier,
    setDraggedSoldier,
    findSoldierById,
  };
});
