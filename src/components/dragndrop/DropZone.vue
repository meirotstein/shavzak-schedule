<script setup lang="ts">
const emit = defineEmits<{
  'drag-enter': [event: DragEvent]
  'drag-leave': [event: DragEvent]
}>()
</script>

<template>
  <div @dragenter="(e) => $emit('drag-enter', e)" @dragleave="(e) => $emit('drag-leave', e)">
    <slot>
      Drop here!
    </slot>
  </div>
</template>

<style scoped></style>