<script setup lang="ts">
import Card from "primevue/card";
import { Soldier } from "../model/soldier";
import Draggable from "./dragndrop/Draggable.vue";


const props = defineProps<{
  soldier: Soldier;
}>();

const emit = defineEmits<{
  'drag-start': [soldier: Soldier, event: DragEvent]
  'drag-end': [soldier: Soldier, event: DragEvent]
  'drag-over': [soldier: Soldier, event: DragEvent]
}>()

function dragOver(e: DragEvent) {
  emit('drag-over', props.soldier, e);
}

function dragStart(e: DragEvent) {
  emit('drag-start', props.soldier, e);
}
function dragEnd(e: DragEvent) {
  emit('drag-end', props.soldier, e);
}

</script>

<template>
  <Draggable @drag-over="dragOver" @drag-end="dragEnd" @drag-start="dragStart">
    <Card class="cursor-move" draggable="true">
      <template #title>{{ props.soldier.name }}</template>
      <template #content #item="{ option }">
        <p class="m-0">
          {{ props.soldier.role }}
        </p>
      </template>
    </Card>
  </Draggable>
</template>

<style scoped></style>
