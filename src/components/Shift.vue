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
  <div class="flex flex-col">
    <div v-for="(assignment, index) in shift.assignments" :key="index" class="shift-spot">
      <ShiftSpot :spotIndex="index" :assignment="assignment" @drop="drop" />
    </div>
  </div>
</template>

<style scoped>
.shift-spot {
  width: 100%;
}
</style>
