import { format } from "date-fns";
import { defineStore } from "pinia";
import { computed, reactive, ref, watch } from "vue";
import { SchedulerError } from "../errors/scheduler-error";
import { PositionModel } from "../model/position";
import { ShiftModel } from "../model/shift";
import { ISoldier } from "../model/soldier";
import { timeToMinutes } from "../utils/date-utils";
import {
  numberToColumnLetter,
  shiftsByStartTimeCompare,
} from "../utils/sheets-utils";
import { useAssignmentsStore } from "./assignments";
import { useGAPIStore } from "./gapi";
import { useScheduleStore } from "./schedule";
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
  const scheduleStore = useScheduleStore(); // Add schedule store

  // Auto-save state
  let autoSaveEnabled = true;
  let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const SAVE_DELAY = 1000; // 1 second delay for debouncing

  // Reactive refresh counter to force positions re-computation
  const positionsRefreshCounter = ref(0);

  // Loading states
  const isLoadingPositions = ref(false);
  const isLoadingSoldiers = ref(false);
  const loadingMessage = ref("");

  // Debouncing for date changes
  let dateChangeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Session-level tracking of processed historical dates to prevent duplicates
  const processedHistoricalDates = new Set<string>();

  // Function to force refresh of positions
  function forcePositionsRefresh() {
    positionsRefreshCounter.value++;
    console.log(
      `🔄 Forcing positions refresh (counter: ${positionsRefreshCounter.value})`
    );
  }

  // Function to force recalculation of assignments
  function forceAssignmentRecalculation() {
    console.log("🔄 Forcing assignment recalculation...");

    // Process assignments manually to ensure they're up to date
    const processedSoldiers = new Set<string>();
    let totalAssignments = 0;

    // Access positions.value to trigger computation if needed
    const computedPositions = positions.value;
    console.log(
      `📊 Found ${computedPositions.length} positions to process for assignments`
    );

    computedPositions.forEach((position) => {
      position.shifts.forEach((shift) => {
        shift.assignments.forEach((assignment, index) => {
          if (assignment.soldier) {
            totalAssignments++;

            // Clear assignments only once per soldier (for current date only)
            if (!processedSoldiers.has(assignment.soldier.id)) {
              assignmentsStore.clearAssignments(
                assignment.soldier.id,
                scheduleStore.scheduleDate || new Date()
              );
              processedSoldiers.add(assignment.soldier.id);
            }

            // Use the current schedule date for assignments since we're processing current date positions
            // Historical assignments should not be processed through this manual recalculation
            const assignmentDate = scheduleStore.scheduleDate || new Date();

            console.log(
              `📝 Manual assignment: ${assignment.soldier.id} -> ${
                position.positionName
              } on ${format(assignmentDate, "yyyy-MM-dd")}`
            );

            assignmentsStore.addAssignment(assignment.soldier.id, {
              positionId: position.positionId,
              positionName: position.positionName,
              shiftId: shift.shiftId,
              startTime: shift.startTime,
              endTime: shift.endTime,
              assignmentIndex: index,
              date: assignmentDate,
            });
          }
        });
      });
    });

    console.log(`✅ Manual assignment recalculation complete:`, {
      processedSoldiers: processedSoldiers.size,
      totalAssignments: totalAssignments,
      positionsProcessed: computedPositions.length,
    });
  }

  // Function to process historical assignments with correct dates
  function processHistoricalAssignments(
    historicalPositions: any[],
    assignmentDate: Date
  ) {
    console.log(
      `🗂️ Processing historical assignments for date: ${format(
        assignmentDate,
        "yyyy-MM-dd"
      )}`
    );

    let processedAssignments = 0;
    const processedSoldiers = new Set<string>();

    historicalPositions.forEach((positionData) => {
      positionData.shifts.forEach((shiftData: any) => {
        // Process soldier assignments for this historical shift
        shiftData.soldierIds?.forEach((soldierId: string, index: number) => {
          // Skip empty soldier IDs
          if (!soldierId || soldierId.trim() === "") {
            return;
          }

          const soldier = soldiersCache.value.get(soldierId);
          if (!soldier) {
            console.warn(
              `⚠️ Historical assignment: Soldier with id ${soldierId} not found - skipping for ${
                positionData.name
              } on ${format(assignmentDate, "yyyy-MM-dd")}`
            );
            return;
          }

          processedAssignments++;
          processedSoldiers.add(soldierId);

          console.log(
            `📝 Historical assignment: ${soldierId} -> ${
              positionData.name
            } on ${format(assignmentDate, "yyyy-MM-dd")}`
          );

          assignmentsStore.addAssignment(soldierId, {
            positionId: positionData.id,
            positionName: positionData.name,
            shiftId: shiftData.id,
            startTime: shiftData.startTime,
            endTime: shiftData.endTime,
            assignmentIndex: index,
            date: assignmentDate,
          });
        });
      });
    });

    console.log(
      `✅ Historical assignment processing complete: ${processedAssignments} assignments for ${
        processedSoldiers.size
      } soldiers on ${format(assignmentDate, "yyyy-MM-dd")}`
    );
    return processedAssignments;
  }

  // Cache for soldiers to avoid O(n) lookups
  const soldiersCache = computed(() => {
    return createSoldiersCache(soldiersStore.soldiers);
  });

  // Function to build assignment rows for Google Sheets format
  async function buildAssignmentRows(): Promise<
    Array<{ range: string; values: any[][] }>
  > {
    const currentSheetName = gapi.getCurrentSheetName(
      scheduleStore.scheduleDate
    );
    const sheetData = await gapi.fetchSheetValues(
      currentSheetName,
      "A1",
      "AZ100"
    );

    console.log(`🔍 Building assignments for sheet: "${currentSheetName}"`);

    if (!sheetData || sheetData.length === 0) {
      console.warn("No sheet data found");
      return [];
    }

    console.log(
      `🔍 Building assignment rows for ${gapi.positions.length} loaded positions`
    );
    const updates: Array<{ range: string; values: any[][] }> = [];

    // Find position columns and their assignment areas
    const positionsRow = sheetData[0];
    const positionColumns: Array<{ column: number; positionId: string }> = [];

    for (let i = 0; i < positionsRow.length; i++) {
      if (positionsRow[i] === "עמדה") {
        // Use the exact same logic as in gapi.ts: pos-${i} where i is the column index
        // Save assignments starting from the label column (i) spanning to value column (i+1)
        positionColumns.push({
          column: i, // Start from the label column for two-column range
          positionId: `pos-${i}`, // This should match exactly how gapi.ts creates position IDs
        });
      }
    }

    console.log(`📊 Sheet analysis:`, {
      sheetPositions: positionColumns.map(
        (p) => `${p.positionId}@col${p.column}`
      ),
      loadedPositions: gapi.positions.map((p) => `${p.id}(${p.name})`),
    });

    let totalAssignmentSlots = 0;
    let totalFilledSlots = 0;

    // For each position, find its assignment rows and update them
    for (const posColumn of positionColumns) {
      const positionData = gapi.positions.find(
        (p) => p.id === posColumn.positionId
      );
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
        console.log(
          `📍 No existing assignments for ${posColumn.positionId}, will create at row ${assignmentStartRow}`
        );
      } else {
        console.log(
          `📍 Found existing assignments for ${posColumn.positionId} starting at row ${assignmentStartRow}`
        );
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
          assignmentValues.push([
            gapi.TITLES.ASSIGNMENT,
            allAssignments[i] || "",
          ]);
        }
      } else {
        // If no assignments, just add the header with empty value
        assignmentValues.push([gapi.TITLES.ASSIGNMENT, ""]);
      }

      totalAssignmentSlots += positionSlots;
      totalFilledSlots += positionFilled;

      console.log(
        `📋 ${posColumn.positionId}: ${positionFilled}/${positionSlots} filled`
      );

      // Create a two-column range starting from the label column
      const startColumnLetter = numberToColumnLetter(posColumn.column + 1); // +1 for 1-based indexing
      const endColumnLetter = numberToColumnLetter(posColumn.column + 2); // +2 for value column
      const endRow = assignmentStartRow + assignmentValues.length - 1;
      const range = `${startColumnLetter}${assignmentStartRow}:${endColumnLetter}${endRow}`;

      updates.push({
        range,
        values: assignmentValues,
      });
    }

    console.log(
      `💾 Auto-save summary: ${totalFilledSlots}/${totalAssignmentSlots} total assignments, ${updates.length} position updates generated`
    );
    return updates;
  }

  // Function to save assignments to Google Sheets
  async function saveAssignments(): Promise<void> {
    if (!gapi.isSignedIn || !autoSaveEnabled) {
      return;
    }

    try {
      const currentSheetName = gapi.getCurrentSheetName(
        scheduleStore.scheduleDate
      );
      console.log(`🔄 Auto-saving assignments to sheet: "${currentSheetName}"`);

      const assignmentUpdates = await buildAssignmentRows();

      if (assignmentUpdates.length === 0) {
        console.log("⚠️ No valid assignment sections found - nothing to save");
        return;
      }

      await gapi.batchUpdateSheetValues(currentSheetName, assignmentUpdates);

      console.log(
        `✅ Auto-save completed! Updated ${assignmentUpdates.length} position(s) in sheet "${currentSheetName}"`
      );
    } catch (error) {
      console.error("❌ Auto-save failed:", error);
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
    // Force reactivity by depending on refresh counter
    positionsRefreshCounter.value; // This makes the computed property reactive to refresh counter changes

    // Stability check: Don't recalculate during loading phases or when data is inconsistent
    if (isLoadingPositions.value || isLoadingSoldiers.value) {
      console.log(
        `⏸️ Positions computed property skipped during loading phase`
      );
      return [];
    }

    // Don't recalculate if we have no positions or no soldiers yet
    if (gapi.positions.length === 0 || soldiersCache.value.size === 0) {
      console.log(
        `⏸️ Positions computed property skipped - positions: ${gapi.positions.length}, soldiers: ${soldiersCache.value.size}`
      );
      return [];
    }

    // Add call stack info to understand what's triggering recalculations
    const stack =
      new Error().stack?.split("\n").slice(1, 4).join(" -> ") || "unknown";

    const dayStartMinutes = timeToMinutes(dayStart);
    const compareFn = shiftsByStartTimeCompare.bind({}, dayStartMinutes);

    console.log(
      `🔄 Positions computed property recalculating - positions count: ${gapi.positions.length}, soldiers cache: ${soldiersCache.value.size}`
    );
    console.log(`📍 Triggered by: ${stack}`);

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
        if (shiftData.soldierIds && shiftData.soldierIds.length > 0) {
          const validSoldierIds = shiftData.soldierIds.filter(
            (id) => id && id.trim() !== ""
          );
          console.log(
            `🔍 Processing shift ${shiftData.id} in ${positionData.name}: ${validSoldierIds.length} soldier assignments`
          );

          shiftData.soldierIds.forEach((soldierId, index) => {
            // Skip empty soldier IDs (removed assignments)
            if (!soldierId || soldierId.trim() === "") {
              return;
            }

            const soldier = soldiersCache.value.get(soldierId);
            if (!soldier) {
              // Instead of throwing an error, log a warning and skip this soldier
              console.warn(
                `⚠️ Soldier with id ${soldierId} not found in soldiers cache - skipping assignment for position ${positionData.name}, shift ${shiftData.id}. This may indicate stale assignment data.`
              );
              return;
            }

            console.log(
              `🔗 Building position assignment: ${soldier.name} -> ${positionData.name} at index ${index}`
            );

            // Use the specific index to preserve exact spot assignments
            shift.addSoldier(soldier, index);
          });
        }

        position.shifts.push(shift);
      });
      return position;
    });

    // Debug output to track assignment count
    const totalAssignments = result.reduce(
      (count, pos) =>
        count +
        pos.shifts.reduce(
          (shiftCount, shift) =>
            shiftCount + shift.assignments.filter((a) => a.soldier).length,
          0
        ),
      0
    );

    console.log(
      `✅ Positions computed property complete - ${result.length} positions, ${totalAssignments} total assignments`
    );

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
      isProcessingHistorical: gapi.currentProcessingDate !== null, // Track if we're processing historical data
    }),
    ({
      positions: newPositions,
      soldiers: soldiersCount,
      hasAssignments,
      isProcessingHistorical,
    }) => {
      // Skip if we're in the middle of a manual assignment operation
      if (isManualAssignment) {
        return;
      }

      // Skip assignment processing if we're loading historical data
      if (isProcessingHistorical) {
        console.log(
          `🚫 Skipping assignment processing during historical data load (processing date: ${
            gapi.currentProcessingDate
              ? format(gapi.currentProcessingDate, "yyyy-MM-dd")
              : "null"
          })`
        );
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
          // Additional check: ensure current date positions actually have soldier assignments
          // This prevents processing when positions exist but have no assignments
          const currentDateHasActualAssignments = gapi.positions.some((p) =>
            p.shifts.some(
              (s) =>
                s.soldierIds &&
                s.soldierIds.some((id) => id && id.trim() !== "")
            )
          );

          if (!currentDateHasActualAssignments) {
            console.log(
              `🚫 Current date positions have no actual soldier assignments - skipping assignment processing`
            );
            return;
          }

          // Process assignments without triggering the expensive computed unnecessarily
          const processedSoldiers = new Set<string>();
          let totalAssignments = 0;

          // Access positions.value only once to avoid repeated computation
          const computedPositions = positions.value;

          console.log(
            `🔄 Processing assignments for current date positions (${computedPositions.length} positions found)`
          );

          computedPositions.forEach((position) => {
            position.shifts.forEach((shift) => {
              shift.assignments.forEach((assignment, index) => {
                if (assignment.soldier) {
                  totalAssignments++;

                  // Clear assignments only once per soldier (for current date only)
                  if (!processedSoldiers.has(assignment.soldier.id)) {
                    assignmentsStore.clearAssignments(
                      assignment.soldier.id,
                      scheduleStore.scheduleDate || new Date()
                    );
                    processedSoldiers.add(assignment.soldier.id);
                  }

                  // Use the current schedule date for assignments since we're processing current date positions
                  // Historical assignments should not be processed through this watcher
                  const assignmentDate =
                    scheduleStore.scheduleDate || new Date();

                  console.log(
                    `📝 Adding assignment: ${assignment.soldier.id} -> ${
                      position.positionName
                    } on ${format(assignmentDate, "yyyy-MM-dd")}`
                  );

                  assignmentsStore.addAssignment(assignment.soldier.id, {
                    positionId: position.positionId,
                    positionName: position.positionName,
                    shiftId: shift.shiftId,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    assignmentIndex: index,
                    date: assignmentDate,
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
        date: scheduleStore.scheduleDate || new Date(),
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

  // Function to clear session-level historical processing tracking
  function clearHistoricalProcessingCache(): void {
    processedHistoricalDates.clear();
    console.log("🧹 Cleared historical assignment processing cache");
  }

  // Watch for schedule date changes and reload positions
  watch(
    () => ({ date: scheduleStore.scheduleDate, gapiReady: gapi.isSignedIn }),
    async (newState, oldState) => {
      const { date: newDate, gapiReady } = newState;
      const { date: oldDate, gapiReady: oldGapiReady } = oldState || {
        date: undefined,
        gapiReady: false,
      };

      const shouldReload =
        newDate &&
        gapiReady &&
        (newDate !== oldDate || // Date changed
          (gapiReady && !oldGapiReady)); // GAPI just became ready

      if (shouldReload) {
        // Clear existing timeout to debounce rapid date changes
        if (dateChangeTimeoutId) {
          clearTimeout(dateChangeTimeoutId);
        }

        // Debounce the date change processing
        dateChangeTimeoutId = setTimeout(async () => {
          try {
            // CRITICAL: Mark date change as in progress to prevent template loading
            gapi.setDateChangeInProgress(true);

            // Start loading state immediately and keep it consistent
            isLoadingPositions.value = true;
            isLoadingSoldiers.value = true;
            loadingMessage.value = "Loading positions...";

            console.log(
              `📅 Schedule date changed to ${format(
                newDate,
                "yyyy-MM-dd"
              )}, reloading positions...`
            );
            console.log(
              `📊 Previous date was: ${
                oldDate ? format(oldDate, "yyyy-MM-dd") : "undefined"
              }`
            );

            // Step 1: Only clear assignments for the current date (preserve historical data)
            console.log(
              `🗑️ Clearing assignments for new date: ${format(
                newDate,
                "yyyy-MM-dd"
              )}`
            );
            assignmentsStore.clearAssignmentsForDate(newDate);

            // Step 2: Use incremental loading for better performance (loads current + past 3 days)
            loadingMessage.value = "טוען נתונים...";
            console.log(
              `📋 Loading positions incrementally for date range (current + 3 days history)...`
            );
            await gapi.loadPositionsIncremental(newDate, 3);
            console.log(
              `✅ Positions loaded successfully for date: ${format(
                newDate,
                "yyyy-MM-dd"
              )}`
            );

            // Step 3: IMPORTANT - Don't end loading state yet, keep it stable during processing
            loadingMessage.value = "מעבד נתונים...";
            console.log(
              `🔄 Positions loaded, processing assignments while maintaining loading state...`
            );

            // Step 4: Process assignments with a controlled delay
            console.log(
              `🔄 Scheduling assignment processing after data stabilization...`
            );
            setTimeout(() => {
              console.log(
                `🔄 Now executing assignment processing with stable data...`
              );

              // CRITICAL FIX: End loading state BEFORE processing assignments
              // so the computed property can access the loaded data
              console.log(
                `🔄 Ending loading state to allow computed property access to data`
              );
              isLoadingPositions.value = false;
              isLoadingSoldiers.value = false;
              loadingMessage.value = "";

              // Small delay to ensure Vue reactivity processes the state change
              setTimeout(() => {
                // Force refresh to ensure computed property recalculates with stable data
                forcePositionsRefresh();

                // Force assignment recalculation
                forceAssignmentRecalculation();

                // Process historical assignments for past days (but only once per date change)
                console.log(
                  `📚 Processing historical assignments from loaded historical data...`
                );
                let totalHistoricalAssignments = 0;

                // Access the historical positions from gapi store
                if (gapi.getHistoricalPositions) {
                  for (let i = 1; i <= 3; i++) {
                    const pastDate = new Date(newDate);
                    pastDate.setDate(pastDate.getDate() - i);
                    const dateKey = format(pastDate, "yyyy-MM-dd");

                    // Skip if we've already processed this date in this session
                    if (processedHistoricalDates.has(dateKey)) {
                      console.log(
                        `⏭️ Skipping already processed historical date: ${dateKey}`
                      );
                      continue;
                    }

                    const historicalPositions =
                      gapi.getHistoricalPositions(pastDate);
                    if (historicalPositions && historicalPositions.length > 0) {
                      // Clear any existing assignments for this historical date first to prevent duplicates
                      console.log(
                        `🧹 Clearing existing assignments for historical date: ${dateKey}`
                      );
                      assignmentsStore.clearAssignmentsForDate(pastDate);

                      const assignments = processHistoricalAssignments(
                        historicalPositions,
                        pastDate
                      );
                      totalHistoricalAssignments += assignments;
                      processedHistoricalDates.add(dateKey);
                    } else {
                      console.log(
                        `📝 No historical positions found for date: ${dateKey}`
                      );
                    }
                  }
                }

                console.log(
                  `📚 Historical assignment processing complete: ${totalHistoricalAssignments} total historical assignments processed`
                );
                console.log(`✅ All assignment processing complete`);

                // CRITICAL: Mark date change as complete to allow future template loading if needed
                gapi.setDateChangeInProgress(false);
              }, 50); // Small delay to ensure state change is processed
            }, 150); // Increased delay to ensure data stability

            console.log(
              `✅ Date change setup complete - assignments will be processed with stable data`
            );
          } catch (error) {
            console.error("❌ Error reloading positions for new date:", error);
            // End loading state on error
            isLoadingPositions.value = false;
            isLoadingSoldiers.value = false;
            loadingMessage.value = "";

            // CRITICAL: Mark date change as complete even on error
            gapi.setDateChangeInProgress(false);
          } finally {
            dateChangeTimeoutId = null;
          }
        }, 50); // 50ms debounce delay
      }
    },
    { immediate: true } // Trigger on initial setup
  );

  return {
    positions,
    assignSoldiersToShift,
    removeSoldierFromShift,
    setAutoSaveEnabled,
    manualSave,
    forcePositionsRefresh, // Add this for external use if needed
    forceAssignmentRecalculation, // Add this for external use if needed
    processHistoricalAssignments, // Add this for processing historical assignments
    clearHistoricalProcessingCache, // Add this for clearing historical cache
    // Loading states
    isLoadingPositions: computed(() => isLoadingPositions.value),
    isLoadingSoldiers: computed(() => isLoadingSoldiers.value),
    loadingMessage: computed(() => loadingMessage.value),
  };
});
