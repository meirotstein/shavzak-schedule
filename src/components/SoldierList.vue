<script setup lang="ts">
import { ref } from "vue";
import Listbox from 'primevue/listbox';
import draggable from 'vuedraggable';
import Card from "primevue/card";

const products = ref([
  {
    name: 'משה אופניק',
    role: 'קצין'
  },
  {
    name: 'בוב ספוג',
    role: 'לוחם'
  },
  {
    name: 'ג׳ורג קונסטנזה',
    role: 'לוחם'
  }
]);

const drag = ref(false);

const selectedProduct = ref<any>();
</script>

<template>
  <span>{{ drag }}</span>
  <draggable v-model="products" group="people" @start="drag = true" @end="drag = false" item-key="id">
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
