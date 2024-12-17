<script setup lang="ts">
import DatePicker from "primevue/datepicker";
import { ref, watch } from "vue";
import { useGAPIStore } from "../store/gapi";
import { useScheduleStore } from "../store/schedule";

const gapi = useGAPIStore();
const scheduleStore = useScheduleStore();
const selectedDate = ref();

watch(selectedDate, (newValue) => {
  scheduleStore.setScheduleDate(newValue);
});

</script>
o
<template>
  <div class="card flex flex-wrap gap-4" dir="ltr">
    <div class="flex-auto">
      <DatePicker v-model="selectedDate" :minDate="gapi.presence?.start" :maxDate="gapi.presence?.end" showIcon fluid
        :showOnFocus="false" inputId="selectedDate" :pt="{
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
