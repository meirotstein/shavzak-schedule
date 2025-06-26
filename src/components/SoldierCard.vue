<script setup lang="ts">
import Card from "primevue/card";
import { ISoldier } from "../model/soldier";
import { useSoldiersStore } from "../store/soldiers";
import Draggable from "./dragndrop/Draggable.vue";

const store = useSoldiersStore();

const props = defineProps<{
  soldier: ISoldier;
  target: 'list' | 'shift';
}>();

const emit = defineEmits<{
  'drag-start': [event: DragEvent, soldier: ISoldier]
  'drag-end': [event: DragEvent, soldier: ISoldier]
  'drag-over': [event: DragEvent, soldier: ISoldier]
}>()

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
  <Draggable
    @drag-over="dragOver"
    @drag-end="dragEnd"
    @drag-start="dragStart"
    @drop="() => console.log('dropped')"
    class="draggable-soldier"
  >
    <Card class="soldier-card" :class="[
      props.target === 'list' ? 'soldier-card-list' : 'soldier-card-shift',
      store.draggedSoldier?.id === props.soldier.id ? 'being-dragged' : ''
    ]">
      <template #content #item="{ option }">
        <div v-if="props.target === 'list'" class="soldier-content-list">
          <div class="soldier-name">{{ props.soldier.name }}</div>
          <div class="soldier-details">
            <span class="soldier-role">{{ props.soldier.role }}</span>
            <span class="soldier-platoon">{{ props.soldier.platoon }}</span>
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
}

.soldier-card-shift {
  background-color: rgba(var(--primary-100), 0.8);
  border: 1px solid rgb(var(--primary-300));
  /* More compact styling for shift cards */
  max-height: 1.75rem;
}

.soldier-content-list {
  padding: 0.25rem;
  text-align: right; /* RTL: Align text to the right */
}

.soldier-content-shift {
  padding: 0.1rem; /* Reduced padding for more compact layout */
  text-align: center; /* Center text for better RTL/LTR compatibility in small spaces */
}

.soldier-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: rgb(var(--surface-900));
}

/* Make shift soldier name smaller */
.soldier-content-shift .soldier-name {
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.soldier-details {
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
  font-size: 0.75rem;
}

.soldier-role {
  color: rgb(var(--primary-700));
  font-weight: 500;
}

.soldier-platoon {
  color: rgb(var(--surface-600));
  font-style: italic;
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
}

/* RTL comment: Added text alignment for RTL support */
/* Layout comment: Made shift cards more compact with smaller text and reduced padding */
</style>
