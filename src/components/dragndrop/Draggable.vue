<script setup lang="ts">
const emit = defineEmits<{
  'drag-start': [event: DragEvent]
  'drag-end': [event: DragEvent]
  'drag-over': [event: DragEvent]
}>()

</script>

<template>
  <div draggable="true" class="draggable" @dragstart="(e) => $emit('drag-start', e)"
    @dragend="(e) => $emit('drag-end', e)" @dragover="(e) => $emit('drag-over', e)">
    <slot>
      Drag me!
    </slot>
  </div>
</template>

<style scoped>
.draggable {
  width: 100%;
  cursor: move;
}
</style>