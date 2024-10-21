import { defineStore } from "pinia";
import { ref } from "vue";
import { useRoute } from "vue-router";
import { PositionDto, SoldierDto } from "../types/client-dto";

export const useGAPIStore = defineStore("gapi", () => {
  const DISCOVERY_DOCS = [
    "https://sheets.googleapis.com/$discovery/rest?version=v4",
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
  ];
  const SCOPE =
    "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly";

  const route = useRoute();
  const isSignedIn = ref<boolean>(false);

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
        updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        resolve();
      });
    });
  }

  function login() {
    gapi.auth2.getAuthInstance().signIn();
  }

  function logout() {
    gapi.auth2.getAuthInstance().signOut();
  }

  function verifyReadiness() {
    if (!isSignedIn.value || !route.params.id) {
      throw new Error(
        `cannot fetch data from google , spid: ${route.params.id}, isSignedIn: ${isSignedIn}`
      );
    }
  }

  function updateSignInStatus(signedIn: boolean) {
    isSignedIn.value = signedIn;
  }

  // DATA FETCH Functions

  async function getData() {
    verifyReadiness();

    return gapi.client.sheets.spreadsheets
      .get({
        spreadsheetId: route.params.id as string,
      })
      .then(function (resp) {
        var r = JSON.parse(resp.body);
        console.log(r);
        return r;
      })
      .catch(function (err) {
        throw { error: err.body };
      });
  }

  async function getSoldiers(): Promise<SoldierDto[]> {
    return Promise.resolve([
      { id: "123", name: "משה אופניק", role: "קצין" },
      { id: "456", name: "בוב ספוג", role: "לוחם" },
      { id: "789", name: "ג'ורג קונסטנזה", role: "לוחם" },
    ]);
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
    isSignedIn,
    getData,
    getPositions,
    getSoldiers,
  };
});
