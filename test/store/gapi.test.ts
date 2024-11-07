import { parse } from "date-fns";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useGAPIStore } from "../../src/store/gapi";
import { positionsDto, positionsRaw } from "./rowdata/positions";
import { presenceDto, presenceRaw } from "./rowdata/presence";

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

    // expect load of positions from sheet
    expect(gapiMock.client.sheets.spreadsheets.values.get).toBeCalledWith({
      spreadsheetId: "123",
      range: expect.stringMatching(/^נוכחות/),
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
      {
        id: mockData.id + "",
        name: mockData.name,
        role: mockData.role,
        platoon: mockData.platoon + "",
        description: mockData.description,
      },
    ]);
  });

  test("load of positions", async () => {
    gapiMock.client.sheets.spreadsheets.values.get.mockImplementation(
      (params: { range: string }) => {
        if (params.range.startsWith("עמדות")) {
          return {
            body: JSON.stringify({
              values: positionsRaw,
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

    expect(store.positions).toStrictEqual(positionsDto);
  });

  test("load of presence", async () => {
    gapiMock.client.sheets.spreadsheets.values.get.mockImplementation(
      (params: { range: string }) => {
        if (params.range.startsWith("חיילים")) {
          return {
            body: JSON.stringify({
              values: [
                ["123", "משה אופניק", "1", "לוחם", "משה אופניק [לוחם] 1"],
                ["456", "בוב ספוג", "2", "לוחם", "בוב ספוג [לוחם] 2"],
                [
                  "789",
                  "ג׳ורג קוסטנזה",
                  "מפלג",
                  "סמבצ",
                  "ג׳ורג קוסטנזה [סמבצ] מפלג",
                ],
              ],
            }),
          };
        }
        if (params.range.startsWith("נוכחות")) {
          return {
            body: JSON.stringify({
              values: presenceRaw,
            }),
          };
        }
        return {
          body: JSON.stringify({ values: [] }),
        };
      }
    );

    const store = useGAPIStore();

    store.settings.presenceNameFirstRow = 13;
    store.settings.presenceNameColumn = 2;

    await store.load();

    expect(store.presence).toStrictEqual({
      start: parse("2024-10-27", "yyyy-MM-dd", new Date()),
      end: parse("2024-12-31", "yyyy-MM-dd", new Date()),
      soldiersPresence: presenceDto,
    });
  });
});
