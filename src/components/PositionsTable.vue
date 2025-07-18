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
  const { positionId } = getShiftDataFromColumn(colField);
  if (!positionId) {
    console.error('positionId is not found');
    return;
  }
  store.assignSoldiersToShift(positionId, shiftId, spotIndex, soldierId);
}

function remove(colField: string, shiftId: string, spotIndex: number) {
  console.log('remove soldier from pos table', { shiftId, spotIndex });
  const { positionId } = getShiftDataFromColumn(colField);
  console.log('remove soldier from pos table', { positionId, shiftId, spotIndex });
  if (!positionId) {
    console.error('positionId is not found');
    return;
  }
  store.removeSoldierFromShift(positionId, shiftId, spotIndex);
}

</script>

<template>
  <div class="positions-table-container">
    <!-- DataTable needs special RTL handling -->
    <DataTable
      :value="tableData"
      rowGroupMode="rowspan"
      :groupRowsBy="tableColumns.map(col => col.posId)"
      size="small"
      class="w-full rtl-table"
      stripedRows
      responsiveLayout="scroll"
    >
      <Column field="hour" header="Time" style="width: 4rem" class="font-semibold">
        <!-- <template #header>
          <span class="text-sm font-medium text-gray-700">Time</span>
        </template> -->
        <template #body="slotProps">
          <span class="text-sm font-medium">{{ slotProps.data.hour }}</span>
        </template>
      </Column>
      <Column
        v-for="(col, index) of tableColumns"
        :field="col.posId"
        :header="col.posName"
        style="min-width: 8rem; position: relative;"
        :key="col.posId + '_' + index"
      >
        <!-- <template #header>
          <span class="text-sm font-medium">{{ col.posName }}</span>
        </template> -->
        <template #body="slotProps">
          <div
            v-if="hasShiftData(slotProps.data, col.posId)"
            class="column-content shift flex flex-col justify-center"
            role="button"
            tabindex="0"
            aria-label="Shift position for {{ col.posName }}"
          >
            <Shift
              :shift="getShift(slotProps.data, col.posId)!"
              @drop="(...args) => drop(col.posId, ...args)"
              @remove="(...args) => remove(col.posId, ...args)"
            />
          </div>
          <div
            v-else
            class="column-content no-shift"
            aria-label="No shift scheduled"
          ></div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped lang="scss">
.positions-table-container {
  width: 100%;
  overflow-x: auto;
  direction: rtl; /* RTL: Set direction for the table container */
}

.column-content {
  position: absolute;
  top: 2px;
  right: 2px; /* RTL: Changed from left to right */
  left: 2px;
  bottom: 2px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.shift {
  border: solid 1px rgb(var(--primary-400));
  background-color: rgba(var(--primary-50), 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden; /* Ensure content doesn't overflow */
  max-height: 100%; /* Limit height to prevent overflow */
  
  /* Improve visual hierarchy */
  &:hover {
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
}

.no-shift {
  border: solid 1px rgba(var(--surface-300), 0.5);
  background-color: rgba(var(--surface-200), 0.3);
  opacity: 0.7;
}

/* Add responsive styling */
@media (max-width: 768px) {
  .column-content {
    top: 1px;
    right: 1px; /* RTL: Changed from left to right */
    left: 1px;
    bottom: 1px;
  }
}

/* Improve DataTable appearance */
:deep(.p-datatable) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

:deep(.p-datatable-header) {
  background-color: rgb(var(--primary-50));
  border-bottom: 1px solid rgb(var(--primary-200));
}

:deep(.p-datatable-thead > tr > th) {
  background-color: rgb(var(--surface-50));
  color: rgb(var(--primary-700));
  font-weight: 600;
  padding: 0.75rem 1rem;
  text-align: right; /* RTL: Align header text to the right */
}

:deep(.p-datatable-tbody > tr > td) {
  text-align: right; /* RTL: Align cell content to the right */
}

:deep(.p-datatable-tbody > tr) {
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(var(--primary-50), 0.2);
  }
}

/* RTL-specific table styles */
.rtl-table {
  direction: rtl;
  
  :deep(.p-datatable-wrapper) {
    direction: rtl;
  }
  
  :deep(.p-datatable-tbody) {
    direction: rtl;
  }
  
  :deep(.p-datatable-thead) {
    direction: rtl;
  }
}

/* RTL comment: Added RTL-specific styles for the DataTable to ensure proper text alignment and layout direction */
</style>
