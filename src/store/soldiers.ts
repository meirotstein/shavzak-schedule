import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { ISoldier, SoldierModel } from "../model/soldier";
import { useGAPIStore } from "./gapi";

export const useSoldiersStore = defineStore("soldiers", () => {
  const gapi = useGAPIStore();
  const draggedSoldier = ref<ISoldier | undefined>();

  const soldiers = computed(() => {
    return gapi.soldiers.map(
      (soldier) => new SoldierModel(soldier.id, soldier.name, soldier.role)
    );
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
