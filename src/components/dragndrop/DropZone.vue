<script setup lang="ts">
const emit = defineEmits<{
  'drag-enter': [event: DragEvent]
  'drag-leave': [event: DragEvent]
  'drop': [event: DragEvent]
}>()

function drop(e: DragEvent) {
  e.preventDefault();
  emit('drop', e);
}

function dragEnter(e: DragEvent) {
  e.preventDefault();
  emit('drag-enter', e);
}

function dragLeave(e: DragEvent) {
  e.preventDefault();
  if (e.currentTarget && e.target && !Array.from((e.currentTarget as HTMLElement).childNodes).includes(e.target as HTMLElement)) {
    emit('drag-leave', e);
  }
}

function dragOver(e: DragEvent) {
  e.preventDefault();
}
</script>

<template>
  <div class="dropzone" @drop="drop" @dragenter="dragEnter" @dragleave="dragLeave" @dragover="dragOver">
    <slot>
      Drop here!
    </slot>
  </div>
</template>

<style scoped></style>