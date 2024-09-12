<script setup lang="ts">
import Listbox from "primevue/listbox";
import { onMounted, ref } from "vue";
import { usePositionsStore } from "../store/positions";
import Shift from "./Shift.vue";
import { ShiftModel as ShiftModel } from "../model/shift";

const store = usePositionsStore();
const shifts = ref<ShiftModel[]>([]);

function drop(shiftId: string, spotIndex: number, soldierId: string) {
  console.log('dropped');
  store.assignSoldiersToShift(store.positions[0]?.positionId, shiftId, spotIndex, soldierId);
}

onMounted(async () => {
  await store.fetchPositions();
  shifts.value = store.positions[0].shifts;
});

</script>

<template>
  <h2>{{ store.positions && store.positions[0]?.positionName }}</h2>
  <Listbox :options="shifts" option-label="name" option-value="name">
    <template #option="{ option }">
      <h1>{{ option.name }}</h1>
      <Shift :shift="option" @drop="drop"/>
    </template>
  </Listbox>
</template>

<style scoped></style>
