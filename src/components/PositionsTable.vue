<script setup lang="ts">
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import { computed, onMounted, ref } from "vue";
import { getNextHour, hoursBetween } from '../utils/date-utils';
import { IPosition } from "../model/position";
import { IShift } from "../model/shift";
import { usePositionsStore } from "../store/positions";
import Shift from "./Shift.vue";

const store = usePositionsStore();
const positions = ref<IPosition[]>([]);
const numOfPositions = ref(0);
const scheduleStartHour = ref(0); // TODO: get from config

const hours = computed(() => {
  const start = scheduleStartHour.value;
  const arr = Array.from({ length: 24 }, (_, i) => i);
  return [...arr.slice(start), ...arr.slice(0, start)].map(hour => `${hour < 10 ? '0' : ''}${hour}:00`);
});

const tableColumns = computed(() => {
  return positions.value.map((position) => {
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
  positions.value.forEach((position) => {
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

  const start = scheduleStartHour.value;
  const dataByHourArray = Object.values(dataByHour);
  const dataByHourArraySorted = [...dataByHourArray.slice(start), ...dataByHourArray.slice(0, start)]
  console.log('dataByHour', dataByHourArraySorted);
  return dataByHourArraySorted;

});

function getShift(slotData: any, cloField: string): IShift | undefined {
  const { positionId, shiftId } = getShiftDataFromColumn(cloField, slotData);
  return positions.value.find(p => p.positionId === positionId)?.shifts.find(s => s.shiftId === shiftId);
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

onMounted(async () => {
  await store.fetchPositions();
  positions.value = store.positions;
  numOfPositions.value = store.positions.length;
});

</script>

<template>
  <div class="flex">
    <DataTable :value="tableData" tableStyle="min-width: 50rem" rowGroupMode="rowspan"
      :groupRowsBy="tableColumns.map(col => col.posId)">
      <Column field="hour" header="" style="width: 1rem"></Column>
      <Column v-for="(col, index) of tableColumns" :field="col.posId" :header="col.posName"
        :key="col.posId + '_' + index">
        <template #body="slotProps">
          <div v-if="hasShiftData(slotProps.data, col.posId)">
            <Shift :shift="getShift(slotProps.data, col.posId)!" @drop="(...args) => drop(col.posId, ...args)" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>

</template>

<style scoped></style>
