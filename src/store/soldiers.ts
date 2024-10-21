import { defineStore } from "pinia";
import { ref } from "vue";
import { ISoldier, SoldierModel } from "../model/soldier";
import { useGAPIStore } from "./gapi";

export const useSoldiersStore = defineStore("soldiers", () => {
  const gapi = useGAPIStore();
  const soldiers = ref<ISoldier[]>([]);
  const draggedSoldier = ref<ISoldier | undefined>();

  function setDraggedSoldier(soldier?: ISoldier) {
    draggedSoldier.value = soldier;
  }

  async function fetchSoldiers() {
    const soldiersData = await gapi.getSoldiers();
    soldiersData.forEach((soldier) =>
      soldiers.value.push(
        new SoldierModel(soldier.id, soldier.name, soldier.role)
      )
    );
  }

  function findSoldierById(id: string): ISoldier | undefined {
    return soldiers.value.find((soldier) => soldier.id === id);
  }

  return {
    soldiers,
    draggedSoldier,
    setDraggedSoldier,
    fetchSoldiers,
    findSoldierById,
  };
});
