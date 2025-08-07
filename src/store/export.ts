import { defineStore } from "pinia";
import { ref } from "vue";
import { useRoute } from "vue-router";
import { getHebrewDayName, toHebrewDateString } from "../utils/date-utils";
import { useGAPIStore } from "./gapi";
import { usePositionsStore } from "./positions";
import { useScheduleStore } from "./schedule";

export const useExportStore = defineStore("export", () => {
  const route = useRoute();
  const gapiStore = useGAPIStore();
  const positionsStore = usePositionsStore();
  const scheduleStore = useScheduleStore();

  const isExporting = ref(false);

  // Helper function to get spreadsheet ID from URL
  function getSpreadsheetId(): string {
    const urlHash = window.location.hash;
    const hashMatch = urlHash.match(/#\/spreadsheet\/([^\/\?]+)/);
    return hashMatch ? hashMatch[1] : (route.params.id as string);
  }

  // Generate sheet name from date in the format "שבצק-dd.mm.yy-ייצוא"
  function generateExportSheetName(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().substr(-2);
    return `שבצק-${day}.${month}.${year}-יצוא`;
  }

  // Generate title for the exported sheet (same as print mode)
  function generateExportTitle(date: Date): string {
    const hebrewDay = getHebrewDayName(date);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    const hebrewDate = toHebrewDateString(date);
    return `שבצק ${hebrewDay} ${formattedDate} - ${hebrewDate}`;
  }

  // Delete existing sheet if it exists
  async function deleteExistingSheet(sheetName: string): Promise<void> {
    const sheetExists = await gapiStore.checkSheetExists(sheetName);
    if (sheetExists) {
      const sheetId = await gapiStore.getSheetIdByName(sheetName);
      if (sheetId !== null) {
        const spreadsheetId = getSpreadsheetId();
        const deleteResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${gapiStore.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              requests: [
                {
                  deleteSheet: {
                    sheetId: sheetId,
                  },
                },
              ],
            }),
          }
        );

        if (!deleteResponse.ok) {
          throw new Error("Failed to delete existing sheet");
        }
      }
    }
  }

  // Create new sheet
  async function createNewSheet(sheetName: string): Promise<void> {
    const spreadsheetId = getSpreadsheetId();

    const createResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gapiStore.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: {
                    rowCount: 100,
                    columnCount: 50,
                  },
                },
              },
            },
          ],
        }),
      }
    );

    if (!createResponse.ok) {
      throw new Error("Failed to create sheet");
    }
  }

  // Prepare export data from positions with 24-hour alignment starting from dayStart
  function prepareExportData() {
    const positions = positionsStore.positions;
    // dayStart is used in the createMergedCells function
    const dayStart = gapiStore.dayStart;
    const currentDate = scheduleStore.scheduleDate || new Date();
    const positionData = new Map<
      string,
      Map<string, { soldiers: string[]; shiftId: string }>
    >();

    // Generate 24 hours starting from dayStart
    const hours: string[] = [];
    const startHour = parseInt(dayStart.split(":")[0]);
    const startMinute = parseInt(dayStart.split(":")[1]);

    // Create 24 hours starting from dayStart
    for (let i = 0; i < 24; i++) {
      const hour = (startHour + i) % 24;
      const hourStr = `${hour.toString().padStart(2, "0")}:${startMinute
        .toString()
        .padStart(2, "0")}`;
      hours.push(hourStr);
    }

    // Initialize position data for all hours
    positions.forEach((position) => {
      positionData.set(position.positionName, new Map());
      hours.forEach((hour) => {
        positionData
          .get(position.positionName)!
          .set(hour, { soldiers: [], shiftId: "" });
      });
    });

    // Collect shift data and map to the aligned hours
    positions.forEach((position) => {
      position.shifts.forEach((shift) => {
        const startHour = shift.startTime;
        const endHour = shift.endTime;

        // Convert times to hour values for comparison
        const shiftStartHour = parseInt(startHour.split(":")[0]);
        const shiftEndHour = parseInt(endHour.split(":")[0]);

        // Get all soldiers for this shift (will be shown in merged cell)
        const shiftSoldiers: string[] = [];
        shift.assignments.forEach((assignment) => {
          if (
            assignment.soldier &&
            !shiftSoldiers.includes(assignment.soldier.name)
          ) {
            shiftSoldiers.push(assignment.soldier.name);
          }
        });

        // Map each hour in the shift to the aligned schedule
        let hoursInShift = 0;
        let firstHourFound = false;

        for (let i = 0; i < 24; i++) {
          const hourStr = hours[i];
          const hourValue = parseInt(hourStr.split(":")[0]);

          // Check if this hour is within the shift
          let isInShift = false;

          if (shiftEndHour > shiftStartHour) {
            // Normal shift (e.g., 6:00-14:00)
            isInShift = hourValue >= shiftStartHour && hourValue < shiftEndHour;
          } else {
            // Overnight shift (e.g., 22:00-06:00)
            isInShift = hourValue >= shiftStartHour || hourValue < shiftEndHour;
          }

          if (isInShift) {
            hoursInShift++;

            // Set shift ID for this hour (even if no assignments)
            positionData.get(position.positionName)!.get(hourStr)!.shiftId =
              shift.shiftId;

            // FIXED: Add soldiers to the first hour of the shift that we encounter
            // This ensures all soldiers are included regardless of dayStart alignment
            if (!firstHourFound && shiftSoldiers.length > 0) {
              firstHourFound = true;
              const soldiersArray = positionData
                .get(position.positionName)!
                .get(hourStr)!.soldiers;
              shiftSoldiers.forEach((soldierName) => {
                if (!soldiersArray.includes(soldierName)) {
                  soldiersArray.push(soldierName);
                }
              });
            }
          }
        }
      });
    });

    // Prepare table data
    const tableData: string[][] = [];

    // Title row: merged across all columns
    const title = generateExportTitle(currentDate);
    const titleRow = [title, ...Array(positions.length).fill("")];
    tableData.push(titleRow);

    // Header row: position names
    const headerRow = ["שעות", ...positions.map((p) => p.positionName)];
    tableData.push(headerRow);

    // Data rows: hours and assignments
    let totalSoldiersInExport = 0;
    hours.forEach((hour) => {
      const row = [hour];

      positions.forEach((position) => {
        const data = positionData.get(position.positionName)?.get(hour);
        const soldiers = data ? data.soldiers.join("\n") : "";

        if (data && data.soldiers.length > 0) {
          totalSoldiersInExport += data.soldiers.length;
        }

        row.push(soldiers);
      });
      tableData.push(row);
    });

    return { tableData, sortedHours: hours, positionData };
  }

  // Create merged cells for shifts
  async function createMergedCells(
    sheetName: string,
    sortedHours: string[]
  ): Promise<void> {
    const mergeRequests: any[] = [];
    const formatRequests: any[] = [];
    const sheetId = await gapiStore.getSheetIdByName(sheetName);

    if (sheetId !== null) {
      const positions = positionsStore.positions;
      const spreadsheetId = getSpreadsheetId();

      positions.forEach((position, positionIndex) => {
        const columnIndex = positionIndex + 1; // +1 because first column is hours

        // Process each shift directly from the position
        position.shifts.forEach((shift) => {
          const startHour = shift.startTime;
          const endHour = shift.endTime;

          // Only create merge requests for shifts that have soldiers assigned
          const soldiersInShift = shift.assignments.filter(
            (a) => a.soldier
          ).length;

          // Convert times to hour values for comparison (same logic as prepareExportData)
          const shiftStartHour = parseInt(startHour.split(":")[0]);
          const shiftEndHour = parseInt(endHour.split(":")[0]);

          // Find the start and end row indices for this shift
          let shiftStartRow = -1;
          let shiftEndRow = -1;

          sortedHours.forEach((hourStr, hourIndex) => {
            const hourValue = parseInt(hourStr.split(":")[0]);

            // Check if this hour is within the shift (same logic as prepareExportData)
            let isInShift = false;

            if (shiftEndHour > shiftStartHour) {
              // Normal shift (e.g., 6:00-14:00)
              isInShift =
                hourValue >= shiftStartHour && hourValue < shiftEndHour;
            } else {
              // Overnight shift (e.g., 22:00-06:00)
              isInShift =
                hourValue >= shiftStartHour || hourValue < shiftEndHour;
            }

            if (isInShift) {
              if (shiftStartRow === -1) {
                shiftStartRow = hourIndex + 2; // +2 because of title row
              }
              shiftEndRow = hourIndex + 2;
            }
          });

          // For empty shifts, we need to be more selective about merging
          if (soldiersInShift === 0) {
            // Calculate the visual span of this shift
            const shiftSpan = shiftEndRow - shiftStartRow + 1;
            const totalRows = 24; // 24 hours in the export

            // Only merge empty shifts that don't span the entire column
            // This allows visual consistency for partial empty shifts while avoiding full-column overwrites
            if (shiftSpan >= totalRows) {
              return; // Skip empty shifts that span the entire column
            }
          }

          // Create merge request for this shift if it has a valid range
          if (shiftStartRow !== -1 && shiftEndRow >= shiftStartRow) {
            mergeRequests.push({
              mergeCells: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: shiftStartRow,
                  endRowIndex: shiftEndRow + 1,
                  startColumnIndex: columnIndex,
                  endColumnIndex: columnIndex + 1,
                },
                mergeType: "MERGE_ALL",
              },
            });

            // Add formatting request for center alignment and borders
            formatRequests.push({
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: shiftStartRow,
                  endRowIndex: shiftEndRow + 1,
                  startColumnIndex: columnIndex,
                  endColumnIndex: columnIndex + 1,
                },
                cell: {
                  userEnteredFormat: {
                    horizontalAlignment: "CENTER",
                    verticalAlignment: "MIDDLE",
                    wrapStrategy: "WRAP",
                    borders: {
                      top: { style: "SOLID" },
                      bottom: { style: "SOLID" },
                      left: { style: "SOLID" },
                      right: { style: "SOLID" },
                    },
                  },
                },
                fields:
                  "userEnteredFormat(horizontalAlignment,verticalAlignment,wrapStrategy,borders)",
              },
            });
          }
        });
      });

      // Apply merge and format requests
      if (mergeRequests.length > 0 || formatRequests.length > 0) {
        const allRequests = [...mergeRequests, ...formatRequests];
        const mergeResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${gapiStore.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              requests: allRequests,
            }),
          }
        );

        if (!mergeResponse.ok) {
          throw new Error("Failed to merge cells and apply formatting");
        }
      }
    }
  }

  // Merge title row and format all elements
  async function mergeTitleAndFormat(sheetName: string): Promise<void> {
    const sheetId = await gapiStore.getSheetIdByName(sheetName);
    if (sheetId !== null) {
      const positions = positionsStore.positions;
      const spreadsheetId = getSpreadsheetId();
      const formatResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${gapiStore.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              // Merge title row across all columns
              {
                mergeCells: {
                  range: {
                    sheetId: sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: positions.length + 1,
                  },
                  mergeType: "MERGE_ALL",
                },
              },
              // Format title row (row 1) - bold and centered with borders
              {
                repeatCell: {
                  range: {
                    sheetId: sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: positions.length + 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      horizontalAlignment: "CENTER",
                      verticalAlignment: "MIDDLE",
                      textFormat: {
                        bold: true,
                        fontSize: 14,
                      },
                      borders: {
                        top: { style: "SOLID" },
                        bottom: { style: "SOLID" },
                        left: { style: "SOLID" },
                        right: { style: "SOLID" },
                      },
                    },
                  },
                  fields:
                    "userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat,borders)",
                },
              },
              // Format header row (row 2) - bold and centered with borders
              {
                repeatCell: {
                  range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    endRowIndex: 2,
                    startColumnIndex: 0,
                    endColumnIndex: positions.length + 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      horizontalAlignment: "CENTER",
                      verticalAlignment: "MIDDLE",
                      textFormat: {
                        bold: true,
                      },
                      borders: {
                        top: { style: "SOLID" },
                        bottom: { style: "SOLID" },
                        left: { style: "SOLID" },
                        right: { style: "SOLID" },
                      },
                    },
                  },
                  fields:
                    "userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat,borders)",
                },
              },
              // Format time column (column A) - bold and centered with borders
              {
                repeatCell: {
                  range: {
                    sheetId: sheetId,
                    startRowIndex: 2,
                    endRowIndex: 26, // 24 hours + 2 header rows
                    startColumnIndex: 0,
                    endColumnIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      horizontalAlignment: "CENTER",
                      verticalAlignment: "MIDDLE",
                      textFormat: {
                        bold: true,
                      },
                      borders: {
                        top: { style: "SOLID" },
                        bottom: { style: "SOLID" },
                        left: { style: "SOLID" },
                        right: { style: "SOLID" },
                      },
                    },
                  },
                  fields:
                    "userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat,borders)",
                },
              },
            ],
          }),
        }
      );

      if (!formatResponse.ok) {
        throw new Error("Failed to merge title and format elements");
      }
    }
  }

  // Set RTL direction for the sheet
  async function setRTLDirection(sheetName: string): Promise<void> {
    const sheetId = await gapiStore.getSheetIdByName(sheetName);
    if (sheetId !== null) {
      const spreadsheetId = getSpreadsheetId();
      const rtlResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${gapiStore.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                updateSheetProperties: {
                  properties: {
                    sheetId: sheetId,
                    rightToLeft: true,
                  },
                  fields: "rightToLeft",
                },
              },
            ],
          }),
        }
      );

      if (!rtlResponse.ok) {
        throw new Error("Failed to set RTL direction");
      }
    }
  }

  // Main export function
  async function exportToSheet(): Promise<{
    sheetName: string;
    sheetUrl: string;
  }> {
    if (isExporting.value) return { sheetName: "", sheetUrl: "" };

    // Check if positions are loaded
    if (!positionsStore.positions || positionsStore.positions.length === 0) {
      throw new Error("אין נתונים ליצוא");
    }

    try {
      isExporting.value = true;

      const currentDate = scheduleStore.scheduleDate || new Date();
      const sheetName = generateExportSheetName(currentDate);

      // Delete existing sheet if it exists
      await deleteExistingSheet(sheetName);

      // Create new sheet
      await createNewSheet(sheetName);

      // Prepare export data
      const { tableData, sortedHours } = prepareExportData();

      // Write data to sheet
      await gapiStore.updateSheetValues(sheetName, "A1:Z100", tableData);

      // Create merged cells for shifts
      await createMergedCells(sheetName, sortedHours);

      // Set RTL direction
      await setRTLDirection(sheetName);

      // Merge title and format all elements
      await mergeTitleAndFormat(sheetName);

      // Get the sheet ID to generate the correct URL
      const sheetId = await gapiStore.getSheetIdByName(sheetName);
      const spreadsheetId = getSpreadsheetId();
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`;

      return { sheetName, sheetUrl };
    } catch (error) {
      console.error("Export error:", error);
      throw error;
    } finally {
      isExporting.value = false;
    }
  }

  return {
    isExporting,
    exportToSheet,
  };
});
