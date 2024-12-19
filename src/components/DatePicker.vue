<script setup lang="ts">
import { format, isValid, parse } from "date-fns";
import DatePicker from "primevue/datepicker";
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGAPIStore } from "../store/gapi";
import { useScheduleStore } from "../store/schedule";

const route = useRoute();
const router = useRouter();
const gapi = useGAPIStore();
const scheduleStore = useScheduleStore();

const currentDate = computed({
  get: () => scheduleStore.scheduleDate,
  set: (value: Date) => scheduleStore.setScheduleDate(value),
});

if (route.query.date) {
  handleDateInQuery(route.query.date as string);
}

// watch manual query changes
watch(() => route.query, (newQuery) => {
  if (!newQuery.date) return;
  handleDateInQuery(newQuery.date as string);
});

// watch date picker changes
watch(() => currentDate.value, (newDate) => {
  if (!newDate) return;
  router.replace({ query: { date: format(newDate, "yyyy-MM-dd") } });
});

function handleDateInQuery(dateStr: string) {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  if (isValid(date)) {
    currentDate.value = date;
  }
}


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
