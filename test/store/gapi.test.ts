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
      valueRenderOption: "UNFORMATTED_VALUE",
      range: expect.stringMatching(/^settings/),
    });

    // expect load of soldiers from sheet
    expect(gapiMock.client.sheets.spreadsheets.values.get).toBeCalledWith({
      spreadsheetId: "123",
      valueRenderOption: "UNFORMATTED_VALUE",
      range: expect.stringMatching(/^חיילים/),
    });
  });

  test("load of settings", async () => {
    const soldiersMaxAmountMock = 42;
    gapiMock.client.sheets.spreadsheets.values.get.mockImplementation(
      (params: { range: string }) => {
        if (params.range.startsWith("settings")) {
          return {
            body: JSON.stringify({
              values: [[, , , , , soldiersMaxAmountMock]],
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
});
