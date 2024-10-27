import { addDays, addHours, differenceInHours, format, parse } from "date-fns";
import { ShiftHours } from "../types/shift-hours";

export function timeToDate(time: ShiftHours): Date {
  const today = new Date();
  return parse(time, "HH:mm", today);
}

export function hoursBetween(time1: ShiftHours, time2: ShiftHours): number {
  const date1 = timeToDate(time1);
  let date2 = timeToDate(time2);

  if (date2 <= date1) {
    date2 = addDays(date2, 1);
  }

  return differenceInHours(date2, date1);
}

export function getNextHour(time: ShiftHours, next = 1): ShiftHours {
  const today = new Date();
  const timeDate = parse(time, "HH:mm", today);

  if (!next) {
    return format(timeDate, "HH:mm") as ShiftHours;
  }

  const nextHour = addHours(timeDate, next);

  return format(nextHour, "HH:mm") as ShiftHours;
}