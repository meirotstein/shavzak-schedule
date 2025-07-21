import { defineStore } from "pinia";
import { computed, reactive, watch } from "vue";
import { SchedulerError } from "../errors/scheduler-error";
import { PositionModel } from "../model/position";
import { ShiftModel } from "../model/shift";
import { ISoldier } from "../model/soldier";
import { timeToMinutes } from "../utils/date-utils";
import { shiftsByStartTimeCompare, numberToColumnLetter } from "../utils/sheets-utils";
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

  // Auto-save state
  let autoSaveEnabled = true;
  let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const SAVE_DELAY = 1000; // 1 second delay for debouncing

  // Cache for soldiers to avoid O(n) lookups
  const soldiersCache = computed(() => {
    return createSoldiersCache(soldiersStore.soldiers);
  });

  // Function to build assignment rows for Google Sheets format
  async function buildAssignmentRows(): Promise<Array<{range: string, values: any[][]}>> {
    // First, we need to read the current sheet structure to find assignment positions
    const sheetData = await gapi.fetchSheetValues(gapi.SHEETS.POSITIONS, "A1", "AZ100");
    if (!sheetData || sheetData.length === 0) {
      console.warn('🚫 Cannot read sheet data for auto-save');
      return [];
    }

    console.log(`🔍 Building assignment rows for ${gapi.positions.length} loaded positions`);
    const updates: Array<{range: string, values: any[][]}> = [];
    
    // Find position columns and their assignment areas
    const positionsRow = sheetData[0];
    const positionColumns: Array<{column: number, positionId: string}> = [];
    
    for (let i = 0; i < positionsRow.length; i++) {
      if (positionsRow[i] === "עמדה") {
        // Use the exact same logic as in gapi.ts: pos-${i} where i is the column index
        // Save assignments starting from the label column (i) spanning to value column (i+1)
        positionColumns.push({
          column: i,  // Start from the label column for two-column range
          positionId: `pos-${i}`  // This should match exactly how gapi.ts creates position IDs
        });
      }
    }

    console.log(`📊 Sheet analysis:`, {
      sheetPositions: positionColumns.map(p => `${p.positionId}@col${p.column}`),
      loadedPositions: gapi.positions.map(p => `${p.id}(${p.name})`)
    });

    let totalAssignmentSlots = 0;
    let totalFilledSlots = 0;
    
    // For each position, find its assignment rows and update them
    for (const posColumn of positionColumns) {
      const positionData = gapi.positions.find(p => p.id === posColumn.positionId);
      if (!positionData) {
        console.warn(`⚠️ Position data not found for ${posColumn.positionId}`);
        continue;
      }

      // Try to find existing assignment section first
      let assignmentStartRow = -1;

      // Scan the column to find where assignments start
      for (let row = 1; row < sheetData.length; row++) {
        const cellValue = sheetData[row] && sheetData[row][posColumn.column];
        if (cellValue === gapi.TITLES.ASSIGNMENT) {
          assignmentStartRow = row + 1; // Start after the title row
          break;
        }
      }

      // If no existing assignment section, find where to create it
      if (assignmentStartRow === -1) {
        // Find the last row with content in this column (after shifts)
        let lastContentRow = -1;
        for (let row = 1; row < sheetData.length; row++) {
          const cellValue = sheetData[row] && sheetData[row][posColumn.column];
          if (cellValue && cellValue.trim() !== "") {
            lastContentRow = row;
          }
        }
        
        // Place assignments after the last content + 1 row gap
        assignmentStartRow = lastContentRow + 2;
        console.log(`📍 No existing assignments for ${posColumn.positionId}, will create at row ${assignmentStartRow}`);
      } else {
        console.log(`📍 Found existing assignments for ${posColumn.positionId} starting at row ${assignmentStartRow}`);
      }

      // Build the assignment values for this position
      const assignmentValues: string[][] = [];
      let positionSlots = 0;
      let positionFilled = 0;
      
      // Collect all assignments first
      const allAssignments: string[] = [];
      
      // Add all assignments for all shifts sequentially
      positionData.shifts.forEach((shift) => {
        // Add assignment rows for each role in this shift
        const maxAssignments = shift.assignmentDefs.length;
        positionSlots += maxAssignments;
        
        for (let i = 0; i < maxAssignments; i++) {
          let soldierId = "";
          if (shift.soldierIds && i < shift.soldierIds.length) {
            soldierId = shift.soldierIds[i] || "";
            if (soldierId) positionFilled++;
          }
          allAssignments.push(soldierId);
        }
      });
      
      // Create two-column assignment rows: [label, value]
      if (allAssignments.length > 0) {
        // Every row gets the שיבוץ header (including empty assignments)
        for (let i = 0; i < allAssignments.length; i++) {
          assignmentValues.push([gapi.TITLES.ASSIGNMENT, allAssignments[i] || ""]);
        }
      } else {
        // If no assignments, just add the header with empty value
        assignmentValues.push([gapi.TITLES.ASSIGNMENT, ""]);
      }

      totalAssignmentSlots += positionSlots;
      totalFilledSlots += positionFilled;
      
      console.log(`📋 ${posColumn.positionId}: ${positionFilled}/${positionSlots} filled`);

      // Create a two-column range starting from the label column
      const startColumnLetter = numberToColumnLetter(posColumn.column + 1);  // +1 for 1-based indexing
      const endColumnLetter = numberToColumnLetter(posColumn.column + 2);    // +2 for value column
      const endRow = assignmentStartRow + assignmentValues.length - 1;
      const range = `${startColumnLetter}${assignmentStartRow}:${endColumnLetter}${endRow}`;

      updates.push({
        range,
        values: assignmentValues
      });
    }

    console.log(`💾 Auto-save summary: ${totalFilledSlots}/${totalAssignmentSlots} total assignments, ${updates.length} position updates generated`);
    return updates;
  }

  // Function to save assignments to Google Sheets
  async function saveAssignments(): Promise<void> {
    if (!gapi.isSignedIn || !autoSaveEnabled) {
      return;
    }

    try {
      console.log('🔄 Auto-saving assignments to Google Sheets...');
      
      const assignmentUpdates = await buildAssignmentRows();
      
      if (assignmentUpdates.length === 0) {
        console.log('⚠️ No valid assignment sections found - nothing to save');
        return;
      }

      await gapi.batchUpdateSheetValues(gapi.SHEETS.POSITIONS, assignmentUpdates);
      
      console.log(`✅ Auto-save completed! Updated ${assignmentUpdates.length} position(s) in Google Sheets`);
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      // Could add user notification here
    }
  }

  // Function to trigger auto-save with debouncing
  function triggerAutoSave(): void {
    if (!autoSaveEnabled) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }

    // Set new timeout
    saveTimeoutId = setTimeout(() => {
      saveAssignments();
      saveTimeoutId = null;
    }, SAVE_DELAY);
  }

  const positions = computed(() => {
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

        // CRITICAL FIX: Preserve spot indices when rebuilding from soldierIds
        shiftData.soldierIds?.forEach((soldierId, index) => {
          // Skip empty soldier IDs (removed assignments)
          if (!soldierId || soldierId.trim() === "") {
            return;
          }

          const soldier = soldiersCache.value.get(soldierId);
          if (!soldier) {
            throw new SchedulerError(`Soldier with id ${soldierId} not found`);
          }
          // Use the specific index to preserve exact spot assignments
          shift.addSoldier(soldier, index);
        });

        position.shifts.push(shift);
      });
      return position;
    });

    return result;
  });

  // Performance optimization: Separate watcher with better control
  let isProcessingAssignments = false;
  let isManualAssignment = false; // Flag to prevent watcher during manual assignment operations

  watch(
    () => ({
      positions: gapi.positions,
      soldiers: gapi.soldiers?.length || 0, // Handle undefined soldiers
      hasAssignments: gapi.positions.some((p) =>
        p.shifts.some((s) => s.soldierIds && s.soldierIds.length > 0)
      ),
    }),
    ({ positions: newPositions, soldiers: soldiersCount, hasAssignments }) => {
      // Skip if we're in the middle of a manual assignment operation
      if (isManualAssignment) {
        return;
      }

      // Avoid processing during ongoing assignment operations
      if (isProcessingAssignments) {
        return;
      }

      // Only process if we have both positions and soldiers
      if (newPositions.length > 0 && soldiersCount > 0 && hasAssignments) {
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

          console.log(`✅ Assignment processing complete:`, {
            processedSoldiers: processedSoldiers.size,
            totalAssignments: totalAssignments,
          });
        } finally {
          isProcessingAssignments = false;
        }
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
    // Set the manual assignment flag to prevent watcher interference
    isManualAssignment = true;

    try {
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

      // Trigger auto-save after assignment
      triggerAutoSave();
    } finally {
      // Always reset the manual assignment flag
      isManualAssignment = false;
    }
  }

  function removeSoldierFromShift(
    positionId: string,
    shiftId: string,
    shiftSpotIndex: number
  ) {
    // Set the manual assignment flag to prevent watcher interference
    isManualAssignment = true;

    try {
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

      // Trigger auto-save after removal
      triggerAutoSave();
    } finally {
      // Always reset the manual assignment flag
      isManualAssignment = false;
    }
  }

  // Function to enable/disable auto-save
  function setAutoSaveEnabled(enabled: boolean): void {
    autoSaveEnabled = enabled;
    if (!enabled && saveTimeoutId) {
      clearTimeout(saveTimeoutId);
      saveTimeoutId = null;
    }
  }

  // Function to manually trigger save (for testing or manual saves)
  function manualSave(): Promise<void> {
    return saveAssignments();
  }

  return { 
    positions, 
    assignSoldiersToShift, 
    removeSoldierFromShift,
    setAutoSaveEnabled,
    manualSave
  };
});
