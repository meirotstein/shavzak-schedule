import { addDays, parse } from "date-fns";
import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { SchedulerError } from "../errors/scheduler-error";
import {
  AssignmentDefDto,
  PositionDto,
  PresenceDto,
  SoldierDto,
  SoldierPresenceDto,
} from "../types/client-dto";
import { ShiftHours } from "../types/shift-hours";

export const useGAPIStore = defineStore("gapi", () => {
  const DISCOVERY_DOCS = [
    "https://sheets.googleapis.com/$discovery/rest?version=v4",
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
  ];
  const SCOPE =
    "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly";

  const SHEETS = {
    SETTINGS: "settings",
    SOLDIERS: "חיילים",
    POSITIONS: "עמדות",
    PRESENCE: "נוכחות",
  };

  const TITLES = {
    POSITION: "עמדה",
    ROLE: "תפקיד",
    SHIFT: "משמרת",
    ASSIGNMENT: "שיבוץ",
  };

  const route = useRoute();
  const isSignedIn = ref<boolean>(false);

  const settings = reactive({
    soldiersMaxAmount: 200,
    presenceNameColumn: 2,
    presenceNameFirstRow: 13,
  });

  const soldiers = reactive<SoldierDto[]>([]);
  const positions = reactive<PositionDto[]>([]);
  const presence = reactive<PresenceDto>({
    start: undefined,
    end: undefined,
    soldiersPresence: {},
  });

  async function load(): Promise<void> {
    return new Promise((resolve) => {
      gapi.load("client", async () => {
        await gapi.client.init({
          clientId: import.meta.env.VITE_APP_GOOGLE_CLIENT_ID,
          apiKey: import.meta.env.VITE_APP_GOOGLE_API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPE,
        });
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
        await updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        resolve();
      });
    });
  }

  async function loadSettings(): Promise<void> {
    verifyReadiness();

    const settingsRaw = await fetchSheetValues(SHEETS.SETTINGS, "A1", "L50");
    if (!settingsRaw.length) {
      console.error("unexpected settings response");
      return;
    }
    settings.soldiersMaxAmount = settingsRaw[0][5];
    settings.presenceNameColumn = settingsRaw[0][1];
    settings.presenceNameFirstRow = settingsRaw[1][1];
  }

  function login() {
    gapi.auth2.getAuthInstance().signIn();
  }

  function logout() {
    gapi.auth2.getAuthInstance().signOut();
  }

  async function fetchSheetValues(
    name: string,
    fromCell: string,
    toCell: string
  ) {
    const { body } = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: route.params.id as string,
      range: `${name}!${fromCell}:${toCell}`,
    });

    const response = JSON.parse(body);
    return response.values;
  }

  async function updateSheetValues(
    name: string,
    range: string,
    values: any[][]
  ): Promise<void> {
    verifyReadiness();

    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: route.params.id as string,
      range: `${name}!${range}`,
      valueInputOption: "RAW",
      resource: {
        values: values,
      },
    });
  }

  async function batchUpdateSheetValues(
    name: string,
    updates: Array<{ range: string; values: any[][] }>
  ): Promise<void> {
    verifyReadiness();

    const data = updates.map((update) => ({
      range: `${name}!${update.range}`,
      values: update.values,
    }));

    await gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: route.params.id as string,
      resource: {
        valueInputOption: "RAW",
        data: data,
      },
    });
  }

  function verifyReadiness() {
    if (!isSignedIn.value || !route.params.id) {
      throw new Error(
        `cannot fetch data from google , spid: ${route.params.id}, isSignedIn: ${isSignedIn}`
      );
    }
  }

  async function updateSignInStatus(signedIn: boolean) {
    isSignedIn.value = signedIn;
    console.log(`user is ${signedIn ? "signed in" : "signed out"}`);

    if (signedIn) {
      await loadSettings();
      await loadSoldiers();
      await loadPositions();
      await loadPresence();
    }
  }

  async function loadSoldiers(): Promise<void> {
    if (!isSignedIn.value) return;

    const soldiersListOffset = 3;
    const soldiersRaw = await fetchSheetValues(
      SHEETS.SOLDIERS,
      "A3",
      `E${settings.soldiersMaxAmount + soldiersListOffset}`
    );

    console.log("soldiers loaded", soldiersRaw.length);

    const soldiersArr = soldiersRaw as Array<
      Array<
        [
          /* id */ number,
          /* full name */ string,
          /* platoon */ number | string,
          /* role */ string,
          /* description */ string
        ]
      >
    >;

    soldiers.push(
      ...soldiersArr
        .filter((soldier) => soldier.length === 5) // filter empty rows
        .map((soldier) => ({
          id: soldier[0] + "",
          name: soldier[1] + "",
          platoon: soldier[2] + "",
          role: soldier[3] + "",
          description: soldier[4] + "",
        }))
    );
  }

  async function loadPositions(): Promise<void> {
    if (!isSignedIn.value) return;

    const positionsRaw: Array<Array<string>> = await fetchSheetValues(
      SHEETS.POSITIONS,
      "A1",
      "AZ100"
    );

    console.log("positions loaded", positionsRaw);

    if (!positionsRaw.length) {
      console.warn("no positions def found");
      return;
    }

    type positionState = {
      index: number;
      position: PositionDto;
      currentTitle?: string;
      currentShiftId?: string;
      overrideAssignments?: boolean;
      defaultAssignments: AssignmentDefDto[];
      assignmentIndex?: number;
      totalAssignmentSlots?: number;
    };

    const positionsState: Array<positionState> = [];
    const positionsRow = positionsRaw[0];
    for (let i = 0; i < positionsRow.length; ++i) {
      if (positionsRow[i] === TITLES.POSITION) {
        positionsState.push({
          index: i,
          position: {
            id: `pos-${i}`,
            name: positionsRow[i + 1],
            shifts: [],
          },
          defaultAssignments: [],
          assignmentIndex: undefined,
          totalAssignmentSlots: undefined,
        });
      }
    }

    positionsRaw.slice(1).forEach((row, rowIdx) => {
      let state: positionState | undefined;
      for (let i = 0; i < row.length; ++i) {
        switch (row[i]) {
          case TITLES.ROLE:
            state = positionsState.find((p) => p.index === i);
            if (!state) {
              throw new SchedulerError(`positions: wrong ${TITLES.ROLE} index`);
            }
            state.currentTitle = TITLES.ROLE;
            if (!state.currentShiftId) {
              state.defaultAssignments.push({ roles: [] });
            } else {
              const shift = state.position.shifts.find(
                (s) => s.id === state!.currentShiftId
              )!;
              if (!state.overrideAssignments) {
                state.overrideAssignments = true;
                shift.assignmentDefs = [{ roles: [] }];
              } else {
                shift.assignmentDefs.push({ roles: [] });
              }
            }
            break;
          case TITLES.SHIFT:
            state = positionsState.find((p) => p.index === i);
            if (!state) {
              throw new SchedulerError(
                `positions: wrong ${TITLES.SHIFT} index`
              );
            }
            state.overrideAssignments = false;
            state.currentTitle = TITLES.SHIFT;
            state.currentShiftId = `${state.position.id}-shift-${rowIdx}`;
            state.position.shifts.push({
              id: state.currentShiftId,
              startTime: row[i + 1] as ShiftHours,
              endTime: row[i + 2] as ShiftHours,
              assignmentDefs: state.defaultAssignments,
              soldierIds: [],
            });
            break;
          case TITLES.ASSIGNMENT:
            state = positionsState.find((p) => p.index === i);
            if (!state) {
              throw new SchedulerError(
                `positions: wrong ${TITLES.ASSIGNMENT} index`
              );
            }
            state.currentTitle = TITLES.ASSIGNMENT;
            
            // Only initialize assignment tracking once per position (not for every שיבוץ row)
            if (state.assignmentIndex === undefined) {
              state.assignmentIndex = 0;
              // Pre-calculate total assignment slots for this position
              state.totalAssignmentSlots = state.position.shifts.reduce(
                (total, shift) => total + shift.assignmentDefs.length, 
                0
              );
              // Initialize soldierIds arrays with proper length for each shift
              state.position.shifts.forEach(shift => {
                if (!shift.soldierIds) {
                  shift.soldierIds = [];
                }
                // Pre-fill with empty strings to match assignment slots
                while (shift.soldierIds.length < shift.assignmentDefs.length) {
                  shift.soldierIds.push("");
                }
              });
            }
            
            // Process this שיבוץ row as an assignment
            const assignmentIndex = state.assignmentIndex || 0;
            const assignmentValue = row[i + 1] || ""; // Get value from next column, or empty
            
            console.log(`🔍 Loading assignment ${assignmentIndex}: "${assignmentValue}" for position ${state.position.name}`);
            console.log(`📊 Position has ${state.position.shifts.length} shifts:`);
            state.position.shifts.forEach((shift, idx) => {
              console.log(`   Shift ${idx} (${shift.id}): ${shift.assignmentDefs.length} slots`);
            });
            
            // Find the shift and spot index based on sequential assignment index
            let currentIndex = assignmentIndex;
            let targetShift = null;
            let targetSpotIndex = -1;
            
            console.log(`🔢 Calculating placement for assignment index ${assignmentIndex}:`);
            
            for (let shiftIdx = 0; shiftIdx < state.position.shifts.length; shiftIdx++) {
              const shift = state.position.shifts[shiftIdx];
              const shiftSlots = shift.assignmentDefs.length;
              console.log(`   Checking shift ${shiftIdx} (${shift.id}): currentIndex=${currentIndex}, shiftSlots=${shiftSlots}`);
              if (currentIndex < shiftSlots) {
                targetShift = shift;
                targetSpotIndex = currentIndex;
                console.log(`   ✅ Found target: shift ${shiftIdx} (${shift.id}), spot ${targetSpotIndex}`);
                break;
              }
              currentIndex -= shiftSlots;
              console.log(`   ⏭️ Moving to next shift, remaining currentIndex=${currentIndex}`);
            }
            
            if (targetShift && targetSpotIndex >= 0) {
              console.log(`📍 Placing "${assignmentValue}" in shift ${targetShift.id} at spot ${targetSpotIndex}`);
              
              // Place the soldier in the exact spot (preserving empty spots)
              if (!targetShift.soldierIds) {
                targetShift.soldierIds = [];
              }
              // Ensure the array is long enough
              while (targetShift.soldierIds.length <= targetSpotIndex) {
                targetShift.soldierIds.push("");
              }
              // Store the soldier ID or empty string
              targetShift.soldierIds[targetSpotIndex] = assignmentValue;
              
              console.log(`✅ Result: shift ${targetShift.id} soldierIds: [${targetShift.soldierIds.join(', ')}]`);
              
              // Increment assignment index for next assignment
              state.assignmentIndex = (state.assignmentIndex || 0) + 1;
            }
            break;
          default:
            if (!state) break;
            if (state.currentTitle === TITLES.ROLE) {
              if (!row[i]) break; // Skip empty roles
              if (state.currentShiftId) {
                const shift = state.position.shifts.find(
                  (s) => s.id === state!.currentShiftId
                )!;
                const assignment =
                  shift.assignmentDefs[shift.assignmentDefs.length - 1];
                assignment.roles.push(row[i]);
              } else {
                                const defaultAssignments =
                  state.defaultAssignments[state.defaultAssignments.length - 1];
                defaultAssignments.roles.push(row[i]);
              }
            }
        }
      }
    });

    console.log("positions data", positionsState);

    positions.push(...positionsState.map((p) => p.position));
    console.log("positions store", positions);
  }

  async function loadPresence(): Promise<void> {
    verifyReadiness();

    const presenceRaw = await fetchSheetValues(
      SHEETS.PRESENCE,
      "A1",
      // TODO: calculate the end column by fetching dates and calculate period length (require additional API call)
      `ZA${
        Number(settings.soldiersMaxAmount) +
        Number(settings.presenceNameFirstRow)
      }`
    );

    console.log("presence loaded", presenceRaw);

    if (!presenceRaw.length) {
      console.error("unexpected presence response");
      return;
    }

    presence.start = parse(presenceRaw[0][1], "yyyy-MM-dd", new Date());
    presence.end = parse(presenceRaw[1][1], "yyyy-MM-dd", new Date());

    for (
      let i = settings.presenceNameFirstRow - 1;
      i < presenceRaw.length;
      ++i
    ) {
      const row = presenceRaw[i];
      const soldierDescription = row[settings.presenceNameColumn - 1];
      if (!soldierDescription) {
        continue;
      }

      const soldier = soldiers.find(
        (s) => s.description.trim() === soldierDescription.trim()
      );

      if (!soldier) {
        console.error("soldier not found", soldierDescription);
        continue;
      }

      const soldierPresence: SoldierPresenceDto = {
        presence: [],
      };

      let currentDay = presence.start;

      for (let j = settings.presenceNameColumn; j < row.length; ++j) {
        const presenceStateValue = row[j];

        soldierPresence.presence.push({
          day: currentDay,
          presence: presenceStateValue,
        });

        currentDay = addDays(currentDay, 1);
      }

      presence.soldiersPresence[soldier.id] = soldierPresence;
    }

    console.log("presence parsed", presence);
  }

  return {
    load,
    login,
    logout,
    fetchSheetValues,
    updateSheetValues,
    batchUpdateSheetValues,
    soldiers,
    positions,
    presence,
    isSignedIn,
    settings,
    SHEETS,
    TITLES,
  };
});
