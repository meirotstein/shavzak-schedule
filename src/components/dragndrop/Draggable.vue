<script setup lang="ts">
const emit = defineEmits<{
  'drag-start': [event: DragEvent]
  'drag-end': [event: DragEvent]
  'drag-over': [event: DragEvent]
}>()

// Keyboard accessibility functions
function handleKeyboardDrag(e: KeyboardEvent) {
  // Simulate dragstart for keyboard users
  const dragEvent = new DragEvent('dragstart');
  emit('drag-start', dragEvent);
  (e.target as HTMLElement).setAttribute('aria-grabbed', 'true');
}

function handleKeyboardDragEnd(e: KeyboardEvent) {
  // Simulate dragend for keyboard users
  const dragEvent = new DragEvent('dragend');
  emit('drag-end', dragEvent);
  (e.target as HTMLElement).setAttribute('aria-grabbed', 'false');
}
</script>

<template>
  <div
    draggable="true"
    class="draggable"
    @dragstart="(e: DragEvent) => emit('drag-start', e)"
    @dragend="(e: DragEvent) => emit('drag-end', e)"
    @dragover="(e: DragEvent) => emit('drag-over', e)"
    role="button"
    aria-grabbed="false"
    tabindex="0"
    @keydown.space.prevent="(e: KeyboardEvent) => handleKeyboardDrag(e)"
    @keyup.space.prevent="(e: KeyboardEvent) => handleKeyboardDragEnd(e)"
  >
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
</style>