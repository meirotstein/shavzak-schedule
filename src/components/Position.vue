<script setup lang="ts">
import Listbox from "primevue/listbox";
import { IPosition } from "../model/position";
import Shift from "./Shift.vue";
import { IShift, ShiftModel, UnAssignableShift } from "../model/shift";
import { dayStart } from "../app-config";

const props = defineProps<{
  position: IPosition;
}>();

const emit = defineEmits<{
  'drop': [positionId: string, shiftId: string, spotIndex: number, soldierId: string]
}>()


function drop(shiftId: string, spotIndex: number, soldierId: string) {
  console.log('dropped');
  emit('drop', props.position.positionId, shiftId, spotIndex, soldierId);
}

function fullDayShifts(): IShift[] {
  return props.position?.shifts.reduce((acc, shift, idx, arr) => {
    console.log('shift', shift, idx, arr.length, props.position.positionName);
    const first = acc.length === 0;
    const last = idx === arr.length - 1;

    if (first || last) {
      if (first) {
        if (shift.startTime !== dayStart) {
          acc.push(new UnAssignableShift(`pad-shift-${idx}`, dayStart, shift.startTime));
        }
      }

      acc.push(shift);

      if (last) {
        if (shift.endTime !== dayStart) {
          acc.push(new UnAssignableShift(`pad-shift-${idx}`, shift.endTime, dayStart));
        }
      }
      return acc;
    }

    const lastShift = acc[acc.length - 1];
    if (lastShift.endTime !== shift.startTime) {
      acc.push(new UnAssignableShift(`pad-shift-${idx}`, lastShift.endTime, shift.startTime));
    }
    acc.push(shift);

    return acc;
  }, [] as IShift[]);
}

</script>

<template>
  <h2>{{ props.position?.positionName }}</h2>
  <Listbox :options="fullDayShifts()" option-label="name" option-value="name">
    <template #option="{ option }">
      <div>
        {{ option.startTime }} - {{ option.endTime }}
        <Shift :shift="option" @drop="drop" />
      </div>
    </template>
  </Listbox>
</template>

<style scoped></style>
