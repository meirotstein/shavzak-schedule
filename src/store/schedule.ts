import { defineStore } from "pinia";
import { ref } from "vue";
import { getClosestDate } from "../utils/date-utils";
import { useGAPIStore } from "./gapi";

export const useScheduleStore = defineStore("schedule", () => {
  const gapi = useGAPIStore();

  const today = new Date();
  const scheduleDate = ref<Date | undefined>(
    gapi.presence?.start &&
      gapi.presence?.end &&
      getClosestDate(today, {
        start: gapi.presence?.start,
        end: gapi.presence?.end,
      })
  );

  function setScheduleDate(date: Date) {
    scheduleDate.value = date;
  }

  return {
    scheduleDate,
    setScheduleDate,
  };
});
