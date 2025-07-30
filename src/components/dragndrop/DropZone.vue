<script setup lang="ts">
import { reactive } from 'vue';

const props = withDefaults(defineProps<{
  isEmpty: boolean;
  enabled?: boolean;
}>(), {
  isEmpty: true,
  enabled: true,
});

const state = reactive({
  isOver: false,
  isEntered: false,
});

const emit = defineEmits<{
  'drag-enter': [event: DragEvent]
  'drag-leave': [event: DragEvent]
  'drop': [event: DragEvent]
}>()

function drop(e: DragEvent) {
  if (!props.enabled) return;
  e.preventDefault();
  state.isOver = false;
  emit('drop', e);
}

function dragEnter(e: DragEvent) {
  if (!props.enabled) return;
  e.preventDefault();

  if (!state.isEntered) {
    state.isEntered = true;
    emit('drag-enter', e);
  }
}

async function emitLeaveIfNotOver(e: DragEvent) {
  setTimeout(() => {
    if (!state.isOver) {
      state.isEntered = false;
      state.isOver = false;
      emit('drag-leave', e);
    }
  }, 10);
}

function dragLeave(e: DragEvent) {
  if (!props.enabled) return;
  e.preventDefault();
  state.isOver = false;
  emitLeaveIfNotOver(e);
}

function dragOver(e: DragEvent) {
  if (!props.enabled) return;
  e.preventDefault();
  state.isOver = true;
}

</script>

<template>
  <div :class="[
    'dropzone',
    props.isEmpty ? 'empty' : 'occupied',
    { 'over': state.isOver && props.enabled, 'entered': state.isEntered && props.enabled, 'drop-disabled': !props.enabled }
  ]" @drop="drop" @dragenter="dragEnter" @dragleave="dragLeave" @dragover="dragOver"
    :role="props.enabled ? 'region' : 'presentation'" :aria-dropeffect="props.enabled ? 'move' : 'none'">
    <div class="dropzone-content">
      <slot>
        <div class="default-drop-message">
          <i class="pi pi-download drop-icon"></i>
          <span>Drop here!</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dropzone {
  text-align: center;
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  transition: all 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 6px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 1;
  }
}

.dropzone-content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  >* {
    width: 100%;
    height: 100%;
  }
}

.over {
  transform: scale(1.02);

  &::before {
    opacity: 1;
    box-shadow: 0 0 0 2px rgb(var(--primary-500)), 0 0 8px rgba(var(--primary-500), 0.4);
  }

  &.empty {
    background-color: rgba(var(--primary-50), 0.5);
    border-color: rgb(var(--primary-400));
    border-style: dashed;
  }

  &.occupied {
    background-color: rgba(var(--primary-50), 0.2);
  }
}

.entered {
  &.empty {
    background-color: rgba(var(--primary-50), 0.3);
    border-color: rgb(var(--primary-300));
  }
}

.empty {
  border: 2px dashed rgb(var(--surface-300));
  background-color: rgba(var(--surface-50), 0.5);
  min-height: 2rem;

  &:hover {
    border-color: rgb(var(--primary-300));
    background-color: rgba(var(--primary-50), 0.2);
  }
}

.occupied {
  border: 1px solid transparent;
}

.default-drop-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 1rem;
  color: rgb(var(--surface-500));
  font-size: 0.875rem;

  .drop-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: rgb(var(--primary-400));
  }
}

/* Disable drop functionality when disabled */
.drop-disabled {
  pointer-events: none !important;

  &.empty:hover {
    border-color: rgb(var(--surface-300)) !important;
    background-color: rgba(var(--surface-50), 0.5) !important;
  }
}
</style>