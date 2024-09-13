<script setup lang="ts">
import Listbox from "primevue/listbox";
import { onMounted, ref } from "vue";
import { PositionModel } from "../model/position";
import { usePositionsStore } from "../store/positions";
import Position from "./Position.vue";

const store = usePositionsStore();
const positions = ref<PositionModel[]>([]);

function drop(positionId: string, shiftId: string, spotIndex: number, soldierId: string) {
  console.log('dropped', { positionId, shiftId, spotIndex, soldierId });
  store.assignSoldiersToShift(positionId, shiftId, spotIndex, soldierId);
}

onMounted(async () => {
  await store.fetchPositions();
  positions.value = store.positions;
});

</script>

<template>
  <Listbox :options="positions" option-label="name" option-value="name">
    <template #option="{ option }">
      <Position :position="option" @drop="drop" />
    </template>
  </Listbox>
</template>

<style scoped></style>
