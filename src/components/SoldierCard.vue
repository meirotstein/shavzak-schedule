<script setup lang="ts">
import { addDays, format, isSameDay, subDays } from "date-fns";
import Card from "primevue/card";
import { computed } from "vue";
import { PresenceState } from "../model/presence";
import { ISoldier } from "../model/soldier";
import { useAssignmentsStore } from "../store/assignments";
import { useScheduleStore } from "../store/schedule";
import { useSoldiersStore } from "../store/soldiers";
import { AlertLevel, getAlertDescription, getAssignmentAlertLevel } from "../utils/assignment-alerts";
import Draggable from "./dragndrop/Draggable.vue";

const store = useSoldiersStore();
const assignmentsStore = useAssignmentsStore();
const scheduleStore = useScheduleStore();

const props = defineProps<{
  soldier: ISoldier;
  target: 'list' | 'shift';
  isPrintMode?: boolean;
}>();

const emit = defineEmits<{
  'drag-start': [event: DragEvent, soldier: ISoldier]
  'drag-end': [event: DragEvent, soldier: ISoldier]
  'drag-over': [event: DragEvent, soldier: ISoldier]
}>()

const isAssigned = computed(() => {
  return assignmentsStore.isAssigned(props.soldier.id);
});

const assignmentSummary = computed(() => {
  if (!isAssigned.value) return '';

  const assignments = assignmentsStore.getAssignments(props.soldier.id);
  if (assignments.length === 1) {
    return `${assignments[0].positionName} (${assignments[0].startTime}-${assignments[0].endTime})`;
  }
  return `${assignments.length} משימות`;
});

const assignmentTooltip = computed(() => {
  if (!isAssigned.value) return '';

  const assignments = assignmentsStore.getAssignments(props.soldier.id);
  if (assignments.length <= 1) return '';

  return assignments.map(assignment =>
    `${assignment.positionName} (${assignment.startTime}-${assignment.endTime})`
  ).join('\n');
});

// New computed for past assignments statistics
const pastAssignments = computed(() => {
  const allAssignments = assignmentsStore.getAllAssignments(props.soldier.id);
  const currentDate = scheduleStore.scheduleDate || new Date();
  // Filter to get only past assignments (before current date)
  const pastAssignmentsList = allAssignments
    .filter(assignment => assignment.date < currentDate) // Only assignments from dates before current date
    .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by date descending (most recent first)
    .slice(0, 3); // Take up to 3 most recent past assignments

  return pastAssignmentsList;
});

const pastAssignmentsTooltip = computed(() => {
  if (pastAssignments.value.length === 0) {
    return 'אין שיבוצים קודמים';
  }

  return pastAssignments.value
    .map(assignment => {
      const dateStr = format(assignment.date, 'dd/MM/yyyy');
      return `${dateStr}: ${assignment.positionName} (${assignment.startTime}-${assignment.endTime})`;
    })
    .join('\n');
});

// Helper function to get soldier presence for a specific date
const getSoldierPresenceForDate = (date: Date) => {
  return props.soldier.presence.find(p => isSameDay(p.date, date))?.presence;
};

// Check if soldier is returning from home (present today, different yesterday)
const isReturningFromHome = computed(() => {
  if (!scheduleStore.scheduleDate) return false;

  const todayPresence = getSoldierPresenceForDate(scheduleStore.scheduleDate);
  if (todayPresence !== PresenceState.PRESENT) return false;

  const yesterday = subDays(scheduleStore.scheduleDate, 1);
  const yesterdayPresence = getSoldierPresenceForDate(yesterday);

  // Returning if present today and was different (not present) yesterday
  return yesterdayPresence !== PresenceState.PRESENT && yesterdayPresence !== undefined;
});

// Check if soldier is going home the day after (present today, home/discharged tomorrow) 
const isGoingHomeNextDay = computed(() => {
  if (!scheduleStore.scheduleDate) return false;

  const todayPresence = getSoldierPresenceForDate(scheduleStore.scheduleDate);
  if (todayPresence !== PresenceState.PRESENT) return false;

  const tomorrow = addDays(scheduleStore.scheduleDate, 1);
  const tomorrowPresence = getSoldierPresenceForDate(tomorrow);

  // Going home if present today and will be home or discharged tomorrow
  return tomorrowPresence === PresenceState.HOME || tomorrowPresence === PresenceState.DISCHARGED;
});

// New computed for assignment alert level
const assignmentAlertLevel = computed((): AlertLevel => {
  if (!isAssigned.value) return 'none';

  const assignments = assignmentsStore.getAssignments(props.soldier.id);
  return getAssignmentAlertLevel(assignments);
});

const alertDescription = computed(() => {
  return getAlertDescription(assignmentAlertLevel.value);
});

function dragOver(e: DragEvent) {
  emit('drag-over', e, props.soldier);
}

function dragStart(e: DragEvent) {
  store.setDraggedSoldier(props.soldier);
  emit('drag-start', e, props.soldier);
}
function dragEnd(e: DragEvent) {
  store.setDraggedSoldier();
  emit('drag-end', e, props.soldier);
}

</script>

<template>
  <Draggable @drag-over="dragOver" @drag-end="dragEnd" @drag-start="dragStart" @drop="() => console.log('dropped')"
    class="draggable-soldier">
    <Card class="soldier-card" :class="[
      props.target === 'list' ? 'soldier-card-list' : 'soldier-card-shift',
      store.draggedSoldier?.id === props.soldier.id ? 'being-dragged' : '',
      isAssigned ? 'assigned' : 'unassigned',
      `alert-${assignmentAlertLevel}`,
      { 'print-mode': props.isPrintMode }
    ]">
      <template #content>
        <div v-if="props.target === 'list'" class="soldier-content-list">
          <div class="soldier-header">
            <div class="soldier-name">{{ props.soldier.name }}</div>
            <!-- Past assignments statistics icon -->
            <i class="pi pi-info-circle past-assignments-icon" v-tooltip="{
              value: pastAssignmentsTooltip,
              showDelay: 300,
              hideDelay: 100,
              position: 'top',
              pt: {
                text: {
                  style: 'max-width: 350px; white-space: pre-line; text-align: right; direction: rtl; font-size: 0.75rem;'
                }
              }
            }"></i>
          </div>

          <!-- Presence status indicators -->
          <div class="presence-indicators" v-if="isReturningFromHome || isGoingHomeNextDay">
            <span v-if="isReturningFromHome" class="presence-label returning-label">חוזר</span>
            <span v-if="isGoingHomeNextDay" class="presence-label outgoing-label">יוצא למחרת</span>
          </div>

          <div class="soldier-details">
            <span class="soldier-role">{{ props.soldier.role }}</span>
            <span class="soldier-platoon">{{ props.soldier.platoon }}</span>
          </div>
          <div v-if="isAssigned" class="assignment-info">
            <span class="assignment-summary" :class="{ 'has-tooltip': assignmentTooltip }" v-tooltip="{
              value: assignmentTooltip,
              disabled: !assignmentTooltip,
              showDelay: 300,
              hideDelay: 100,
              position: 'bottom-end',
              pt: {
                text: {
                  style: 'max-width: 300px; white-space: pre-line; text-align: right; direction: rtl;'
                }
              }
            }">
              {{ assignmentSummary }}
            </span>
            <div v-if="assignmentAlertLevel !== 'none'" class="alert-indicator" v-tooltip="{
              value: alertDescription,
              showDelay: 200,
              hideDelay: 100,
              position: 'bottom',
              pt: {
                text: {
                  style: 'max-width: 250px; white-space: pre-line; text-align: right; direction: rtl; font-size: 0.75rem;'
                }
              }
            }">
              <i class="pi pi-exclamation-triangle" :class="`alert-icon-${assignmentAlertLevel}`"></i>
            </div>
          </div>
        </div>
        <div v-if="props.target === 'shift'" class="soldier-content-shift">
          <div class="soldier-name">{{ props.soldier.name }}</div>
        </div>
      </template>
    </Card>
  </Draggable>
</template>

<style scoped lang="scss">
.draggable-soldier {
  cursor: grab;
  transition: transform 0.15s ease;
  width: 100%;

  &:active {
    cursor: grabbing;
  }
}

.soldier-card {
  border-radius: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &.being-dragged {
    opacity: 0.6;
    transform: scale(0.95);
  }
}

.soldier-card-list {
  background-color: rgba(var(--primary-50), 0.5);
  border: 1px solid rgb(var(--primary-200));

  &.assigned {
    background-color: rgba(34, 197, 94, 0.1);
    border: 1px solid rgb(34, 197, 94);

    &:hover {
      background-color: rgba(34, 197, 94, 0.2);
    }
  }

  &.unassigned {
    background-color: rgba(var(--surface-50), 0.8);
    border: 1px solid rgb(var(--surface-200));

    &:hover {
      background-color: rgba(var(--surface-100), 0.9);
    }
  }
}

.soldier-card-shift {
  background-color: rgba(var(--primary-100), 0.8);
  border: 1px solid rgb(var(--primary-300));
  /* More compact styling for shift cards */
  max-height: 1.75rem;
  width: 100%;
  display: flex;
  justify-content: center;
}

/* Alert styling */
.soldier-card {
  &.alert-red {
    background-color: rgba(239, 68, 68, 0.15) !important;
    /* Red-500 with transparency */
    border: 1px solid rgb(239, 68, 68) !important;

    &:hover {
      background-color: rgba(239, 68, 68, 0.25) !important;
    }
  }

  &.alert-orange {
    background-color: rgba(249, 115, 22, 0.15) !important;
    /* Orange-500 with transparency */
    border: 1px solid rgb(249, 115, 22) !important;

    &:hover {
      background-color: rgba(249, 115, 22, 0.25) !important;
    }
  }

  &.alert-yellow {
    background-color: rgba(234, 179, 8, 0.15) !important;
    /* Yellow-500 with transparency */
    border: 1px solid rgb(234, 179, 8) !important;

    &:hover {
      background-color: rgba(234, 179, 8, 0.25) !important;
    }
  }

  &.alert-none.assigned {
    background-color: rgba(34, 197, 94, 0.1) !important;
    /* Green-500 with transparency - same as assigned */
    border: 1px solid rgb(34, 197, 94) !important;

    &:hover {
      background-color: rgba(34, 197, 94, 0.2) !important;
    }
  }
}

.soldier-content-list {
  padding: 0.25rem;
  text-align: right;
  /* RTL: Align text to the right */
}

.soldier-content-shift {
  padding: 0.1rem;
  /* Reduced padding for more compact layout */
  text-align: center;
  /* Center text for better RTL/LTR compatibility in small spaces */
  width: 100%;
  display: flex;
  justify-content: center;
}

.soldier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.soldier-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: rgb(var(--surface-900));
}

.past-assignments-icon {
  font-size: 0.8rem;
  color: rgb(var(--primary-600));
  cursor: help;
  opacity: 0.6;
  transition: all 0.2s ease;
  margin-left: 0.25rem;

  &:hover {
    opacity: 1;
    color: rgb(var(--primary-700));
    transform: scale(1.1);
  }
}

.soldier-details {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin-bottom: 0.25rem;
}

.soldier-role {
  font-size: 0.75rem;
  color: rgb(var(--surface-700));
  font-weight: 500;
}

.soldier-platoon {
  font-size: 0.6875rem;
  color: rgb(var(--surface-600));
}

.assignment-info {
  margin-top: 0.25rem;
  padding-top: 0.25rem;
  border-top: 1px solid rgba(34, 197, 94, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.25rem;
}

.assignment-summary {
  font-size: 0.6875rem;
  color: rgb(21, 128, 61);
  font-weight: 500;
  display: inline-block;
  text-align: right;

  &.has-tooltip {
    cursor: help;
    text-decoration: underline;
    text-decoration-style: dotted;
    text-underline-offset: 2px;
  }
}

.alert-indicator {
  display: inline-flex;
  align-items: center;
  margin-right: 0.5rem;
  cursor: help;
}

.alert-icon-red {
  color: rgb(239, 68, 68);
  font-size: 0.75rem;
  animation: pulse 2s infinite;
}

.alert-icon-orange {
  color: rgb(249, 115, 22);
  font-size: 0.75rem;
}

.alert-icon-yellow {
  color: rgb(234, 179, 8);
  font-size: 0.75rem;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

/* Make shift soldier name smaller */
.soldier-content-shift .soldier-name {
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Improve PrimeVue Card styling */
:deep(.p-card) {
  box-shadow: none;
}

:deep(.p-card-body) {
  padding: 0.5rem;
}

:deep(.p-card-content) {
  padding: 0;
}

/* Compact styling for shift cards */
.soldier-card-shift {
  :deep(.p-card-body) {
    padding: 0.25rem;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .soldier-content-list {
    padding: 0.15rem;
  }

  .soldier-name {
    font-size: 0.8rem;
  }

  .soldier-details {
    font-size: 0.7rem;
  }

  .soldier-content-shift .soldier-name {
    font-size: 0.7rem;
  }

  .assignment-badge {
    font-size: 0.5rem;
    padding: 0.1rem 0.25rem;
  }

  .assignment-summary {
    font-size: 0.625rem;
  }
}

/* RTL comment: Added text alignment for RTL support */
/* Layout comment: Made shift cards more compact with smaller text and reduced padding */
/* Assignment styling: Added visual indicators for assigned soldiers with green theme */

.drag-hover-target {
  background-color: rgba(var(--primary-500), 0.1);
  border: 2px solid rgb(var(--primary-500));
}

/* Presence status indicators styling */
.presence-indicators {
  display: flex;
  gap: 0.25rem;
  margin: 0.25rem 0;
  flex-wrap: wrap;
  justify-content: flex-end;
  /* RTL: Align to the right */
}

.presence-label {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  color: white;
  text-align: center;
  white-space: nowrap;
}

.returning-label {
  background-color: rgb(34, 197, 94);
  /* Green-500 for returning */
  border: 1px solid rgb(21, 128, 61);
  /* Green-700 */
}

.outgoing-label {
  background-color: rgb(249, 115, 22);
  /* Orange-500 for outgoing */
  border: 1px solid rgb(194, 65, 12);
  /* Orange-700 */
}

/* Print mode styles */
.soldier-card.print-mode {
  background-color: #ffffff !important;
  border: 1.5px solid #333333 !important;
  /* Slightly thicker border */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
  /* Subtle shadow */

  &:hover {
    background-color: #ffffff !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
    transform: none !important;
  }

  &.assigned,
  &.unassigned,
  &.alert-red,
  &.alert-orange,
  &.alert-yellow,
  &.alert-none {
    background-color: #ffffff !important;
    border: 1.5px solid #333333 !important;

    &:hover {
      background-color: #ffffff !important;
    }
  }

  .soldier-name {
    color: #000000 !important;
    font-weight: 700 !important;
    /* Bolder for better readability */
  }

  .soldier-role,
  .soldier-platoon {
    color: #333333 !important;
    /* Slightly lighter than pure black */
  }

  .assignment-info {
    border-top: 1px solid #666666 !important;
    background-color: #f8f9fa !important;
    /* Light gray background for assignment area */
    padding: 0.25rem !important;
    margin: 0.25rem -0.25rem -0.25rem -0.25rem !important;
    /* Extend to card edges */
    border-radius: 0 0 4px 4px !important;
  }

  .assignment-summary {
    color: #000000 !important;
    text-decoration: none !important;
    font-weight: 600 !important;
  }

  .past-assignments-icon {
    color: #666666 !important;

    &:hover {
      color: #333333 !important;
    }
  }

  .presence-label {
    background-color: #f1f3f4 !important;
    color: #000000 !important;
    border: 1px solid #666666 !important;
    font-weight: 600 !important;
  }

  .returning-label,
  .outgoing-label {
    background-color: #f1f3f4 !important;
    color: #000000 !important;
    border: 1px solid #666666 !important;
  }

  .alert-icon-red,
  .alert-icon-orange,
  .alert-icon-yellow {
    color: #333333 !important;
    animation: none !important;
  }
}
</style>
