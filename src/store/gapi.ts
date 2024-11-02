import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { SchedulerError } from "../errors/scheduler-error";
import { AssignmentDefDto, PositionDto, SoldierDto } from "../types/client-dto";
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
  };

  const route = useRoute();
  const isSignedIn = ref<boolean>(false);

  const settings = reactive({
    soldiersMaxAmount: 200,
    presenceNameColumn: 2,
    presenceNameFirstRow: 13,
  });

  const soldiers = ref<SoldierDto[]>([]);
  const positions = ref<PositionDto[]>([]);

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

    soldiers.value = soldiersArr
      .filter((soldier) => soldier.length === 5) // filter empty rows
      .map((soldier) => ({
        id: soldier[0] + "",
        name: soldier[1] + "",
        role: soldier[3] + "",
      }));
  }

  async function loadPositions(): Promise<void> {
    if (!isSignedIn.value) return;

    const TITLES = {
      POSITION: "עמדה",
      ROLE: "תפקיד",
      SHIFT: "משמרת",
      ASSIGNMENT: "שיבוץ",
    };

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
            const nextUnassignedShift = state.position.shifts.find(
              (s) => (s.soldierIds || []).length < s.assignmentDefs.length
            );
            state.currentShiftId = nextUnassignedShift?.id;
            break;
          default:
            if (!state || !row[i]) break;
            if (state.currentTitle === TITLES.ROLE) {
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
            if (state.currentTitle === TITLES.ASSIGNMENT) {
              const shift = state.position.shifts.find(
                (s) => s.id === state!.currentShiftId
              )!;
              shift.soldierIds!.push(row[i]);
            }
        }
      }
    });

    console.log("positions data", positionsState);

    positions.value = positionsState.map((p) => p.position);
    console.log("positions store", positions.value);
  }

  return {
    load,
    login,
    logout,
    soldiers,
    positions,
    isSignedIn,
    settings,
  };
});
