import { defineStore } from "pinia";
import { ref } from "vue";

export const useSoldiersStore = defineStore("soldiers", () => {
  const soldiers = ref([
    {
      name: "משה אופניק",
      role: "קצין",
    },
    {
      name: "בוב ספוג",
      role: "לוחם",
    },
    {
      name: "ג׳ורג קונסטנזה",
      role: "לוחם",
    },
  ]);

  return { soldiers };
});
