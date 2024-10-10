<script setup lang="ts">
import { onMounted } from "vue";
import { useSoldiersStore } from "../store/soldiers";
import SoldierCard from "./SoldierCard.vue";

const store = useSoldiersStore();

onMounted(() => {
  store.fetchSoldiers();
});

</script>

<template>
  <ul class="soldier-list">
    <li v-for="(soldier, index) in store.soldiers" :key="index" >
      <SoldierCard :soldier="soldier" />
    </li>
  </ul>
</template>

<style scoped>
.soldier-list {
  width: 14rem;
}
</style>
