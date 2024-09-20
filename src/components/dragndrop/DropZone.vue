<script setup lang="ts">
import { reactive } from 'vue';

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
  e.preventDefault();
  emit('drop', e);
}

function dragEnter(e: DragEvent) {
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
  e.preventDefault();
  state.isOver = false;
  emitLeaveIfNotOver(e);
}

function dragOver(e: DragEvent) {
  e.preventDefault();
  state.isOver = true;
}

</script>

<template>
  <div class="dropzone" @drop="drop" @dragenter="dragEnter" @dragleave="dragLeave" @dragover="dragOver">
    <slot>
      Drop here!
    </slot>
  </div>
</template>

<style scoped>
.dropzone {
  border: 2px dashed #ccc;
  padding: 5px;
  text-align: center;
}
</style>