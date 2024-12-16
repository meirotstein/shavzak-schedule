<script setup lang="ts">
import DatePicker from "primevue/datepicker";
import { ref } from "vue";

const selectedDate = ref();

</script>
o
<template>
  <div class="card flex flex-wrap gap-4" dir="ltr">
    <div class="flex-auto">
      <DatePicker v-model="selectedDate" showIcon fluid :showOnFocus="false" inputId="selectedDate" :pt="{
        pcPrevButton: {
          root: 'datepicker-btn-rtl'
        },
        pcNextButton: {
          root: 'datepicker-btn-rtl'
        }
      }" />
    </div>
  </div>
</template>

<style scoped></style>
