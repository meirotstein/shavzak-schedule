<script setup lang="ts">
import Select from "primevue/select";
import { useSoldiersStore } from "../store/soldiers";
import SoldierCard from "./SoldierCard.vue";
import { computed, ref } from "vue";

const store = useSoldiersStore();
const allPlatoonsOption = { id: "all", name: "כל המחלקות" };
const selectedPlatoon = ref(allPlatoonsOption);

const availablePlatoons = computed(() => {
  const platoons = new Set(store.availableSoldiers.map((soldier) => soldier.platoon));
  return [allPlatoonsOption].concat([...platoons].map((platoon) => ({ id: platoon, name: platoon })));
});

const filteredSoldiers = computed(() => {
  if (selectedPlatoon.value.id === "all") {
    return store.availableSoldiers;
  }
  return store.availableSoldiers.filter((soldier) => soldier.platoon === selectedPlatoon.value.id);
});

</script>

<template>
  <div>
    <Select v-model="selectedPlatoon" :options="availablePlatoons" optionLabel="name" placeholder="בחר מחלקה"
      class="w-full md:w-56" />
    <ul class="soldier-list">
      <li v-for="(soldier, index) in filteredSoldiers" :key="index">
        <SoldierCard :soldier="soldier" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.soldier-list {
  width: 14rem;
}
</style>
