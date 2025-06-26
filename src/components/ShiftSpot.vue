<script setup lang="ts">
import { ref } from "vue";
import { Assignment } from "../model/shift";
import { useSoldiersStore } from "../store/soldiers";
import DropZone from "./dragndrop/DropZone.vue";
import SoldierCard from "./SoldierCard.vue";

const store = useSoldiersStore();

const props = defineProps<{
  spotIndex: number;
  assignment: Assignment;
}>();

const overSoldierId = ref<string | undefined>();

const emit = defineEmits<{
  'drag-enter': [spotIndex: number, soldierId: string | undefined]
  'drag-leave': [spotIndex: number, soldierId: string | undefined]
  'drop': [spotIndex: number, soldierId: string]
}>()

function dragEnter() {
  overSoldierId.value = store.draggedSoldier?.id;
  console.log('enter on spot', overSoldierId.value);
  emit('drag-enter', props.spotIndex, overSoldierId.value);
}

function dragLeave() {
  console.log('leave on spot', overSoldierId.value);
  emit('drag-leave', props.spotIndex, overSoldierId.value);
  overSoldierId.value = undefined;
}

function drop() {
  console.log('dropped on spot', overSoldierId.value);
  emit('drop', props.spotIndex, overSoldierId.value!);
}

</script>

<template>
  <DropZone
    @drag-enter="dragEnter"
    @drag-leave="dragLeave"
    @drop="drop"
    :isEmpty="!props.assignment.soldier"
    class="shift-drop-zone"
    :class="{ 'drop-zone-active': overSoldierId }"
  >
    <SoldierCard
      v-if="props.assignment.soldier"
      :soldier="props.assignment.soldier"
      target="shift"
    />
    <div
      class="spot-empty"
      v-else
      :class="{ 'spot-empty-hover': overSoldierId }"
      role="button"
      tabindex="0"
      aria-label="Empty shift spot for role: {{ props.assignment.roles[0] }}"
    >
      <div class="role-badge">{{ props.assignment.roles[0] }}</div>
      <div class="drop-hint" v-if="overSoldierId">שחרר כאן</div> <!-- RTL: Changed to Hebrew "Drop here" -->
    </div>
  </DropZone>
</template>

<style scoped lang="scss">
.shift-drop-zone {
  width: 100%;
  height: 100%;
  transition: all 0.2s ease;
  border-radius: 6px;
  
  &.drop-zone-active {
    background-color: rgba(var(--primary-100), 0.4);
    box-shadow: 0 0 0 2px rgb(var(--primary-400));
  }
}

.spot-empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 1.75rem; /* Reduced height for more compact layout */
  border: 1px dashed rgb(var(--surface-400));
  border-radius: 6px;
  background-color: rgba(var(--surface-100), 0.5);
  padding: 0.25rem; /* Reduced padding for more compact layout */
  transition: all 0.2s ease;
  
  &:hover {
    border-color: rgb(var(--primary-400));
    background-color: rgba(var(--primary-50), 0.3);
  }
  
  &.spot-empty-hover {
    border: 2px dashed rgb(var(--primary-500));
    background-color: rgba(var(--primary-100), 0.4);
    transform: scale(1.02);
  }
}

.role-badge {
  font-size: 0.7rem; /* Smaller font for compact layout */
  font-weight: 600;
  color: rgb(var(--primary-700));
  background-color: rgba(var(--primary-100), 0.7);
  padding: 0.1rem 0.4rem; /* Reduced padding for compact layout */
  border-radius: 1rem;
  margin-bottom: 0.15rem; /* Reduced margin for compact layout */
  border: 1px solid rgb(var(--primary-200));
  text-align: center; /* Ensure text is centered for RTL/LTR compatibility */
}

.drop-hint {
  font-size: 0.65rem; /* Smaller font for compact layout */
  color: rgb(var(--primary-600));
  margin-top: 0.15rem; /* Reduced margin for compact layout */
  font-style: italic;
  animation: pulse 1.5s infinite;
  text-align: center; /* Ensure text is centered for RTL/LTR compatibility */
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .spot-empty {
    min-height: 1.5rem;
    padding: 0.15rem;
  }
  
  .role-badge {
    font-size: 0.65rem;
    padding: 0.05rem 0.3rem;
  }
  
  .drop-hint {
    font-size: 0.6rem;
  }
}

/* RTL comment: Added text-align center to ensure proper text alignment in both RTL and LTR contexts */
/* Layout comment: Reduced sizes and spacing for more compact layout to fit within shift boundaries */
</style>
