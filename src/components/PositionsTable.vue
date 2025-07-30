<script setup lang="ts">
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import { computed } from "vue";
import { IShift } from "../model/shift";
import { useGAPIStore } from "../store/gapi";
import { usePositionsStore } from "../store/positions";
import { getNextHour, hoursBetween } from '../utils/date-utils';
import PositionsTableSkeleton from "./PositionsTableSkeleton.vue";
import Shift from "./Shift.vue";

const props = defineProps<{
  isPrintMode?: boolean;
}>();

const store = usePositionsStore();
const gapiStore = useGAPIStore();

// Get schedule start hour from dayStart setting
const scheduleStartHour = computed(() => {
  const dayStart = gapiStore.dayStart;
  return parseInt(dayStart.split(':')[0]);
});

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

const tableStyle = computed(() => ({
  '--position-count': tableColumns.value.length
}));

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
  <div class="positions-table-container" :class="{ 'print-mode': props.isPrintMode }" :style="tableStyle">
    <!-- Loading skeleton -->
    <PositionsTableSkeleton v-if="store.isLoadingPositions" :position-count="tableColumns.length || 8" />

    <!-- Normal table content -->
    <DataTable v-else :value="tableData" rowGroupMode="rowspan" :groupRowsBy="tableColumns.map(col => col.posId)"
      size="small" class="w-full rtl-table" :class="{ 'print-table': props.isPrintMode }" stripedRows
      responsiveLayout="scroll">
      <Column field="hour" header="Time" style="width: 4rem" class="font-semibold">
        <!-- <template #header>
          <span class="text-sm font-medium text-gray-700">Time</span>
        </template> -->
        <template #body="slotProps">
          <span class="text-sm font-medium" :class="{ 'print-time-label': props.isPrintMode }">{{ slotProps.data.hour }}</span>
        </template>
      </Column>
      <Column v-for="(col, index) of tableColumns" :field="col.posId" :header="col.posName"
        style="min-width: 8rem; position: relative;" :key="col.posId + '_' + index">
        <!-- <template #header>
          <span class="text-sm font-medium">{{ col.posName }}</span>
        </template> -->
        <template #body="slotProps">
          <div v-if="hasShiftData(slotProps.data, col.posId)" class="column-content shift flex flex-col justify-center"
            role="button" tabindex="0" aria-label="Shift position for {{ col.posName }}">
            <Shift :shift="getShift(slotProps.data, col.posId)!" @drop="(...args) => drop(col.posId, ...args)"
              @remove="(...args) => remove(col.posId, ...args)" :is-print-mode="props.isPrintMode" />
          </div>
          <div v-else class="column-content no-shift" aria-label="No shift scheduled"></div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped lang="scss">
.positions-table-container {
  width: 100%;
  overflow-x: auto;
  direction: rtl;
  /* RTL: Set direction for the table container */
}

.column-content {
  position: absolute;
  top: 2px;
  right: 2px;
  /* RTL: Changed from left to right */
  left: 2px;
  bottom: 2px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.shift {
  border: solid 1px rgb(var(--primary-400));
  background-color: rgba(var(--primary-50), 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  /* Ensure content doesn't overflow */
  max-height: 100%;
  /* Limit height to prevent overflow */

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
    right: 1px;
    /* RTL: Changed from left to right */
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
  text-align: right;
  /* RTL: Align header text to the right */
}

:deep(.p-datatable-tbody > tr > td) {
  text-align: right;
  /* RTL: Align cell content to the right */
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

/* Print mode styles */
.print-mode {
  .column-content.shift {
    border: solid 4px #4b5563 !important;
    /* Professional dark gray border for prominence */
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%) !important;
    /* Subtle light gray gradient background */
    box-shadow: 0 3px 8px rgba(75, 85, 99, 0.2) !important;
    /* Professional gray-tinted shadow for depth */

    &:hover {
      box-shadow: 0 3px 8px rgba(75, 85, 99, 0.2) !important;
      transform: none !important;
    }
  }

  .column-content.no-shift {
    border: solid 2px #ddd !important;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
    /* Light gray gradient for empty cells */
    opacity: 1 !important;
  }
}

.print-table {
  &:deep(.p-datatable) {
    border-radius: 0 !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    /* Subtle shadow for the whole table */
    border: 2px solid #333333 !important;
    /* Thicker main border */
  }

  &:deep(.p-datatable-header) {
    background-color: #f8f9fa !important;
    /* Light gray header */
    border-bottom: 2px solid #333333 !important;
  }

  &:deep(.p-datatable-thead > tr > th) {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%) !important;
    /* Professional dark blue-gray gradient */
    color: #ffffff !important;
    /* White text for contrast */
    border: 2px solid #2c3e50 !important;
    /* Dark blue-gray border */
    font-weight: 700 !important;
    /* Bolder font weight */
    padding: 1.5rem 1.8rem !important;
    /* Even more padding for bigger headers */
    font-size: 1.6rem !important;
    /* Much larger font size for column labels */
    text-align: center !important;
    line-height: 1.2 !important;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important;
    /* Text shadow for better readability */
  }

  /* Time column header - even bigger and bolder */
  &:deep(.p-datatable-thead > tr > th:first-child) {
    font-size: 1.8rem !important;
    /* Even larger font for Time header */
    font-weight: 800 !important;
    /* Extra bold font weight */
    padding: 1.8rem !important;
    /* More padding for prominence */
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%) !important;
    /* Professional navy blue gradient for Time header */
    border: 3px solid #1e3a8a !important;
    /* Navy blue border for Time header */
    color: #ffffff !important;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.4) !important;
  }

  &:deep(.p-datatable-tbody > tr > td) {
    background-color: #ffffff !important;
    color: #000000 !important;
    border: 1px solid #999999 !important;
    padding: 0.5rem !important;
    vertical-align: middle !important;
  }

  &:deep(.p-datatable-tbody > tr) {
    background-color: #ffffff !important;

    &:hover {
      background-color: #ffffff !important;
    }

    &:nth-child(even) {
      background-color: #fafafa !important;
      /* Very subtle alternating rows */
    }
  }

  /* Time column styling */
  &:deep(.p-datatable-tbody > tr > td:first-child) {
    background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%) !important;
    /* Professional light gray gradient for time cells */
    font-weight: 700 !important;
    /* Bolder font weight */
    border-right: 3px solid #6b7280 !important;
    /* Professional gray border for time column */
    font-size: 1.1rem !important;
    /* Larger font for time labels */
    padding: 1rem !important;
    /* More padding for bigger cells */
    color: #1f2937 !important;
    /* Dark professional text */
  }
}

/* Print mode time labels */
.print-time-label {
  font-size: 1.1rem !important;
  font-weight: 700 !important;
  color: #2d3436 !important;
  /* Dark color for contrast on colorful background */
  text-shadow: 1px 1px 2px rgba(255,255,255,0.8) !important;
  /* Light shadow for better readability */
}

/* Print-specific optimizations for A4 landscape */
@media print {
  .positions-table-container {
    width: 100% !important;
    overflow: visible !important;
    direction: rtl;
  }

  :deep(.p-datatable) {
    font-size: 0.75rem !important;
    border-collapse: collapse !important;
    width: 100% !important;
    table-layout: fixed !important;
  }

  :deep(.p-datatable-thead > tr > th) {
    padding: 1.4rem 1rem !important;
    /* Much more padding for bigger headers */
    font-size: 1.5rem !important;
    /* Much larger font size for column headers in print */
    font-weight: 700 !important;
    /* Bolder font weight */
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%) !important;
    /* Professional dark gray gradient for actual print headers */
    color: #ffffff !important;
    border: 2px solid #374151 !important;
    /* Professional gray borders */
    text-align: center !important;
    word-wrap: break-word !important;
    line-height: 1.3 !important;
    /* Better line spacing */
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important;
  }

  /* Time column header in actual print - extra large */
  :deep(.p-datatable-thead > tr > th:first-child) {
    font-size: 1.7rem !important;
    /* Even larger font for Time header in print */
    font-weight: 800 !important;
    /* Extra bold font weight */
    padding: 1.6rem 1.2rem !important;
    /* More padding for prominence */
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%) !important;
    /* Professional navy blue gradient for Time header in print */
    color: #ffffff !important;
    border: 3px solid #1e3a8a !important;
    /* Navy blue border */
    width: 5rem !important;
    /* Wider to accommodate larger text */
    text-shadow: 1px 1px 2px rgba(0,0,0,0.4) !important;
  }

  :deep(.p-datatable-tbody > tr > td) {
    padding: 0.4rem !important;
    /* More padding for bigger cells */
    font-size: 0.75rem !important;
    /* Slightly larger font */
    border: 1px solid #666666 !important;
    vertical-align: top !important;
    height: 4rem !important;
    /* Much taller cells to accommodate bigger content */
    word-wrap: break-word !important;
  }

  /* Time column - wider for bigger text */
  :deep(.p-datatable-tbody > tr > td:first-child) {
    width: 5rem !important;
    /* Wider to accommodate bigger text */
    min-width: 5rem !important;
    max-width: 5rem !important;
    font-size: 1rem !important;
    /* Much larger font for time labels */
    font-weight: 700 !important;
    /* Bolder font weight */
    text-align: center !important;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
    /* Professional light gray gradient for time cells in print */
    color: #1e293b !important;
    /* Professional dark slate text */
    border-right: 3px solid #64748b !important;
    /* Professional slate border */
    padding: 0.8rem 0.4rem !important;
    /* More padding for better spacing */
  }

  /* Position columns - equal width distribution */
  :deep(.p-datatable-thead > tr > th:not(:first-child)) {
    width: calc((100% - 5rem) / var(--position-count, 8)) !important;
    /* Adjust for wider time column */
    min-width: 6rem !important;
    /* Wider minimum for bigger headers */
  }

  :deep(.p-datatable-tbody > tr > td:not(:first-child)) {
    width: calc((100% - 5rem) / var(--position-count, 8)) !important;
    /* Adjust for wider time column */
    min-width: 6rem !important;
    /* Wider minimum for bigger content */
  }

  .column-content {
    position: relative !important;
    top: 0 !important;
    right: 0 !important;
    left: 0 !important;
    bottom: 0 !important;
    height: 100% !important;
    padding: 0.15rem !important;
  }

  .column-content.shift {
    border: 3px solid #228B22 !important;
    /* Much thicker nice green border for actual print */
    background-color: #ffffff !important;
    box-shadow: 0 2px 6px rgba(34, 139, 34, 0.2) !important;
    /* Green-tinted shadow for better definition */
  }

  .column-content.no-shift {
    border: 1px dashed #cccccc !important;
    background-color: #fafafa !important;
  }

  /* Ensure table doesn't break across pages */
  :deep(.p-datatable-wrapper) {
    page-break-inside: avoid;
  }

  /* Print mode time labels in actual print */
  .print-time-label {
    font-size: 1rem !important;
    font-weight: 700 !important;
    color: #000000 !important;
  }
}
</style>
