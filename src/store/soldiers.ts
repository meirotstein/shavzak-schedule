import { defineStore } from "pinia";
import { ref } from "vue";
import { Soldier } from "../model/soldier";

export const useSoldiersStore = defineStore("soldiers", () => {
  const soldiers = ref([
    new Soldier("משה אופניק", "קצין"),
    new Soldier("בוב ספוג", "לוחם"),
    new Soldier("ג׳ורג קונסטנזה", "לוחם"),
  ]);

  return { soldiers };
});
