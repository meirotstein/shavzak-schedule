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
  isPrintMode?: boolean;
}>();

const overSoldierId = ref<string | undefined>();

const emit = defineEmits<{
  'drag-enter': [spotIndex: number, soldierId: string | undefined]
  'drag-leave': [spotIndex: number, soldierId: string | undefined]
  'drop': [spotIndex: number, soldierId: string]
  'remove': [spotIndex: number]
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

function removeSoldier() {
  console.log('remove soldier from spot', props.spotIndex);
  emit('remove', props.spotIndex);
}

</script>

<template>
  <DropZone v-if="!props.isPrintMode || props.assignment.soldier" @drag-enter="dragEnter" @drag-leave="dragLeave"
    @drop="drop" :isEmpty="!props.assignment.soldier" :enabled="!props.isPrintMode" class="shift-drop-zone"
    :class="{ 'drop-zone-active': overSoldierId, 'print-mode': props.isPrintMode }">
    <div v-if="props.assignment.soldier" class="soldier-with-remove">
      <SoldierCard :soldier="props.assignment.soldier" target="shift" :is-print-mode="props.isPrintMode" />
      <button @click="removeSoldier" class="remove-button" type="button" title="הסר" v-if="!props.isPrintMode">
        <span
          style="font-size: 14px; font-weight: bold; line-height: 1; color: #000000; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">×</span>
      </button>
    </div>
    <div class="spot-empty" v-else :class="{ 'spot-empty-hover': overSoldierId }" role="button" tabindex="0"
      aria-label="Empty shift spot for role: {{ props.assignment.roles[0] }}">
      <div class="role-badge">{{ props.assignment.roles[0] }}</div>
    </div>
  </DropZone>
</template>

<style scoped lang="scss">
.shift-drop-zone {
  width: 100%;
  height: 100%;
  transition: all 0.2s ease;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;

  &.drop-zone-active {
    background-color: rgba(var(--primary-100), 0.4);
    box-shadow: 0 0 0 2px rgb(var(--primary-400));
  }

  /* Print media query - clean default styling */
  @media print {
    border: 1px solid #9ca3af !important;
    /* Light gray border for print */
    border-radius: 6px !important;
    background-color: #ffffff !important;
    box-shadow: none !important;
    /* Remove shadow for print */
  }
}

.spot-empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 1.75rem;
  /* Reduced height for more compact layout */
  border: 1px dashed rgb(var(--surface-400));
  border-radius: 6px;
  background-color: rgba(var(--surface-100), 0.5);
  padding: 0.25rem;
  /* Reduced padding for more compact layout */
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
  font-size: 0.7rem;
  /* Smaller font for compact layout */
  font-weight: 600;
  color: rgb(var(--primary-700));
  background-color: rgba(var(--primary-100), 0.7);
  padding: 0.1rem 0.4rem;
  /* Reduced padding for compact layout */
  border-radius: 1rem;
  margin-bottom: 0.15rem;
  /* Reduced margin for compact layout */
  border: 1px solid rgb(var(--primary-200));
  text-align: center;
  /* Ensure text is centered for RTL/LTR compatibility */
}

.drop-hint {
  font-size: 0.65rem;
  /* Smaller font for compact layout */
  color: rgb(var(--primary-600));
  margin-top: 0.15rem;
  /* Reduced margin for compact layout */
  font-style: italic;
  animation: pulse 1.5s infinite;
  text-align: center;
  /* Ensure text is centered for RTL/LTR compatibility */
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

/* Print mode styles */
.shift-drop-zone.print-mode {
  border: 2px solid #228B22 !important;
  /* Add nice green border to drop zone itself */
  border-radius: 4px !important;

  &.drop-zone-active {
    background-color: #ffffff !important;
    box-shadow: 0 2px 6px rgba(34, 139, 34, 0.2) !important;
    /* Add green-tinted shadow for active state */
    border: 3px solid #228B22 !important;
    /* Thicker green border when active */
  }

  .spot-empty {
    border: 3px dashed #228B22 !important;
    /* Much thicker, nice green dashed border */
    background-color: #fafafa !important;
    /* Very light gray background */

    &:hover {
      border-color: #228B22 !important;
      background-color: #f5f5f5 !important;
    }

    &.spot-empty-hover {
      border: 4px dashed #228B22 !important;
      /* Very thick green border when hovering */
      background-color: #f0f0f0 !important;
      transform: none !important;
    }
  }

  .role-badge {
    color: #000000 !important;
    background-color: #f1f3f4 !important;
    /* Light gray background */
    border: 1px solid #666666 !important;
    font-weight: 600 !important;
  }
}

.soldier-with-remove {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.remove-button {
  position: absolute;
  top: calc(50% - 4px);
  left: 6px;
  /* Position on the left side, middle */
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: rgb(var(--red-500));
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: rgb(var(--red-600));
    transform: translateY(-50%) scale(1.1);
  }

  &:focus {
    outline: 2px solid rgb(var(--red-400));
    outline-offset: 1px;
  }
}

.soldier-with-remove:hover .remove-button,
.remove-button:focus {
  opacity: 1;
}
</style>
