<script setup lang="ts">
import Listbox from "primevue/listbox";
import { PositionModel } from "../model/position";
import Shift from "./Shift.vue";

const props = defineProps<{
  position: PositionModel;
}>();

const emit = defineEmits<{
  'drop': [positionId: string, shiftId: string, spotIndex: number, soldierId: string]
}>()


function drop(shiftId: string, spotIndex: number, soldierId: string) {
  console.log('dropped');
  emit('drop', props.position.positionId, shiftId, spotIndex, soldierId);
}

</script>

<template>
  <h2>{{ props.position?.positionName }}</h2>
  <Listbox :options="props.position?.shifts" option-label="name" option-value="name">
    <template #option="{ option }">
      <h1>{{ option.name }}</h1>
      <Shift :shift="option" @drop="drop" />
    </template>
  </Listbox>
</template>

<style scoped></style>
