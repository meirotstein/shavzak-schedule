import { ShiftDto } from "../types/client-dto";
import { timeToMinutes } from "./date-utils";

export function numberToColumnLetter(num: number): string {
  let columnLetter = "";
  let n = num;

  while (n > 0) {
    const remainder = (n - 1) % 26;
    columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
    n = Math.floor((n - 1) / 26);
  }

  return columnLetter;
}

export function shiftsByStartTimeCompare(
  dayStartMinutes: number,
  a: ShiftDto,
  b: ShiftDto
): number {
  // Convert startTime into minutes relative to the dayStart
  const timeA = (timeToMinutes(a.startTime) - dayStartMinutes + 1440) % 1440;
  const timeB = (timeToMinutes(b.startTime) - dayStartMinutes + 1440) % 1440;

  return timeA - timeB;
}
