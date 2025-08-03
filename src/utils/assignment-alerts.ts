import { ShiftHours } from "../types/shift-hours";
import { SoldierAssignment } from "../types/soldier-assignment";

export type AlertLevel = "none" | "yellow" | "orange" | "red";

/**
 * Convert ShiftHours to minutes since midnight for easier comparison
 */
function timeToMinutes(time: ShiftHours): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate the duration of a shift in minutes
 */
function getShiftDuration(startTime: ShiftHours, endTime: ShiftHours): number {
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);

  // Handle shifts that cross midnight
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60; // Add 24 hours in minutes
  }

  return endMinutes - startMinutes;
}

/**
 * Check if two shifts overlap (parallel shifts)
 */
function shiftsOverlap(
  shift1: SoldierAssignment,
  shift2: SoldierAssignment
): boolean {
  // Only check shifts on the same date
  if (!isSameDay(shift1.date, shift2.date)) {
    return false;
  }

  const start1 = timeToMinutes(shift1.startTime);
  let end1 = timeToMinutes(shift1.endTime);
  const start2 = timeToMinutes(shift2.startTime);
  let end2 = timeToMinutes(shift2.endTime);

  // Handle shifts that cross midnight
  if (end1 <= start1) end1 += 24 * 60;
  if (end2 <= start2) end2 += 24 * 60;

  // Check for overlap: shifts overlap if one starts before the other ends
  return start1 < end2 && start2 < end1;
}

/**
 * Calculate the gap between two consecutive shifts in minutes
 */
function getGapBetweenShifts(
  firstShift: SoldierAssignment,
  secondShift: SoldierAssignment
): number {
  let firstStart = timeToMinutes(firstShift.startTime);
  let firstEnd = timeToMinutes(firstShift.endTime);
  let secondStart = timeToMinutes(secondShift.startTime);
  let secondEnd = timeToMinutes(secondShift.endTime);

  console.log("Initial times in minutes:", {
    firstStart,
    firstEnd,
    secondStart,
    secondEnd,
  });

  // Handle shifts crossing midnight
  if (firstEnd <= firstStart) {
    firstEnd += 24 * 60;
    console.log("First shift crosses midnight, adjusted firstEnd:", firstEnd);
  }
  if (secondEnd <= secondStart) {
    secondEnd += 24 * 60;
    console.log(
      "Second shift crosses midnight, adjusted secondEnd:",
      secondEnd
    );
  }

  // Initial gap calculation
  let gap = secondStart - firstEnd;
  console.log("Initial gap:", gap);

  // If second shift starts early (before 12:00) and first shift ends after 12:00,
  // treat second shift as next day
  if (secondStart < 12 * 60 && firstEnd > 12 * 60) {
    console.log("Checking for next-day shift:", {
      secondStartsEarly: secondStart < 12 * 60,
      firstEndsAfterNoon: firstEnd > 12 * 60,
    });

    secondStart += 24 * 60;
    secondEnd += 24 * 60;
    gap = secondStart - firstEnd;
    console.log("Adjusted for next day:", {
      newSecondStart: secondStart,
      newSecondEnd: secondEnd,
      newGap: gap,
    });
  }

  // If gap is still negative or too large, these shifts aren't consecutive
  if (gap < 0 || gap > 24 * 60) {
    console.log("Gap is invalid, returning Infinity");
    return Infinity;
  }

  console.log("Final gap:", gap);
  return gap;
}

/**
 * Simple date comparison helper
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

/**
 * Analyze soldier assignments and determine the highest alert level
 */
export function getAssignmentAlertLevel(
  assignments: SoldierAssignment[]
): AlertLevel {
  if (assignments.length <= 1) {
    return "none";
  }

  // Sort assignments chronologically, handling shifts that cross days
  const sortedAssignments = [...assignments].sort((a, b) => {
    // Convert times to minutes
    let aStart = timeToMinutes(a.startTime);
    let bStart = timeToMinutes(b.startTime);
    let aEnd = timeToMinutes(a.endTime);
    let bEnd = timeToMinutes(b.endTime);

    // Handle shifts that cross midnight
    if (aEnd <= aStart) aEnd += 24 * 60;
    if (bEnd <= bStart) bEnd += 24 * 60;

    // If one shift starts early (before 12:00) and the other ends late (after 12:00),
    // treat the early shift as next day
    if (aStart < 12 * 60 && bEnd > 12 * 60) {
      aStart += 24 * 60;
    } else if (bStart < 12 * 60 && aEnd > 12 * 60) {
      bStart += 24 * 60;
    }

    return aStart - bStart;
  });

  let highestAlert: AlertLevel = "none";

  // Check for overlapping shifts (red alert)
  for (let i = 0; i < sortedAssignments.length; i++) {
    for (let j = i + 1; j < sortedAssignments.length; j++) {
      if (shiftsOverlap(sortedAssignments[i], sortedAssignments[j])) {
        return "red"; // Red alert has highest priority, return immediately
      }
    }
  }

  // Check gaps between consecutive shifts
  for (let i = 0; i < sortedAssignments.length - 1; i++) {
    const firstShift = sortedAssignments[i];
    const secondShift = sortedAssignments[i + 1];

    console.log("Analyzing shifts:", {
      first: {
        start: firstShift.startTime,
        end: firstShift.endTime,
        date: firstShift.date.toISOString(),
      },
      second: {
        start: secondShift.startTime,
        end: secondShift.endTime,
        date: secondShift.date.toISOString(),
      },
    });

    const firstShiftDuration = getShiftDuration(
      firstShift.startTime,
      firstShift.endTime
    );
    console.log("First shift duration:", firstShiftDuration, "minutes");

    const gap = getGapBetweenShifts(firstShift, secondShift);
    console.log("Gap between shifts:", gap, "minutes");

    // Skip if gap is negative (overlapping - should be caught above) or infinite
    if (gap < 0 || gap === Infinity) {
      console.log("Skipping due to invalid gap");
      continue;
    }

    // Orange alert: gap <= duration of first shift
    if (gap <= firstShiftDuration) {
      console.log("Orange alert: gap <= first shift duration");
      highestAlert = "orange";
    }
    // Yellow alert: gap < 2x duration of first shift (but more than duration)
    else if (gap < firstShiftDuration * 2 && highestAlert === "none") {
      console.log("Yellow alert: gap < 2x first shift duration");
      highestAlert = "yellow";
    } else {
      console.log("No alert: gap >= 2x first shift duration");
    }
  }

  return highestAlert;
}

/**
 * Get a human-readable description of the alert
 */
export function getAlertDescription(alertLevel: AlertLevel): string {
  switch (alertLevel) {
    case "red":
      return "שיבוץ מקביל - חפיפה בין משמרות";
    case "orange":
      return "פער קצר בין משמרות - פחות או שווה לאורך המשמרת הראשונה";
    case "yellow":
      return "פער קצר בין משמרות - פחות מפי 2 מאורך המשמרת הראשונה";
    case "none":
    default:
      return "";
  }
}
