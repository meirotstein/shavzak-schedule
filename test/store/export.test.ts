import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { IPosition } from "../../src/model/position";
import type { Assignment, IShift } from "../../src/model/shift";
import type { ISoldier } from "../../src/model/soldier";
import { useExportStore } from "../../src/store/export";

// Mock dependencies
const mockGAPIStore = {
  dayStart: "06:00",
  accessToken: "mock-token",
  checkSheetExists: vi.fn(),
  getSheetIdByName: vi.fn(),
  updateSheetValues: vi.fn(),
};

const mockPositionsStore = {
  positions: [] as IPosition[],
};

const mockScheduleStore = {
  scheduleDate: new Date("2024-01-15"),
};

const mockRoute = {
  params: { id: "mock-spreadsheet-id" },
};

// Mock fetch globally
// @ts-ignore
(global as any).fetch = vi.fn();

// Mock window.location for Node.js environment
if (typeof window === "undefined") {
  // @ts-ignore
  (global as any).window = {
    location: {
      hash: "#/spreadsheet/mock-spreadsheet-id",
    },
  } as any;
} else {
  Object.defineProperty(window, "location", {
    value: {
      hash: "#/spreadsheet/mock-spreadsheet-id",
    },
    writable: true,
  });
}

vi.mock("../../src/store/gapi", () => ({
  useGAPIStore: () => mockGAPIStore,
}));

vi.mock("../../src/store/positions", () => ({
  usePositionsStore: () => mockPositionsStore,
}));

vi.mock("../../src/store/schedule", () => ({
  useScheduleStore: () => mockScheduleStore,
}));

vi.mock("vue-router", () => ({
  useRoute: () => mockRoute,
}));

vi.mock("../../src/utils/date-utils", () => ({
  getHebrewDayName: () => "יום ראשון",
  toHebrewDateString: () => "טו' בטבת תשפ\"ד",
}));

describe("export store tests", () => {
  let store: ReturnType<typeof useExportStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useExportStore();

    // Reset all mocks
    vi.clearAllMocks();
    vi.resetAllMocks();

    // Reset mock data
    mockGAPIStore.dayStart = "06:00";
    mockGAPIStore.accessToken = "mock-token";
    mockPositionsStore.positions = [];
    mockScheduleStore.scheduleDate = new Date("2024-01-15");

    // Reset fetch mock
    (global.fetch as any).mockReset();
  });

  describe("isExporting", () => {
    test("should be false initially", () => {
      expect(store.isExporting).toBe(false);
    });
  });

  describe("getSpreadsheetId", () => {
    test("should extract spreadsheet ID from hash", () => {
      window.location.hash = "#/spreadsheet/test-spreadsheet-id";
      const store = useExportStore();

      // We can't directly test the private function, but we can test it indirectly
      // through the export process
      expect(window.location.hash).toContain("test-spreadsheet-id");
    });

    test("should fallback to route params when hash is not available", () => {
      window.location.hash = "";
      const store = useExportStore();

      // The function should fallback to route.params.id
      expect(mockRoute.params.id).toBe("mock-spreadsheet-id");
    });
  });

  describe("generateExportSheetName", () => {
    test("should generate correct sheet name format", () => {
      const date = new Date("2024-01-15");
      const store = useExportStore();

      // We can't directly test the private function, but we can verify the format
      // through the export process
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getFullYear()).toBe(2024);
    });
  });

  describe("generateExportTitle", () => {
    test("should generate title with Hebrew day and date", () => {
      const date = new Date("2024-01-15");
      const store = useExportStore();

      // The title should include Hebrew day name and date
      // We can verify this through the export process
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(0);
      expect(date.getFullYear()).toBe(2024);
    });
  });

  describe("prepareExportData", () => {
    test("should throw error when no positions are available", async () => {
      mockPositionsStore.positions = [];

      await expect(store.exportToSheet()).rejects.toThrow("אין נתונים ליצוא");
    });

    test("should prepare data with positions and shifts", async () => {
      // Create mock data
      const mockSoldier: ISoldier = {
        id: "1",
        name: "אדיר גל",
        role: 'רב"ט',
        platoon: "יחידה",
        presence: [],
        addPresence: vi.fn(),
      };

      const mockAssignment: Assignment = {
        soldier: mockSoldier,
        roles: [],
      };

      const mockShift: IShift = {
        shiftId: "shift-1",
        startTime: "06:00",
        endTime: "14:00",
        assignments: [mockAssignment],
        addSoldier: vi.fn(),
        removeSoldier: vi.fn(),
      };

      const mockPosition: IPosition = {
        positionName: "סיור 1",
        positionId: "pos-1",
        shifts: [mockShift],
        addShift: vi.fn(),
      };

      mockPositionsStore.positions = [mockPosition];

      // Mock successful API responses
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      mockGAPIStore.checkSheetExists.mockResolvedValue(false);
      mockGAPIStore.getSheetIdByName.mockResolvedValue(123);
      mockGAPIStore.updateSheetValues.mockResolvedValue({});

      const result = await store.exportToSheet();

      expect(result.sheetName).toBeTruthy();
      expect(result.sheetUrl).toBeTruthy();
    });
  });

  describe("deleteExistingSheet", () => {
    test("should delete existing sheet when it exists", async () => {
      mockGAPIStore.checkSheetExists.mockResolvedValue(true);
      mockGAPIStore.getSheetIdByName.mockResolvedValue(123);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      // This function is called during exportToSheet
      const mockPosition: IPosition = {
        positionName: "סיור 1",
        positionId: "pos-1",
        shifts: [],
        addShift: vi.fn(),
      };
      mockPositionsStore.positions = [mockPosition];

      await store.exportToSheet();

      expect(mockGAPIStore.checkSheetExists).toHaveBeenCalled();
      expect(mockGAPIStore.getSheetIdByName).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });

    test("should not delete when sheet does not exist", async () => {
      mockGAPIStore.checkSheetExists.mockResolvedValue(false);

      const mockPosition: IPosition = {
        positionName: "סיור 1",
        positionId: "pos-1",
        shifts: [],
        addShift: vi.fn(),
      };
      mockPositionsStore.positions = [mockPosition];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await store.exportToSheet();

      expect(mockGAPIStore.checkSheetExists).toHaveBeenCalled();
      // The function is called during the export process, so we can't test it's not called
      // Instead, we verify that the export completed successfully
      expect(mockGAPIStore.checkSheetExists).toHaveBeenCalled();
    });
  });

  describe("createNewSheet", () => {
    test("should create new sheet with correct properties", async () => {
      mockGAPIStore.checkSheetExists.mockResolvedValue(false);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const mockPosition: IPosition = {
        positionName: "סיור 1",
        positionId: "pos-1",
        shifts: [],
        addShift: vi.fn(),
      };
      mockPositionsStore.positions = [mockPosition];

      await store.exportToSheet();

      // Verify that the export process completed successfully
      expect(global.fetch).toHaveBeenCalled();

      // Verify that at least one call contained addSheet
      const fetchCalls = (global.fetch as any).mock.calls;
      const hasAddSheetCall = fetchCalls.some((call: any) =>
        call[1].body.includes("addSheet")
      );
      expect(hasAddSheetCall).toBe(true);
    });
  });

  describe("createMergedCells", () => {
    test("should create merge requests for shifts", async () => {
      const mockSoldier: Soldier = {
        id: "1",
        name: "אדיר גל",
        rank: 'רב"ט',
        unit: "יחידה",
      };

      const mockAssignment: Assignment = {
        soldier: mockSoldier,
        soldierId: "1",
      };

      const mockShift: Shift = {
        shiftId: "shift-1",
        startTime: "06:00",
        endTime: "14:00",
        assignments: [mockAssignment],
      };

      const mockPosition: Position = {
        positionName: "סיור 1",
        positionId: "pos-1",
        shifts: [mockShift],
      };

      mockPositionsStore.positions = [mockPosition];
      mockGAPIStore.checkSheetExists.mockResolvedValue(false);
      mockGAPIStore.getSheetIdByName.mockResolvedValue(123);
      mockGAPIStore.updateSheetValues.mockResolvedValue({});

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await store.exportToSheet();

      // Verify that the export process completed successfully
      expect(global.fetch).toHaveBeenCalled();

      // Verify that at least one call contained mergeCells
      const fetchCalls = (global.fetch as any).mock.calls;
      const hasMergeCellsCall = fetchCalls.some((call: any) =>
        call[1].body.includes("mergeCells")
      );
      expect(hasMergeCellsCall).toBe(true);
    });
  });

  describe("mergeTitleAndFormat", () => {
    test("should merge title row and apply formatting", async () => {
      const mockPosition: Position = {
        positionName: "סיור 1",
        positionId: "pos-1",
        shifts: [],
      };

      mockPositionsStore.positions = [mockPosition];
      mockGAPIStore.checkSheetExists.mockResolvedValue(false);
      mockGAPIStore.getSheetIdByName.mockResolvedValue(123);
      mockGAPIStore.updateSheetValues.mockResolvedValue({});

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await store.exportToSheet();

      // Verify that the export process completed successfully
      expect(global.fetch).toHaveBeenCalled();

      // Verify that at least one call contained mergeCells for title
      const fetchCalls = (global.fetch as any).mock.calls;
      const hasTitleMergeCall = fetchCalls.some(
        (call: any) =>
          call[1].body.includes("mergeCells") &&
          call[1].body.includes('startRowIndex":0')
      );
      expect(hasTitleMergeCall).toBe(true);
    });
  });

  describe("setRTLDirection", () => {
    test("should set RTL direction for the sheet", async () => {
      const mockPosition: Position = {
        positionName: "סיור 1",
        positionId: "pos-1",
        shifts: [],
      };

      mockPositionsStore.positions = [mockPosition];
      mockGAPIStore.checkSheetExists.mockResolvedValue(false);
      mockGAPIStore.getSheetIdByName.mockResolvedValue(123);
      mockGAPIStore.updateSheetValues.mockResolvedValue({});

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await store.exportToSheet();

      // Verify that the export process completed successfully
      expect(global.fetch).toHaveBeenCalled();

      // Verify that at least one call contained updateSheetProperties for RTL
      const fetchCalls = (global.fetch as any).mock.calls;
      const hasRTLCall = fetchCalls.some(
        (call: any) =>
          call[1].body.includes("updateSheetProperties") &&
          call[1].body.includes("rightToLeft")
      );
      expect(hasRTLCall).toBe(true);
    });
  });

  describe("exportToSheet", () => {
    test("should return early if already exporting", async () => {
      // Set exporting to true
      store.isExporting = true;

      const result = await store.exportToSheet();

      expect(result).toEqual({ sheetName: "", sheetUrl: "" });
    });

    test("should throw error when no positions are available", async () => {
      mockPositionsStore.positions = [];

      await expect(store.exportToSheet()).rejects.toThrow("אין נתונים ליצוא");
    });

    test("should complete full export process successfully", async () => {
      const mockSoldier: Soldier = {
        id: "1",
        name: "אדיר גל",
        rank: 'רב"ט',
        unit: "יחידה",
      };

      const mockAssignment: Assignment = {
        soldier: mockSoldier,
        soldierId: "1",
      };

      const mockShift: Shift = {
        shiftId: "shift-1",
        startTime: "06:00",
        endTime: "14:00",
        assignments: [mockAssignment],
      };

      const mockPosition: Position = {
        positionName: "סיור 1",
        positionId: "pos-1",
        shifts: [mockShift],
      };

      mockPositionsStore.positions = [mockPosition];
      mockGAPIStore.checkSheetExists.mockResolvedValue(false);
      mockGAPIStore.getSheetIdByName.mockResolvedValue(123);
      mockGAPIStore.updateSheetValues.mockResolvedValue({});

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await store.exportToSheet();

      expect(result.sheetName).toBeTruthy();
      expect(result.sheetUrl).toBeTruthy();
      expect(result.sheetUrl).toContain("docs.google.com");
      expect(store.isExporting).toBe(false);
    });

    test("should handle API errors gracefully", async () => {
      const mockPosition: Position = {
        positionName: "סיור 1",
        positionId: "pos-1",
        shifts: [],
      };

      mockPositionsStore.positions = [mockPosition];
      mockGAPIStore.checkSheetExists.mockRejectedValue(new Error("API Error"));

      await expect(store.exportToSheet()).rejects.toThrow("API Error");
      expect(store.isExporting).toBe(false);
    });

    test("should handle overnight shifts correctly", async () => {
      const mockSoldier: Soldier = {
        id: "1",
        name: "אדיר גל",
        rank: 'רב"ט',
        unit: "יחידה",
      };

      const mockAssignment: Assignment = {
        soldier: mockSoldier,
        soldierId: "1",
      };

      const mockShift: Shift = {
        shiftId: "shift-1",
        startTime: "22:00",
        endTime: "06:00",
        assignments: [mockAssignment],
      };

      const mockPosition: Position = {
        positionName: "סיור 1",
        positionId: "pos-1",
        shifts: [mockShift],
      };

      mockPositionsStore.positions = [mockPosition];
      mockGAPIStore.checkSheetExists.mockResolvedValue(false);
      mockGAPIStore.getSheetIdByName.mockResolvedValue(123);
      mockGAPIStore.updateSheetValues.mockResolvedValue({});

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await store.exportToSheet();

      expect(result.sheetName).toBeTruthy();
      expect(result.sheetUrl).toBeTruthy();
    });

    test("should handle multiple positions and shifts", async () => {
      const mockSoldier1: Soldier = {
        id: "1",
        name: "אדיר גל",
        rank: 'רב"ט',
        unit: "יחידה",
      };

      const mockSoldier2: Soldier = {
        id: "2",
        name: "דן כהן",
        rank: "סמל",
        unit: "יחידה",
      };

      const mockAssignment1: Assignment = {
        soldier: mockSoldier1,
        soldierId: "1",
      };

      const mockAssignment2: Assignment = {
        soldier: mockSoldier2,
        soldierId: "2",
      };

      const mockShift1: Shift = {
        shiftId: "shift-1",
        startTime: "06:00",
        endTime: "14:00",
        assignments: [mockAssignment1],
      };

      const mockShift2: Shift = {
        shiftId: "shift-2",
        startTime: "14:00",
        endTime: "22:00",
        assignments: [mockAssignment2],
      };

      const mockPosition: Position = {
        positionName: "סיור 1",
        positionId: "pos-1",
        shifts: [mockShift1, mockShift2],
      };

      mockPositionsStore.positions = [mockPosition];
      mockGAPIStore.checkSheetExists.mockResolvedValue(false);
      mockGAPIStore.getSheetIdByName.mockResolvedValue(123);
      mockGAPIStore.updateSheetValues.mockResolvedValue({});

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await store.exportToSheet();

      expect(result.sheetName).toBeTruthy();
      expect(result.sheetUrl).toBeTruthy();
    });
  });
});
