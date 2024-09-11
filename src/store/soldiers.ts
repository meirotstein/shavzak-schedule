import { defineStore } from "pinia";
import { ref } from "vue";
import { GAPIClient } from "../clients/gapi-client";
import { Soldier } from "../model/soldier";

export const useSoldiersStore = defineStore("soldiers", () => {
  const soldiers = ref<Soldier[]>([]);
  const draggedSoldier = ref<Soldier | undefined>();

  function setDraggedSoldier(soldier?: Soldier) {
    draggedSoldier.value = soldier;
  }

  async function fetchSoldiers() {
    const gapi = new GAPIClient();
    const soldiersData = await gapi.getSoldiers();
    soldiersData.forEach((soldier) =>
      soldiers.value.push(new Soldier(soldier.id, soldier.name, soldier.role))
    );
  }

  return { soldiers, draggedSoldier, setDraggedSoldier, fetchSoldiers };
});
