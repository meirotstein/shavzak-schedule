<script setup lang="ts">
import Card from "primevue/card";
import { onMounted, ref } from "vue";
import draggable from 'vuedraggable';
import { useSoldiersStore } from "../store/soldiers";

const { soldiers, fetchSoldiers } = useSoldiersStore();
const drag = ref(false);

onMounted(() => {
  fetchSoldiers();
});

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

<style scoped></style>
