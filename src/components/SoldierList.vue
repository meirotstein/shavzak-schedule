<script setup lang="ts">
import Listbox from "primevue/listbox";
import { onMounted } from "vue";
import { useSoldiersStore } from "../store/soldiers";
import SoldierCard from "./SoldierCard.vue";

const store = useSoldiersStore();

onMounted(() => {
  store.fetchSoldiers();
});

</script>

<template>
  <Listbox :options="store.soldiers" option-label="name" option-value="name" class="soldier-list">
    <template #option="{ option }">
      <SoldierCard :soldier="option" />
    </template>
  </Listbox>
</template>

<style scoped>
.soldier-list {
  width: 14rem;
}
</style>
