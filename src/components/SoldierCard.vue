<script setup lang="ts">
import Card from "primevue/card";
import { SoldierModel } from "../model/soldier";
import { useSoldiersStore } from "../store/soldiers";
import Draggable from "./dragndrop/Draggable.vue";

const store = useSoldiersStore();

const props = defineProps<{
  soldier: SoldierModel;
}>();

const emit = defineEmits<{
  'drag-start': [event: DragEvent, soldier: SoldierModel]
  'drag-end': [event: DragEvent, soldier: SoldierModel]
  'drag-over': [event: DragEvent, soldier: SoldierModel]
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
    <Card>
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
