<script setup lang="ts">
import Card from "primevue/card";
import { ISoldier } from "../model/soldier";
import { useSoldiersStore } from "../store/soldiers";
import Draggable from "./dragndrop/Draggable.vue";

const store = useSoldiersStore();

const props = defineProps<{
  soldier: ISoldier;
}>();

const emit = defineEmits<{
  'drag-start': [event: DragEvent, soldier: ISoldier]
  'drag-end': [event: DragEvent, soldier: ISoldier]
  'drag-over': [event: DragEvent, soldier: ISoldier]
}>()

function dragOver(e: DragEvent) {
  emit('drag-over', e, props.soldier);
}

function dragStart(e: DragEvent) {
  store.setDraggedSoldier(props.soldier);
  emit('drag-start', e, props.soldier);
}
function dragEnd(e: DragEvent) {
  store.setDraggedSoldier();
  emit('drag-end', e, props.soldier);
}

</script>

<template>
  <Draggable @drag-over="dragOver" @drag-end="dragEnd" @drag-start="dragStart" @drop="() => console.log('dropped')">
    <Card class="soldier-card">
      <!-- <template #title>{{ props.soldier.name }}</template> -->
      <template #content #item="{ option }">
        <p class="text-xs">
          {{ props.soldier.name }}
        </p>
        <!-- <p class="m-1">
          {{ props.soldier.role }}
        </p> -->
      </template>
    </Card>
  </Draggable>
</template>

<style scoped>
.soldier-card {
  border-radius: 2px;
}
</style>
