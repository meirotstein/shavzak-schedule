import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { getClosestDate } from "../utils/date-utils";
import { useGAPIStore } from "./gapi";

export const useScheduleStore = defineStore("schedule", () => {
  const gapi = useGAPIStore();

  const today = new Date();
  let _scheduleDate = ref<Date | undefined>();

  function setScheduleDate(date: Date) {
    _scheduleDate.value = date;
  }

  const scheduleDate = computed(() => {
    if (_scheduleDate.value) {
      return _scheduleDate.value;
    }

    return (
      gapi.presence.start &&
      gapi.presence.end &&
      getClosestDate(today, {
        start: gapi.presence.start,
        end: gapi.presence.end,
      })
    );
  });

  return {
    scheduleDate,
    setScheduleDate,
  };
});
