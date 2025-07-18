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
  <div class="date-picker-wrapper">
    <DatePicker v-model="currentDate" :minDate="gapi.presence?.start" :maxDate="gapi.presence?.end" showIcon fluid
      :showOnFocus="false" inputId="selectedDate" :pt="{
        root: { class: 'w-full' },
        input: { class: 'date-input' },
        panel: { class: 'date-panel' },
        pcPrevButton: {
          root: 'datepicker-btn-rtl'
        },
        pcNextButton: {
          root: 'datepicker-btn-rtl'
        },
        header: { class: 'date-header' },
        footer: { class: 'date-footer' },
        today: { class: 'date-today-btn' },
        clear: { class: 'date-clear-btn' }
      }" />

  </div>
</template>


<style scoped lang="scss">
.date-picker-container {
  background-color: rgb(var(--surface-50));
  border-radius: 8px;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgb(var(--surface-200));
  max-width: 20rem;
  /* RTL comment: This component uses dir="ltr" and ltr-element class to maintain proper calendar display */
}

.date-picker-wrapper {
  display: flex;
  flex-direction: column;
}

.date-picker-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--primary-700));
  margin-bottom: 0.5rem;
}

.date-range-info {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: rgb(var(--surface-600));
  font-style: italic;
}

:deep(.date-input) {
  border-radius: 6px;
  border: 1px solid rgb(var(--surface-300));
  padding: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgb(var(--primary-400));
  }

  &:focus {
    border-color: rgb(var(--primary-500));
    box-shadow: 0 0 0 2px rgba(var(--primary-300), 0.25);
  }
}

:deep(.date-panel) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgb(var(--surface-300));
  padding: 0.5rem;
}

:deep(.date-header) {
  background-color: rgb(var(--primary-50));
  border-radius: 6px;
}

:deep(.date-footer) {
  background-color: rgb(var(--surface-50));
  border-top: 1px solid rgb(var(--surface-200));
  padding-top: 0.5rem;
}

:deep(.date-today-btn),
:deep(.date-clear-btn) {
  background-color: rgb(var(--primary-50));
  border: 1px solid rgb(var(--primary-200));
  color: rgb(var(--primary-700));
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgb(var(--primary-100));
    border-color: rgb(var(--primary-300));
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .date-picker-container {
    max-width: 100%;
  }
}
</style>
