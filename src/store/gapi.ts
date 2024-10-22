import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { PositionDto, SoldierDto } from "../types/client-dto";

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
  };

  const route = useRoute();
  const isSignedIn = ref<boolean>(false);

  const settings = reactive({
    soldiersMaxAmount: 200,
  });

  const soldiers = ref<SoldierDto[]>([]);

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
      console.error('unexpected settings response');
      return;
    }
    settings.soldiersMaxAmount = settingsRaw[0][5];
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
      valueRenderOption: "UNFORMATTED_VALUE",
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
      await Promise.all([loadSoldiers()]);
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

    const soldiresArr = soldiersRaw as Array<
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

    soldiers.value = soldiresArr
      .filter((soldier) => soldier.length === 5) // filter empty rows
      .map((soldier) => ({
        id: soldier[0] + "",
        name: soldier[1] + "",
        role: soldier[3] + "",
      }));
  }

  async function getPositions(): Promise<PositionDto[]> {
    return Promise.resolve([
      {
        id: "1",
        name: "ש.ג.",
        shifts: [
          {
            id: "1",
            startTime: "00:00",
            endTime: "02:00",
            assignmentDefs: [{ roles: ["קצין", "לוחם"] }, { roles: ["לוחם"] }],
            // soldierIds: ['123', '456']
          },
          {
            id: "2",
            startTime: "14:00",
            endTime: "16:00",
            assignmentDefs: [{ roles: ["קצין", "לוחם"] }, { roles: ["לוחם"] }],
            // soldierIds: ['123', '456']
          },
        ],
      },
      {
        id: "2",
        name: "סיור",
        shifts: [
          {
            id: "1",
            startTime: "00:00",
            endTime: "04:00",
            assignmentDefs: [{ roles: ["קצין"] }],
            // soldierIds: ['123', '789']
          },
          {
            id: "2",
            startTime: "04:00",
            endTime: "08:00",
            assignmentDefs: [{ roles: ["לוחם"] }],
            // soldierIds: ['123', '789']
          },
          {
            id: "3",
            startTime: "08:00",
            endTime: "12:00",
            assignmentDefs: [{ roles: ["לוחם"] }],
            // soldierIds: ['123', '789']
          },
          {
            id: "4",
            startTime: "16:00",
            endTime: "20:00",
            assignmentDefs: [{ roles: ["לוחם"] }],
            // soldierIds: ['123', '789']
          },
          {
            id: "5",
            startTime: "20:00",
            endTime: "00:00",
            assignmentDefs: [{ roles: ["לוחם"] }],
            // soldierIds: ['123', '789']
          },
        ],
      },
    ]);
  }

  return {
    load,
    login,
    logout,
    soldiers,
    isSignedIn,
    settings,
    getPositions,
  };
});
