<script setup lang="ts">
import Listbox from "primevue/listbox";
import { onMounted } from "vue";
import { useSoldiersStore } from "../store/soldiers";
import SoldierCard from "./SoldierCard.vue";

const { soldiers, fetchSoldiers } = useSoldiersStore();

onMounted(() => {
  fetchSoldiers();
});

</script>

<template>
  <Listbox :options="soldiers" option-label="name" option-value="name">
    <template #option="{ option }">
      <SoldierCard :soldier="option" />
    </template>
  </Listbox>
</template>

<style scoped></style>
