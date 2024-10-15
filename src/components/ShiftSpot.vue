<script setup lang="ts">
import { ref } from "vue";
import { ISoldier } from "../model/soldier";
import { useSoldiersStore } from "../store/soldiers";
import DropZone from "./dragndrop/DropZone.vue";
import SoldierCard from "./SoldierCard.vue";

const store = useSoldiersStore();

const props = defineProps<{
  spotIndex: number;
  soldier?: ISoldier;
}>();

const overSoldierId = ref<string | undefined>();

const emit = defineEmits<{
  'drag-enter': [spotIndex: number, soldierId: string | undefined]
  'drag-leave': [spotIndex: number, soldierId: string | undefined]
  'drop': [spotIndex: number, soldierId: string]
}>()

function dragEnter() {
  overSoldierId.value = store.draggedSoldier?.id;
  console.log('enter on spot', overSoldierId.value);
  emit('drag-enter', props.spotIndex, overSoldierId.value);
}

function dragLeave() {
  console.log('leave on spot', overSoldierId.value);
  emit('drag-leave', props.spotIndex, overSoldierId.value);
  overSoldierId.value = undefined;
}

function drop() {
  console.log('dropped on spot', overSoldierId.value);
  emit('drop', props.spotIndex, overSoldierId.value!);
}

</script>

<template>
  <DropZone @drag-enter="dragEnter" @drag-leave="dragLeave" @drop="drop">
    <SoldierCard v-if="props.soldier" :soldier="props.soldier" />
    <div class="spot-empty" v-else>
      <span>[+]</span>
    </div>
  </DropZone>
</template>

<style scoped>
.spot-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  border: 1px dashed #ccc;
}
</style>
