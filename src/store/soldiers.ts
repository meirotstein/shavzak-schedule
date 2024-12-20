import { isSameDay } from "date-fns";
import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { PresenceModel, PresenceState } from "../model/presence";
import { ISoldier, SoldierModel } from "../model/soldier";
import { useGAPIStore } from "./gapi";
import { useScheduleStore } from "./schedule";

export const useSoldiersStore = defineStore("soldiers", () => {
  const gapi = useGAPIStore();
  const scheduleStore = useScheduleStore();
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

  const availableSoldiers = computed(() => {
    if (!gapi.presence.start || !scheduleStore.scheduleDate) return [];

    return soldiers.value.filter((soldier) => {
      return (
        soldier.presence.find(
          (p) => p.date && isSameDay(p.date, scheduleStore.scheduleDate!)
        )?.presence === PresenceState.PRESENT
      );
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
    availableSoldiers,
    draggedSoldier,
    setDraggedSoldier,
    findSoldierById,
  };
});
