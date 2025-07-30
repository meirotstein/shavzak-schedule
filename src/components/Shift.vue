<script setup lang="ts">
import { IShift } from "../model/shift";
import ShiftSpot from "./ShiftSpot.vue";

const props = defineProps<{
  shift: IShift;
  isPrintMode?: boolean;
}>();

const emit = defineEmits<{
  'drag-enter': [shiftId: string, spotIndex: number, soldierId: string]
  'drag-leave': [shiftId: string, spotIndex: number, soldierId: string]
  'drop': [shiftId: string, spotIndex: number, soldierId: string]
  'remove': [shiftId: string, spotIndex: number]
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

function remove(spotIndex: number) {
  emit('remove', props.shift.shiftId, spotIndex);
}

// Format time for display (e.g., "08:00" to "8")
function formatShiftTime(time: string): string {
  // Simple formatting to make the time more readable
  return time.replace(/^:0/, '').replace(/:00$/, '');
}
</script>

<template>
  <div class="shift-container" :class="{ 'print-mode': props.isPrintMode }">
    <!-- Floating time label that doesn't take up space -->
    <div class="shift-time-info">
      <span class="shift-time">{{ formatShiftTime(shift.startTime) }} - {{ formatShiftTime(shift.endTime) }}</span>
    </div>

    <!-- Spots container with improved layout handling -->
    <div class="shift-spots-container" :class="{ 'many-spots': shift.assignments.length > 3 }">
      <!-- Show count badge when there are many spots -->
      <div v-if="shift.assignments.length > 3 && !props.isPrintMode" class="spots-count-badge">
        {{ shift.assignments.length }} מקומות
      </div>

      <div v-for="(assignment, index) in shift.assignments" :key="index" class="shift-spot">
        <ShiftSpot :spotIndex="index" :assignment="assignment" @drop="drop" @remove="remove"
          :isPrintMode="isPrintMode" />
      </div>
    </div>
  </div>
</template>


<style scoped lang="scss">
.shift-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 0.25rem;
  position: relative;
  /* For absolute positioning of badges */
  z-index: 0;
  /* Establish a stacking context */
  overflow: visible;
  /* Ensure content outside the container is visible */

  &.print-mode {
    border: 3px solid #6b7280 !important;
    /* Professional gray border for shift container */
    border-radius: 6px !important;
    /* More rounded for better appearance */
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%) !important;
    /* Clean white to light gray gradient background */
    box-shadow: 0 3px 8px rgba(107, 114, 128, 0.15) !important;
    /* Professional gray-tinted shadow for definition */
  }
}

.shift-time-info {
  border-radius: 0px 4px 0px 4px;
  border-bottom: solid 1px rgb(var(--primary-400));
  border-left: solid 1px rgb(var(--primary-400));
  direction: ltr;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: absolute;
  top: 0;
  right: 0;
  background-color: rgba(229, 231, 235, 1); //#e5e7eb;
  font-size: 0.3px;
  z-index: 10;
}

.shift-time {
  font-size: 0.7rem;
  font-weight: 600;
  color: rgb(var(--primary-800));
}

.shift-spots-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.25rem;
  overflow-y: auto;
  /* Enable scrolling for many spots */
  max-height: 100%;
  /* Use full height */

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(var(--surface-100), 0.5);
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(var(--primary-300), 0.5);
    border-radius: 4px;
  }

  /* Special styling for when there are many spots */
  &.many-spots {
    padding-right: 0.25rem;
    /* Space for scrollbar */
  }
}

.shift-spot {
  width: 100%;
  min-height: 1.75rem;
  /* Slightly smaller for compact layout */
  margin-bottom: 0.15rem;
}

.spots-count-badge {
  position: absolute;
  top: 1px;
  left: 1px;
  background-color: rgb(var(--primary-600));
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.1rem 0.3rem;
  border-radius: 1rem;
  z-index: 5;
}

/* RTL adjustments */
:host-context(.rtl-support) {
  .spots-count-badge {
    right: auto;
    left: 0.25rem;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .shift-time {
    font-size: 0.65rem;
  }

  .shift-container {
    padding: 0.15rem;
  }

  .shift-spot {
    min-height: 1.5rem;
  }


}

/* RTL comment: Added RTL-specific positioning and ensured time display remains in LTR format */
/* Layout comment: Added scrolling capability and compact layout for shifts with many spots */

/* Print mode styles */
.shift-container.print-mode {
  .shift-time-info {
    border-bottom: solid 2px #1e40af !important;
    border-left: solid 2px #1e40af !important;
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important;
    /* Professional light blue gradient */
    box-shadow: 0 3px 6px rgba(30, 64, 175, 0.2) !important;
    /* Professional blue-tinted shadow */
    padding: 0.4rem 0.6rem !important;
    /* Much more padding for bigger appearance */
    border-radius: 0px 8px 0px 8px !important;
    /* More rounded for better appearance */
  }

  .shift-time {
    color: #1e40af !important;
    /* Professional navy blue text */
    font-weight: 800 !important;
    /* Much bolder for better readability */
    font-size: 1.2rem !important;
    /* Much larger font size */
    line-height: 1.1 !important;
    /* Better line spacing */
    text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8) !important;
    /* Light text shadow for better readability */
  }

  .spots-count-badge {
    background-color: #f1f3f4 !important;
    color: #000000 !important;
    border: 1px solid #666666 !important;
    font-weight: 600 !important;
  }

  .shift-spots-container {
    &::-webkit-scrollbar-track {
      background: #ffffff !important;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #cccccc !important;
    }
  }
}

/* Print-specific optimizations */
@media print {
  .shift-container {
    padding: 0.3rem !important;
    /* More padding to accommodate thicker borders */
    height: 100% !important;
    overflow: visible !important;
    border: 4px solid #228B22 !important;
    /* Very thick nice green border for actual print */
    border-radius: 6px !important;
    /* Better border radius for thick borders */
    background-color: #ffffff !important;
    box-shadow: 0 3px 8px rgba(34, 139, 34, 0.25) !important;
    /* Strong green-tinted shadow for definition */
  }

  .shift-time-info {
    position: absolute !important;
    top: 2px !important;
    right: 2px !important;
    background-color: #e5e7eb !important;
    border-bottom: 2px solid #333333 !important;
    border-left: 2px solid #333333 !important;
    border-radius: 0px 6px 0px 6px !important;
    /* Larger border radius */
    padding: 0.5rem 0.7rem !important;
    /* Much more padding for bigger appearance */
    z-index: 10 !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    /* Add shadow for better visibility */
  }

  .shift-time {
    font-size: 1rem !important;
    /* Much larger font size for actual print */
    font-weight: 800 !important;
    /* Much bolder font weight */
    color: #000000 !important;
    line-height: 1.1 !important;
    /* Better line spacing */
  }

  .shift-spots-container {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.1rem !important;
    padding: 0.1rem !important;
    height: 100% !important;
    overflow: visible !important;

    &.many-spots {
      padding-right: 0.1rem !important;
    }
  }

  .shift-spot {
    min-height: 1.2rem !important;
    margin-bottom: 0.05rem !important;
    width: 100% !important;
  }

  .spots-count-badge {
    display: none !important;
    /* Hidden in print as requested */
  }
}
</style>
