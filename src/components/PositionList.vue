<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IPosition } from "../model/position";
import { usePositionsStore } from "../store/positions";
import Position from "./Position.vue";

const store = usePositionsStore();
const positions = ref<IPosition[]>([]);
const numOfPositions = ref(0);

function drop(positionId: string, shiftId: string, spotIndex: number, soldierId: string) {
  console.log('dropped', { positionId, shiftId, spotIndex, soldierId });
  store.assignSoldiersToShift(positionId, shiftId, spotIndex, soldierId);
}

onMounted(async () => {
  await store.fetchPositions();
  positions.value = store.positions;
  numOfPositions.value = store.positions.length;
});

</script>

<template>
  <div :class="`grid grid-cols-${numOfPositions}`">
    <div v-for="position in positions" :key="position.positionId">
      <Position :position="position" @drop="drop" />
    </div>
  </div>

</template>

<style scoped></style>
