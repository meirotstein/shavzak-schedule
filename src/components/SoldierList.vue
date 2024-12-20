<script setup lang="ts">
import { useSoldiersStore } from "../store/soldiers";
import SoldierCard from "./SoldierCard.vue";

const store = useSoldiersStore();

</script>

<template>
  <ul class="soldier-list">
    <li v-for="(soldier, index) in store.availableSoldiers" :key="index">
      <SoldierCard :soldier="soldier" />
    </li>
  </ul>
</template>

<style scoped>
.soldier-list {
  width: 14rem;
}
</style>
