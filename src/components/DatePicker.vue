<script setup lang="ts">
import DatePicker from "primevue/datepicker";
import { useGAPIStore } from "../store/gapi";
import { useScheduleStore } from "../store/schedule";
import { computed } from "vue";

const gapi = useGAPIStore();
const scheduleStore = useScheduleStore();

const currentDate = computed({
  get: () => scheduleStore.scheduleDate,
  set: (value: Date) => scheduleStore.setScheduleDate(value),
});

</script>

<template>
  <div class="card flex flex-wrap gap-4" dir="ltr">
    <div class="flex-auto">
      <DatePicker v-model="currentDate" :minDate="gapi.presence?.start" :maxDate="gapi.presence?.end" showIcon fluid
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
