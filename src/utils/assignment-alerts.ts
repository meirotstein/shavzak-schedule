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

  // Check if shifts are on different days
  const isDifferentDays = !isSameDay(firstShift.date, secondShift.date);

  if (isDifferentDays) {
    console.log("Shifts are on different days:", {
      firstDate: firstShift.date.toISOString(),
      secondDate: secondShift.date.toISOString(),
    });

    // For cross-day shifts, we need to calculate the actual gap
    if (secondShift.date > firstShift.date) {
      // Calculate the actual gap between end of first shift and start of second shift
      // Convert both times to absolute minutes since a reference point
      const firstEndTime = firstEnd;
      const secondStartTime = secondStart;

      // Calculate the day difference in minutes
      const dayDiff = Math.floor(
        (secondShift.date.getTime() - firstShift.date.getTime()) /
          (24 * 60 * 60 * 1000)
      );

      // Check if shifts are truly consecutive (end time matches start time on consecutive days)
      // BUT only if the gap is actually 0 hours, not 24 hours
      if (dayDiff === 1 && firstEndTime === secondStartTime) {
        // Special case: if both shifts end/start at the same time on consecutive days,
        // we need to check if this creates a 24-hour gap or a 0-hour gap
        // For example: ending at 22:00 and starting at 22:00 next day = 24 hour gap
        // But ending at 14:00 and starting at 14:00 next day = 0 hour gap (truly consecutive)

        // If the time is late in the day (after 18:00), it's likely a 24-hour gap
        // If the time is earlier in the day (before 18:00), it's likely truly consecutive
        if (firstEndTime >= 18 * 60) {
          // 18:00 = 1080 minutes
          console.log(
            "Late time on consecutive days - likely 24-hour gap, not truly consecutive"
          );
          // Calculate the actual 24-hour gap
          const timeGap = secondStartTime - firstEndTime;
          const dayGap = dayDiff * 24 * 60;
          const totalGap = timeGap + dayGap;
          return totalGap;
        } else {
          console.log("Shifts are truly consecutive across days - no gap");
          return 0;
        }
      }

      // Otherwise, calculate the actual gap including the day difference
      // For example: first ends at 22:00 on day 1, second starts at 22:00 on day 2
      // Gap = (22:00 day 2 - 22:00 day 1) + (1 day * 24 hours)
      // Gap = 0 + 24 hours = 24 hours
      const timeGap = secondStartTime - firstEndTime;
      const dayGap = dayDiff * 24 * 60; // Convert days to minutes
      const totalGap = timeGap + dayGap;

      console.log("Cross-day gap calculation:", {
        timeGap,
        dayGap,
        totalGap,
        dayDiff,
      });

      return totalGap;
    }
  } else {
    // Same day shifts - handle the case where second shift starts early and first ends late
    // If second shift starts early (before 12:00) and first shift ends after 12:00,
    // treat second shift as next day
    if (secondStart < 12 * 60 && firstEnd > 12 * 60) {
      console.log("Checking for next-day shift:", {
        secondStartsEarly: secondStart < 12 * 60,
        firstEndsAfterNoon: firstEnd > 12 * 60,
      });

      secondStart += 24 * 60;
      secondEnd += 24 * 60;
      console.log("Adjusted for next day:", {
        newSecondStart: secondStart,
        newSecondEnd: secondEnd,
      });
    }
  }

  // Initial gap calculation
  let gap = secondStart - firstEnd;
  console.log("Initial gap:", gap);

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
    // First compare by date
    const dateComparison = a.date.getTime() - b.date.getTime();
    if (dateComparison !== 0) {
      return dateComparison;
    }

    // If same date, compare by start time, but handle shifts that cross midnight
    const aStart = timeToMinutes(a.startTime);
    const bStart = timeToMinutes(b.startTime);

    // If one shift starts early (before 12:00) and the other starts late (after 12:00),
    // treat the early shift as next day for sorting purposes
    let adjustedAStart = aStart;
    let adjustedBStart = bStart;

    if (aStart < 12 * 60 && bStart > 12 * 60) {
      adjustedAStart += 24 * 60;
    } else if (bStart < 12 * 60 && aStart > 12 * 60) {
      adjustedBStart += 24 * 60;
    }

    return adjustedAStart - adjustedBStart;
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
