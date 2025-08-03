import { format, isSameDay } from "date-fns";
import { defineStore } from "pinia";
import { reactive } from "vue";
import { SoldierAssignment } from "../types/soldier-assignment";
import { useScheduleStore } from "./schedule";

export const useAssignmentsStore = defineStore("assignments", () => {
  // Map of soldier ID to their assignments (now includes historical data)
  const soldierAssignments = reactive<Map<string, SoldierAssignment[]>>(
    new Map()
  );
  const scheduleStore = useScheduleStore();

  function addAssignment(soldierId: string, assignment: SoldierAssignment) {
    if (!soldierAssignments.has(soldierId)) {
      soldierAssignments.set(soldierId, []);
    }
    soldierAssignments.get(soldierId)!.push(assignment);
  }

  function removeAssignment(
    soldierId: string,
    positionId: string,
    shiftId: string,
    date?: Date
  ) {
    const targetDate = date || scheduleStore.scheduleDate;
    const assignments = soldierAssignments.get(soldierId);
    if (assignments && targetDate) {
      const index = assignments.findIndex(
        (a) =>
          a.positionId === positionId &&
          a.shiftId === shiftId &&
          isSameDay(a.date, targetDate)
      );
      if (index !== -1) {
        assignments.splice(index, 1);
      }
    }
  }

  function getAssignments(soldierId: string, date?: Date): SoldierAssignment[] {
    const allAssignments = soldierAssignments.get(soldierId) || [];

    // If no date specified, return assignments for the current selected date
    if (!date && scheduleStore.scheduleDate) {
      return allAssignments.filter((a) =>
        isSameDay(a.date, scheduleStore.scheduleDate!)
      );
    }

    // If date specified, filter by that date
    if (date) {
      return allAssignments.filter((a) => isSameDay(a.date, date));
    }

    // Fallback: return all assignments (for backward compatibility)
    return allAssignments;
  }

  function getAllAssignments(soldierId: string): SoldierAssignment[] {
    return soldierAssignments.get(soldierId) || [];
  }

  function getAssignmentsByDateRange(
    soldierId: string,
    startDate: Date,
    endDate: Date
  ): SoldierAssignment[] {
    const allAssignments = soldierAssignments.get(soldierId) || [];
    return allAssignments.filter(
      (a) => a.date >= startDate && a.date <= endDate
    );
  }

  function getAssignmentsForAlertCheck(soldierId: string): SoldierAssignment[] {
    const allAssignments = soldierAssignments.get(soldierId) || [];

    if (!scheduleStore.scheduleDate) {
      return allAssignments;
    }

    // Get assignments for current day and previous day
    const currentDate = scheduleStore.scheduleDate;
    const previousDate = new Date(currentDate);
    previousDate.setDate(previousDate.getDate() - 1);

    return allAssignments.filter(
      (a) => isSameDay(a.date, currentDate) || isSameDay(a.date, previousDate)
    );
  }

  function clearAssignments(soldierId: string, date?: Date) {
    const assignments = soldierAssignments.get(soldierId) || [];

    if (!date && !scheduleStore.scheduleDate) {
      // Clear all assignments if no date context
      console.log(
        `🗑️ Clearing ALL assignments for soldier ${soldierId} (no date context)`
      );
      soldierAssignments.set(soldierId, []);
      return;
    }

    const targetDate = date || scheduleStore.scheduleDate!;
    const filteredAssignments = assignments.filter(
      (a) => !isSameDay(a.date, targetDate)
    );

    console.log(
      `🗑️ Clearing assignments for soldier ${soldierId} on ${format(
        targetDate,
        "yyyy-MM-dd"
      )}: ${assignments.length - filteredAssignments.length} cleared, ${
        filteredAssignments.length
      } preserved`
    );

    soldierAssignments.set(soldierId, filteredAssignments);
  }

  function clearAllAssignments() {
    console.log("🗑️ Clearing all soldier assignments");
    soldierAssignments.clear();
  }

  function clearAssignmentsForDate(date: Date) {
    console.log(
      `🗑️ Clearing all soldier assignments for date: ${date.toDateString()}`
    );
    let totalCleared = 0;
    let soldiersAffected = 0;

    for (const [soldierId, assignments] of soldierAssignments.entries()) {
      const originalCount = assignments.length;
      const filteredAssignments = assignments.filter(
        (a) => !isSameDay(a.date, date)
      );
      const clearedCount = originalCount - filteredAssignments.length;

      if (clearedCount > 0) {
        soldiersAffected++;
        totalCleared += clearedCount;
        console.log(
          `🗑️ Soldier ${soldierId}: cleared ${clearedCount} assignments for ${format(
            date,
            "yyyy-MM-dd"
          )}, ${filteredAssignments.length} remain`
        );
      }

      soldierAssignments.set(soldierId, filteredAssignments);
    }

    console.log(
      `✅ Assignment clearing complete: ${totalCleared} assignments cleared for ${soldiersAffected} soldiers on ${format(
        date,
        "yyyy-MM-dd"
      )}`
    );
  }

  function isAssigned(soldierId: string, date?: Date): boolean {
    return getAssignments(soldierId, date).length > 0;
  }

  return {
    addAssignment,
    removeAssignment,
    getAssignments,
    getAllAssignments,
    getAssignmentsByDateRange,
    getAssignmentsForAlertCheck,
    clearAssignments,
    clearAllAssignments,
    clearAssignmentsForDate,
    isAssigned,
  };
});
