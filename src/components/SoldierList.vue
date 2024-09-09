<script setup lang="ts">
import { ref } from "vue";
import Listbox from 'primevue/listbox';
import draggable from 'vuedraggable';
import Card from "primevue/card";
import { useSoldiersStore } from "../store/soldiers";

const { soldiers } = useSoldiersStore();
const drag = ref(false);

</script>

<template>
  <draggable v-model="soldiers" group="people" @start="drag = true" @end="drag = false" item-key="id">
    <template #item="{ element }">
      <Card class="cursor-pointer">
        <template #title>{{ element.name }}</template>
        <template #content #item="{ element }">
          <p class="m-0">
            {{ element.role }}
          </p>
        </template>
      </Card>
    </template>
  </draggable>
</template>

<style scoped>
</style>
