import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useGAPIStore } from "../../src/store/gapi";

vi.mock("vue-router", () => {
  return {
    useRoute: () => ({
      params: { id: "123" },
    }),
  };
});

const gapiMock = {
  load: function (api: string, callback: Function) {
    callback();
  },
  client: {
    init: vi.fn(),
    sheets: {
      spreadsheets: {
        values: {
          get: vi.fn(),
        },
      },
    },
  },
  auth2: {
    getAuthInstance: () => ({
      isSignedIn: {
        listen: vi.fn(),
        get: () => true,
      },
    }),
  },
};

vi.stubGlobal("gapi", gapiMock);

describe("google api client store tests", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  test("gapi store load with successful login is expected to init gapi and load sheet's data", async () => {
    gapiMock.client.sheets.spreadsheets.values.get.mockResolvedValue({
      body: JSON.stringify({ values: [] }),
    });

    const store = useGAPIStore();

    await store.load();

    expect(store.isSignedIn).toBe(true);

    expect(gapiMock.client.init).toBeCalledWith({
      apiKey: expect.any(String),
      clientId: expect.any(String),
      discoveryDocs: expect.any(Array<string>),
      scope: expect.any(String),
    });

    // expect load of settings from sheet
    expect(gapiMock.client.sheets.spreadsheets.values.get).toBeCalledWith({
      spreadsheetId: "123",
      range: expect.stringMatching(/^settings/),
    });

    // expect load of soldiers from sheet
    expect(gapiMock.client.sheets.spreadsheets.values.get).toBeCalledWith({
      spreadsheetId: "123",
      range: expect.stringMatching(/^חיילים/),
    });

    // expect load of positions from sheet
    expect(gapiMock.client.sheets.spreadsheets.values.get).toBeCalledWith({
      spreadsheetId: "123",
      range: expect.stringMatching(/^עמדות/),
    });
  });

  test("load of settings", async () => {
    const soldiersMaxAmountMock = 42;
    const presenceNameColumnMock = 4;
    const presenceNameFirstRowMock = 20;
    gapiMock.client.sheets.spreadsheets.values.get.mockImplementation(
      (params: { range: string }) => {
        if (params.range.startsWith("settings")) {
          return {
            body: JSON.stringify({
              values: [
                [, presenceNameColumnMock, , , , soldiersMaxAmountMock],
                [, presenceNameFirstRowMock, , , ,],
              ],
            }),
          };
        }
        return {
          body: JSON.stringify({ values: [] }),
        };
      }
    );

    const store = useGAPIStore();

    await store.load();

    expect(store.settings.soldiersMaxAmount).toBe(soldiersMaxAmountMock);
    expect(store.settings.presenceNameColumn).toBe(presenceNameColumnMock);
    expect(store.settings.presenceNameFirstRow).toBe(presenceNameFirstRowMock);
  });

  test("load of soldiers", async () => {
    const mockData = {
      id: 121212,
      name: "משה אופניק",
      role: "לוחם",
      platoon: 1,
      description: "משה אופניק [לוחם] 1",
    };
    gapiMock.client.sheets.spreadsheets.values.get.mockImplementation(
      (params: { range: string }) => {
        if (params.range.startsWith("חיילים")) {
          return {
            body: JSON.stringify({
              values: [
                [
                  mockData.id,
                  mockData.name,
                  mockData.platoon,
                  mockData.role,
                  mockData.description,
                ],
              ],
            }),
          };
        }
        return {
          body: JSON.stringify({ values: [] }),
        };
      }
    );

    const store = useGAPIStore();

    await store.load();

    expect(store.soldiers).toStrictEqual([
      { id: mockData.id + "", name: mockData.name, role: mockData.role },
    ]);
  });

  test("load of positions", async () => {
    gapiMock.client.sheets.spreadsheets.values.get.mockImplementation(
      (params: { range: string }) => {
        if (params.range.startsWith("עמדות")) {
          return {
            body: JSON.stringify({
              values: [
                ["עמדה", "סיור", "", "עמדה", "ש.ג."],
                ["תפקיד", "מפקד", "קצין", "תפקיד", "לוחם"],
                ["תפקיד", "לוחם", "", "תפקיד", "לוחם"],
                ["תפקיד", "לוחם", "", "משמרת", "14:00", "18:00"],
                ["תפקיד", "לוחם", "", "משמרת", "18:00", "22:00"],
                ["משמרת", "14:00", "22:00", "משמרת", "22:00", "2:00"],
                ["משמרת", "22:00", "6:00", "משמרת", "2:00", "6:00"],
                ["תפקיד", "קצין", "", "משמרת", "6:00", "10:00"],
                ["תפקיד", "לוחם", "", "משמרת", "10:00", "14:00"],
                ["משמרת", "6:00", "14:00", "שיבוץ", "6097455"],
                ["שיבוץ", "8155316", "", "שיבוץ", "8689463"],
                ["שיבוץ", "7233957"],
              ],
            }),
          };
        }
        return {
          body: JSON.stringify({ values: [] }),
        };
      }
    );

    const store = useGAPIStore();

    await store.load();

    expect(store.positions).toStrictEqual([
      {
        id: "pos-0",
        name: "סיור",
        shifts: [
          {
            assignmentDefs: [
              {
                roles: ["מפקד", "קצין"],
              },
              {
                roles: ["לוחם"],
              },
              {
                roles: ["לוחם"],
              },
              {
                roles: ["לוחם"],
              },
            ],
            endTime: "22:00",
            id: "pos-0-shift-4",
            soldierIds: ["8155316", "7233957"],
            startTime: "14:00",
          },
          {
            assignmentDefs: [
              {
                roles: ["קצין"],
              },
              {
                roles: ["לוחם"],
              },
            ],
            endTime: "6:00",
            id: "pos-0-shift-5",
            soldierIds: [],
            startTime: "22:00",
          },
          {
            assignmentDefs: [
              {
                roles: ["מפקד", "קצין"],
              },
              {
                roles: ["לוחם"],
              },
              {
                roles: ["לוחם"],
              },
              {
                roles: ["לוחם"],
              },
            ],
            endTime: "14:00",
            id: "pos-0-shift-8",
            soldierIds: [],
            startTime: "6:00",
          },
        ],
      },
      {
        id: "pos-3",
        name: "ש.ג.",
        shifts: [
          {
            assignmentDefs: [
              {
                roles: ["לוחם"],
              },
              {
                roles: ["לוחם"],
              },
            ],
            endTime: "18:00",
            id: "pos-3-shift-2",
            soldierIds: ["6097455", "8689463"],
            startTime: "14:00",
          },
          {
            assignmentDefs: [
              {
                roles: ["לוחם"],
              },
              {
                roles: ["לוחם"],
              },
            ],
            endTime: "22:00",
            id: "pos-3-shift-3",
            soldierIds: [],
            startTime: "18:00",
          },
          {
            assignmentDefs: [
              {
                roles: ["לוחם"],
              },
              {
                roles: ["לוחם"],
              },
            ],
            endTime: "2:00",
            id: "pos-3-shift-4",
            soldierIds: [],
            startTime: "22:00",
          },
          {
            assignmentDefs: [
              {
                roles: ["לוחם"],
              },
              {
                roles: ["לוחם"],
              },
            ],
            endTime: "6:00",
            id: "pos-3-shift-5",
            soldierIds: [],
            startTime: "2:00",
          },
          {
            assignmentDefs: [
              {
                roles: ["לוחם"],
              },
              {
                roles: ["לוחם"],
              },
            ],
            endTime: "10:00",
            id: "pos-3-shift-6",
            soldierIds: [],
            startTime: "6:00",
          },
          {
            assignmentDefs: [
              {
                roles: ["לוחם"],
              },
              {
                roles: ["לוחם"],
              },
            ],
            endTime: "14:00",
            id: "pos-3-shift-7",
            soldierIds: [],
            startTime: "10:00",
          },
        ],
      },
    ]);
  });
});
