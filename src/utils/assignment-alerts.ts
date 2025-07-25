import { SoldierAssignment } from "../types/soldier-assignment";
import { ShiftHours } from "../types/shift-hours";

export type AlertLevel = 'none' | 'yellow' | 'orange' | 'red';

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
function shiftsOverlap(shift1: SoldierAssignment, shift2: SoldierAssignment): boolean {
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
function getGapBetweenShifts(firstShift: SoldierAssignment, secondShift: SoldierAssignment): number {
  // Only calculate gap for shifts on the same date
  if (!isSameDay(firstShift.date, secondShift.date)) {
    return Infinity; // No gap constraint across different days
  }
  
  let firstEnd = timeToMinutes(firstShift.endTime);
  let secondStart = timeToMinutes(secondShift.startTime);
  
  // Handle first shift crossing midnight
  if (firstEnd <= timeToMinutes(firstShift.startTime)) {
    firstEnd += 24 * 60; // Add 24 hours to end time
  }
  
  // If first shift crosses midnight, we need to handle the second shift properly
  if (firstEnd > 24 * 60) {
    // First shift crosses midnight, so its effective end time is after midnight
    // If second shift starts before midnight, add 24 hours to make it "next day"
    if (secondStart < 12 * 60) { // Second shift starts in the morning (likely next day)
      secondStart += 24 * 60;
    }
    // Otherwise, the second shift is same day evening, so calculate wrap-around gap
    else {
      // Gap from firstEnd (which is > 24*60) back to secondStart
      // This is a backward gap, which should be handled differently
      // For now, let's return a large gap to indicate they're not consecutive
      return Infinity;
    }
  }
  
  // Gap is the time between the end of first shift and start of second shift
  let gap = secondStart - firstEnd;
  
  // If gap is negative, the second shift might be the next day
  if (gap < 0) {
    // Check if this looks like a next-day scenario (e.g., 22:00 -> 02:00)
    // If second shift starts early in the morning (before 12:00) and first shift ends late
    if (timeToMinutes(secondShift.startTime) < 12 * 60 && timeToMinutes(firstShift.endTime) > 12 * 60) {
      // Add 24 hours to second shift start time
      gap = (secondStart + 24 * 60) - firstEnd;
    } else if (gap < -12 * 60) {
      // Gap is too negative, might be wrong order
      return Infinity;
    }
  }
  
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
export function getAssignmentAlertLevel(assignments: SoldierAssignment[]): AlertLevel {
  if (assignments.length <= 1) {
    return 'none';
  }
  
  // Sort assignments by date and start time for proper analysis
  const sortedAssignments = [...assignments].sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime();
    if (dateCompare !== 0) return dateCompare;
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
  
  let highestAlert: AlertLevel = 'none';
  
  // Check for overlapping shifts (red alert)
  for (let i = 0; i < sortedAssignments.length; i++) {
    for (let j = i + 1; j < sortedAssignments.length; j++) {
      if (shiftsOverlap(sortedAssignments[i], sortedAssignments[j])) {
        return 'red'; // Red alert has highest priority, return immediately
      }
    }
  }
  
  // Check gaps between all pairs of shifts on the same day
  for (let i = 0; i < sortedAssignments.length; i++) {
    for (let j = 0; j < sortedAssignments.length; j++) {
      if (i === j) continue;
      
      const firstShift = sortedAssignments[i];
      const secondShift = sortedAssignments[j];
      
      // Only analyze shifts on the same day
      if (!isSameDay(firstShift.date, secondShift.date)) {
        continue;
      }
      
      const firstShiftDuration = getShiftDuration(firstShift.startTime, firstShift.endTime);
      const gap = getGapBetweenShifts(firstShift, secondShift);
      
      // Skip if gap is negative (overlapping - should be caught above) or infinite
      // Note: gap = 0 (consecutive shifts) should still be analyzed for alerts
      if (gap < 0 || gap === Infinity) {
        continue;
      }
      
      // Orange alert: gap <= duration of first shift
      if (gap <= firstShiftDuration) {
        highestAlert = 'orange';
      }
      // Yellow alert: gap < 2x duration of first shift (but more than duration)
      else if (gap < firstShiftDuration * 2 && highestAlert === 'none') {
        highestAlert = 'yellow';
      }
    }
  }
  
  return highestAlert;
}

/**
 * Get a human-readable description of the alert
 */
export function getAlertDescription(alertLevel: AlertLevel): string {
  switch (alertLevel) {
    case 'red':
      return 'שיבוץ מקביל - חפיפה בין משמרות';
    case 'orange':
      return 'פער קצר בין משמרות - פחות או שווה לאורך המשמרת הראשונה';
    case 'yellow':
      return 'פער קצר בין משמרות - פחות מפי 2 מאורך המשמרת הראשונה';
    case 'none':
    default:
      return '';
  }
} 