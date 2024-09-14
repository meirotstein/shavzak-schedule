<script setup lang="ts">
import PositionList from './components/PositionList.vue';
import SoldierList from './components/SoldierList.vue';
</script>

<template>
  <div class="grid grid-cols-2">
    <SoldierList />
    <PositionList />
  </div>
</template>

<style scoped></style>
