<script setup lang="ts">
import { IShift } from "../model/shift";
import ShiftSpot from "./ShiftSpot.vue";

const props = defineProps<{
  shift: IShift;
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
  <div class="flex">
    <div v-for="(_, index) in shift.assignmentDefinitions" :key="index" class="shift-spot">
      <ShiftSpot :spotIndex="index" :soldier="shift.soldiers[index]" @drop="drop" />
    </div>
  </div>
</template>

<style scoped>
.shift-spot {
  width: 100%;
}
</style>
