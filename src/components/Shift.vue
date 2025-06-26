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

// Format time for display (e.g., "08:00" to "8")
function formatShiftTime(time: string): string {
  // Simple formatting to make the time more readable
  return time.replace(/^0/, '').replace(/:00$/, '');
}
</script>

<template>
  <div class="shift-container">
    <div class="shift-time-info">
      <span class="shift-time">{{ formatShiftTime(shift.startTime) }} - {{ formatShiftTime(shift.endTime) }}</span>
    </div>
    
    <!-- Spots container with improved layout handling -->
    <div class="shift-spots-container" :class="{ 'many-spots': shift.assignments.length > 3 }">
      <!-- Show count badge when there are many spots -->
      <div v-if="shift.assignments.length > 3" class="spots-count-badge">
        {{ shift.assignments.length }} spots
      </div>
      
      <div
        v-for="(assignment, index) in shift.assignments"
        :key="index"
        class="shift-spot"
      >
        <ShiftSpot
          :spotIndex="index"
          :assignment="assignment"
          @drop="drop"
        />
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
  position: relative; /* For absolute positioning of badges */
}

.shift-time-info {
  display: flex;
  justify-content: center;
  margin-bottom: 0.25rem;
  padding: 0.15rem;
  background-color: rgba(var(--primary-100), 0.5);
  border-radius: 4px;
  border: 1px solid rgba(var(--primary-200), 0.7);
  direction: ltr; /* Keep time display in LTR format */
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
  overflow-y: auto; /* Enable scrolling for many spots */
  max-height: calc(100% - 1.5rem); /* Limit height to prevent overflow */
  
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
    max-height: 8rem; /* Fixed height when many spots */
    padding-right: 0.25rem; /* Space for scrollbar */
  }
}

.shift-spot {
  width: 100%;
  min-height: 1.75rem; /* Slightly smaller for compact layout */
  margin-bottom: 0.15rem;
}

.spots-count-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
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
  
  .shift-spots-container.many-spots {
    max-height: 6rem;
  }
}

/* RTL comment: Added RTL-specific positioning and ensured time display remains in LTR format */
/* Layout comment: Added scrolling capability and compact layout for shifts with many spots */
</style>
