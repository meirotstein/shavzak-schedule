import { defineStore } from "pinia";
import { computed, reactive, watch } from "vue";
import { SchedulerError } from "../errors/scheduler-error";
import { PositionModel } from "../model/position";
import { ShiftModel } from "../model/shift";
import { ISoldier } from "../model/soldier";
import { timeToMinutes } from "../utils/date-utils";
import { shiftsByStartTimeCompare } from "../utils/sheets-utils";
import { useAssignmentsStore } from "./assignments";
import { useGAPIStore } from "./gapi";
import { useSoldiersStore } from "./soldiers";

const dayStart = "14:00";

// Performance optimization: Create a soldiers cache
function createSoldiersCache(soldiers?: ISoldier[]): Map<string, ISoldier> {
  const cache = new Map<string, ISoldier>();
  if (soldiers && soldiers.length > 0) {
    soldiers.forEach((soldier) => {
      cache.set(soldier.id, soldier);
    });
  }
  return cache;
}

export const usePositionsStore = defineStore("positions", () => {
  const gapi = useGAPIStore();
  const soldiersStore = useSoldiersStore();
  const assignmentsStore = useAssignmentsStore();

  // Cache for soldiers to avoid O(n) lookups
  const soldiersCache = computed(() => {
    const timingId = `createSoldiersCache-${Date.now()}`;
    console.time(`⏱️ ${timingId}`);
    const cache = createSoldiersCache(soldiersStore.soldiers);
    console.timeEnd(`⏱️ ${timingId}`);
    return cache;
  });

  const positions = computed(() => {
    const timingId = `positions-computed-${Date.now()}`;
    console.time(`⏱️ ${timingId}`);
    console.log("🔄 Computing positions...", {
      gapiPositions: gapi.positions.length,
      cachedSoldiers: soldiersCache.value.size,
    });

    const dayStartMinutes = timeToMinutes(dayStart);
    const compareFn = shiftsByStartTimeCompare.bind({}, dayStartMinutes);

    const result = gapi.positions.map((positionData) => {
      const position = reactive(
        new PositionModel(positionData.id, positionData.name)
      );

      positionData.shifts.sort(compareFn).forEach((shiftData) => {
        const shift = reactive(
          new ShiftModel(
            shiftData.id,
            shiftData.startTime,
            shiftData.endTime,
            shiftData.assignmentDefs
          )
        );

        // Performance optimization: Use cached soldiers instead of O(n) search
        shiftData.soldierIds?.forEach((soldierId) => {
          // Skip empty soldier IDs (removed assignments)
          if (!soldierId || soldierId.trim() === "") {
            return;
          }

          const soldier = soldiersCache.value.get(soldierId);
          if (!soldier) {
            throw new SchedulerError(`Soldier with id ${soldierId} not found`);
          }
          shift.addSoldier(soldier);
        });

        position.shifts.push(shift);
      });
      return position;
    });

    console.timeEnd(`⏱️ ${timingId}`);
    console.log("✅ Positions computed:", {
      positions: result.length,
      totalShifts: result.reduce((sum, p) => sum + p.shifts.length, 0),
      totalAssignments: result.reduce(
        (sum, p) =>
          sum +
          p.shifts.reduce(
            (shiftSum, s) =>
              shiftSum + s.assignments.filter((a) => a.soldier).length,
            0
          ),
        0
      ),
    });

    return result;
  });

  // Performance optimization: Separate watcher with better control
  let isProcessingAssignments = false;

  watch(
    () => ({
      positions: gapi.positions,
      soldiers: gapi.soldiers?.length || 0, // Handle undefined soldiers
      hasAssignments: gapi.positions.some((p) =>
        p.shifts.some((s) => s.soldierIds && s.soldierIds.length > 0)
      ),
    }),
    (
      { positions: newPositions, soldiers: soldiersCount, hasAssignments },
      oldValue
    ) => {
      console.log("🔍 Positions watcher triggered", {
        positionsCount: newPositions.length,
        soldiersCount,
        hasAssignments,
        isProcessing: isProcessingAssignments,
      });

      // Avoid processing during ongoing assignment operations
      if (isProcessingAssignments) {
        console.log("⚠️ Skipping - already processing assignments");
        return;
      }

      // Only process if we have both positions and soldiers
      if (newPositions.length > 0 && soldiersCount > 0 && hasAssignments) {
        console.time("⏱️ assignments-processing");
        isProcessingAssignments = true;

        try {
          // Process assignments without triggering the expensive computed unnecessarily
          const processedSoldiers = new Set<string>();
          let totalAssignments = 0;

          // Access positions.value only once to avoid repeated computation
          const computedPositions = positions.value;

          computedPositions.forEach((position) => {
            position.shifts.forEach((shift) => {
              shift.assignments.forEach((assignment, index) => {
                if (assignment.soldier) {
                  totalAssignments++;

                  // Clear assignments only once per soldier
                  if (!processedSoldiers.has(assignment.soldier.id)) {
                    assignmentsStore.clearAssignments(assignment.soldier.id);
                    processedSoldiers.add(assignment.soldier.id);
                  }

                  assignmentsStore.addAssignment(assignment.soldier.id, {
                    positionId: position.positionId,
                    positionName: position.positionName,
                    shiftId: shift.shiftId,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    assignmentIndex: index,
                  });
                }
              });
            });
          });

          console.timeEnd("⏱️ assignments-processing");
          console.log(`✅ Assignment processing complete:`, {
            processedSoldiers: processedSoldiers.size,
            totalAssignments: totalAssignments,
          });
        } finally {
          isProcessingAssignments = false;
        }
      } else {
        console.log(
          "⚠️ Skipping assignments processing - conditions not met:",
          {
            hasPositions: newPositions.length > 0,
            hasSoldiers: soldiersCount > 0,
            hasAssignments,
          }
        );
      }
    },
    { immediate: true }
  );

  function assignSoldiersToShift(
    positionId: string,
    shiftsId: string,
    shiftSpotIndex: number,
    soldierId: string
  ) {
    const position = positions.value.find(
      (position) => position.positionId === positionId
    );
    if (!position) {
      throw new SchedulerError(`Position with id ${positionId} not found`);
    }
    const shift = position.shifts.find((shift) => shift.shiftId === shiftsId);
    if (!shift) {
      throw new SchedulerError(
        `Shift with id ${shiftsId} not found in position with id ${positionId}`
      );
    }

    // Use the cache instead of the soldiers store for performance
    const soldier = soldiersCache.value.get(soldierId);
    if (!soldier) {
      throw new SchedulerError(`Soldier with id ${soldierId} not found`);
    }

    // Check if there's already a soldier in this spot and remove their assignment
    const existingSoldier = shift.assignments[shiftSpotIndex].soldier;
    if (existingSoldier) {
      assignmentsStore.removeAssignment(
        existingSoldier.id,
        positionId,
        shiftsId
      );

      // Remove from underlying gapi data as well
      const gapiPosition = gapi.positions.find((p) => p.id === positionId);
      const gapiShift = gapiPosition?.shifts.find((s) => s.id === shiftsId);
      if (gapiShift && gapiShift.soldierIds) {
        const index = gapiShift.soldierIds.indexOf(existingSoldier.id);
        if (index !== -1) {
          gapiShift.soldierIds.splice(index, 1);
        }
      }
    }

    // Add to shift
    shift.addSoldier(soldier, shiftSpotIndex);

    // Also update the underlying gapi.positions data structure
    const gapiPosition = gapi.positions.find((p) => p.id === positionId);
    const gapiShift = gapiPosition?.shifts.find((s) => s.id === shiftsId);
    if (gapiShift) {
      if (!gapiShift.soldierIds) {
        gapiShift.soldierIds = [];
      }
      // Add soldier at the right position in the array
      if (gapiShift.soldierIds.length <= shiftSpotIndex) {
        // Pad the array if necessary
        while (gapiShift.soldierIds.length <= shiftSpotIndex) {
          gapiShift.soldierIds.push("");
        }
      }
      gapiShift.soldierIds[shiftSpotIndex] = soldierId;
    }

    // Add assignment to assignments store
    assignmentsStore.addAssignment(soldierId, {
      positionId,
      positionName: position.positionName,
      shiftId: shiftsId,
      startTime: shift.startTime,
      endTime: shift.endTime,
      assignmentIndex: shiftSpotIndex,
    });
  }

  function removeSoldierFromShift(
    positionId: string,
    shiftId: string,
    shiftSpotIndex: number
  ) {
    const position = positions.value.find(
      (position) => position.positionId === positionId
    );
    if (!position) {
      throw new SchedulerError(`Position with id ${positionId} not found`);
    }
    const shift = position.shifts.find((shift) => shift.shiftId === shiftId);
    if (!shift) {
      throw new SchedulerError(
        `Shift with id ${shiftId} not found in position with id ${positionId}`
      );
    }

    // Get soldier before removing
    const soldier = shift.assignments[shiftSpotIndex].soldier;

    // Remove from shift
    shift.removeSoldier(shiftSpotIndex);

    // Also update the underlying gapi.positions data structure
    const gapiPosition = gapi.positions.find((p) => p.id === positionId);
    const gapiShift = gapiPosition?.shifts.find((s) => s.id === shiftId);
    if (gapiShift && gapiShift.soldierIds && soldier) {
      gapiShift.soldierIds[shiftSpotIndex] = "";
    }

    // Remove assignment from assignments store
    if (soldier) {
      assignmentsStore.removeAssignment(soldier.id, positionId, shiftId);
    }
  }

  return { positions, assignSoldiersToShift, removeSoldierFromShift };
});
