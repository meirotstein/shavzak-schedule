<script setup lang="ts">
import Listbox from "primevue/listbox";
import { ShiftModel } from "../model/shift";
import ShiftSpot from "./ShiftSpot.vue";

const props = defineProps<{
  shift: ShiftModel;
}>();

const emit = defineEmits<{
  'drag-enter': [shiftId: string, spotIndex: number, soldierId: string]
  'drag-leave': [shiftId: string, spotIndex: number, soldierId: string]
  'drop': [shiftId: string, spotIndex: number, soldierId: string]
}>()

// function dragEnter(spotIndex: number, soldierId: string) {
//   emit('drag-enter', props.shift.shiftId, spotIndex, soldierId);
// }

// function dragLeave(spotIndex: number, soldierId: string) {
//   emit('drag-leave', props.shift.shiftId, spotIndex, soldierId);
// }

function drop(spotIndex: number, soldierId: string) {
  emit('drop', props.shift.shiftId, spotIndex, soldierId);
}

</script>

<template>
  <Listbox :options="shift.assignmentDefinitions" option-label="name" option-value="name" class="shift-spot">
    <template #option="{ /* option, */ index }">
      <ShiftSpot :spotIndex="index" :soldier="shift.soldiers[index]" @drop="drop" />
    </template>
  </Listbox>
</template>

<style scoped></style>
