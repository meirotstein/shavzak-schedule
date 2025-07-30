<script setup lang="ts">
const props = withDefaults(defineProps<{
  enabled?: boolean;
}>(), {
  enabled: true,
});

const emit = defineEmits<{
  'drag-start': [event: DragEvent]
  'drag-end': [event: DragEvent]
  'drag-over': [event: DragEvent]
}>()

// Event handler functions
function handleDragStart(e: DragEvent) {
  if (!props.enabled) return;
  emit('drag-start', e);
}

function handleDragEnd(e: DragEvent) {
  if (!props.enabled) return;
  emit('drag-end', e);
}

function handleDragOver(e: DragEvent) {
  if (!props.enabled) return;
  emit('drag-over', e);
}

// Keyboard accessibility functions
function handleKeyboardDrag(e: KeyboardEvent) {
  if (!props.enabled) return;
  // Simulate dragstart for keyboard users
  const dragEvent = new DragEvent('dragstart');
  emit('drag-start', dragEvent);
  (e.target as HTMLElement).setAttribute('aria-grabbed', 'true');
}

function handleKeyboardDragEnd(e: KeyboardEvent) {
  if (!props.enabled) return;
  // Simulate dragend for keyboard users
  const dragEvent = new DragEvent('dragend');
  emit('drag-end', dragEvent);
  (e.target as HTMLElement).setAttribute('aria-grabbed', 'false');
}
</script>

<template>
  <div :draggable="enabled" class="draggable" :class="{ 'drag-disabled': !enabled }" @dragstart="handleDragStart"
    @dragend="handleDragEnd" @dragover="handleDragOver" :role="enabled ? 'button' : 'presentation'" aria-grabbed="false"
    :tabindex="enabled ? 0 : -1" @keydown.space.prevent="handleKeyboardDrag"
    @keyup.space.prevent="handleKeyboardDragEnd">
    <div class="draggable-content">
      <slot>
        <div class="default-drag-content">
          <i class="pi pi-arrows-alt drag-icon"></i>
          <span>Drag me!</span>
        </div>
      </slot>
    </div>
  </div>
</template>


<style scoped lang="scss">
.draggable {
  width: 100%;
  height: 100%;
  cursor: grab;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active {
    cursor: grabbing;
    transform: scale(0.98);
  }

  &:hover {
    z-index: 10;
  }

  &:focus {
    outline: 2px solid rgb(var(--primary-400));
    outline-offset: 2px;
  }

  &[aria-grabbed="true"] {
    opacity: 0.7;
    transform: scale(0.95);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
}

.draggable-content {
  width: 100%;
  height: 100%;
}

.default-drag-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgb(var(--surface-50));
  border: 1px solid rgb(var(--surface-200));
  border-radius: 6px;

  .drag-icon {
    font-size: 1.25rem;
    color: rgb(var(--primary-500));
    margin-bottom: 0.5rem;
  }
}

/* Add visual cues for drag handle */
.draggable::before {
  content: '⋮⋮';
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  font-size: 0.75rem;
  color: rgb(var(--surface-400));
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.draggable:hover::before {
  opacity: 1;
}

/* Disable drag functionality when disabled */
.drag-disabled {
  cursor: default !important;

  &:active {
    cursor: default !important;
    transform: none !important;
  }

  &:hover {
    z-index: initial !important;
  }

  &::before {
    display: none !important;
  }
}
</style>