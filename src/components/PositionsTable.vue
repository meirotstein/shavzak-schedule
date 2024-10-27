<script setup lang="ts">
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import { computed, ref } from "vue";
import { IShift } from "../model/shift";
import { usePositionsStore } from "../store/positions";
import { getNextHour, hoursBetween } from '../utils/date-utils';
import Shift from "./Shift.vue";

const store = usePositionsStore();
const scheduleStartHour = ref(14); // TODO: get from config

const hours = computed(() => {
  const start = scheduleStartHour.value;
  const arr = Array.from({ length: 24 }, (_, i) => i);
  return [...arr.slice(start), ...arr.slice(0, start)].map(hour => `${hour < 10 ? '0' : ''}${hour}:00`);
});

const tableColumns = computed(() => {
  return store.positions.map((position) => {
    return {
      posId: `${position.positionId}.shiftSlot`,
      posName: position.positionName,
    };
  });
});

const tableData = computed(() => {
  const dataByHour = hours.value.reduce((obj: Record<string, any>, hour) => {
    obj[hour] = {
      hour,
    };
    return obj;
  }, {});
  store.positions.forEach((position) => {
    position.shifts.forEach((shift) => {
      const shiftHourLength = hoursBetween(shift.startTime, shift.endTime);
      for (let i = 0; i < shiftHourLength; i++) {
        const hour = getNextHour(shift.startTime, i);
        dataByHour[hour][position.positionId] = {
          posId: position.positionId,
          shiftSlot: `${shift.startTime}~${shift.endTime}`,
          shiftId: shift.shiftId,
        }
      }

    });
  });

  const dataByHourArray = Object.values(dataByHour);
  console.log('dataByHour', dataByHourArray);
  return dataByHourArray;
});

function getShift(slotData: any, cloField: string): IShift | undefined {
  const { positionId, shiftId } = getShiftDataFromColumn(cloField, slotData);
  return store.positions.find(p => p.positionId === positionId)?.shifts.find(s => s.shiftId === shiftId);
}

function hasShiftData(slotData: any, cloField: string): boolean {
  const positionId = cloField.split('.')[0];
  return !!slotData[positionId];
}

function getShiftDataFromColumn(cloField: string, slotData?: any): { positionId: string | undefined, shiftId: string | undefined } {

  const positionId = cloField.split('.')[0];
  const shiftId = slotData && slotData[positionId]?.shiftId;

  return {
    positionId,
    shiftId,
  }
}

function drop(colField: string, shiftId: string, spotIndex: number, soldierId: string) {
  console.log('dropped pos table', { shiftId, spotIndex, soldierId });
  const { positionId } = getShiftDataFromColumn(colField);
  console.log('dropped pos table', { positionId, shiftId, spotIndex, soldierId });
  if (!positionId) {
    console.error('positionId is not found');
    return;
  }
  store.assignSoldiersToShift(positionId, shiftId, spotIndex, soldierId);
}

</script>

<template>
  <div class="flex">
    <DataTable :value="tableData" rowGroupMode="rowspan" :groupRowsBy="tableColumns.map(col => col.posId)" size="small">
      <Column field="hour" header="" style="width: 1rem"></Column>
      <Column v-for="(col, index) of tableColumns" :field="col.posId" :header="col.posName"
        style="min-width: 10rem; position: relative;" :key="col.posId + '_' + index">
        <template #body="slotProps">
          <div v-if="hasShiftData(slotProps.data, col.posId)" class="column-content shift">
            <Shift :shift="getShift(slotProps.data, col.posId)!" @drop="(...args) => drop(col.posId, ...args)" />
          </div>
          <div v-else class="column-content no-shift"></div>
        </template>
      </Column>
    </DataTable>
  </div>

</template>

<style scoped lang="scss">
.column-content {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border-radius: 3px;
}

.shift {
  border: solid 1px black;
  box-shadow: -1px 2px 0px 0px rgba(0, 0, 0, 0.3);
}

.no-shift {
  border: solid 1px black;
  background-color: #524f4f;
}
</style>
