import { defineStore } from "pinia";
import { ref } from "vue";
import { Soldier } from "../model/soldier";
import { GAPIClient } from "../clients/gapi-client";

export const useSoldiersStore = defineStore("soldiers", () => {
  
  const soldiers = ref<Soldier[]>([]);

  async function fetchSoldiers() {
    const gapi =  new GAPIClient();
    const soldiersData = await gapi.getSoldiers();
    soldiersData.forEach((soldier) => soldiers.value.push(new Soldier(soldier.name, soldier.role)));
  }

  return { soldiers, fetchSoldiers };
});
