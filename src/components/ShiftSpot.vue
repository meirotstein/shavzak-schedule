<script setup lang="ts">
import { Soldier } from "../model/soldier";
import { useSoldiersStore } from "../store/soldiers";
import DropZone from "./dragndrop/DropZone.vue";
import SoldierCard from "./SoldierCard.vue";

const store = useSoldiersStore();

const props = defineProps<{
  soldier?: Soldier;
}>();

const emit = defineEmits<{
  'drag-enter': [event: DragEvent, soldier?: Soldier]
  'drag-leave': [event: DragEvent, soldier?: Soldier]
}>()

function dragEnter(e: DragEvent) {
  emit('drag-enter', e, store.draggedSoldier);
}

function dragLeave(e: DragEvent) {
  emit('drag-leave', e, store.draggedSoldier);
}

</script>

<template>
  <DropZone @drag-enter="dragEnter" @drag-leave="dragLeave">
    <SoldierCard v-if="props.soldier" :soldier="props.soldier" />
    <span v-else>[+]</span>
    {{ store.draggedSoldier ?? 'nada' }}
  </DropZone>
</template>

<style scoped></style>
