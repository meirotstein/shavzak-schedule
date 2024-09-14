import { defineStore } from "pinia";
import { ref } from "vue";
import { GAPIClient } from "../clients/gapi-client";
import { ISoldier, SoldierModel } from "../model/soldier";

export const useSoldiersStore = defineStore("soldiers", () => {
  const soldiers = ref<ISoldier[]>([]);
  const draggedSoldier = ref<ISoldier | undefined>();

  function setDraggedSoldier(soldier?: ISoldier) {
    draggedSoldier.value = soldier;
  }

  async function fetchSoldiers() {
    const gapi = new GAPIClient();
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
