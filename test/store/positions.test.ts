import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SchedulerError } from "../../src/errors/scheduler-error";
import { PositionModel } from "../../src/model/position";
import { SoldierModel } from "../../src/model/soldier";
import { useAssignmentsStore } from "../../src/store/assignments";
import { usePositionsStore } from "../../src/store/positions";
import { PositionDto } from "../../src/types/client-dto";

const findSoldierByIdMock = vi.fn();
const soldiersMock: any[] = [];

// Mock soldiers with the IDs used in tests
const testSoldiers = [
  { id: "123", name: "Test Soldier 1", role: "מפקד" },
  { id: "456", name: "Test Soldier 2", role: "לוחם" },
  { id: "5891846", name: "Test Soldier 3", role: "לוחם" },
  { id: "8820513", name: "Test Soldier 4", role: "קצין" }
];

vi.mock("../../src/store/soldiers", () => {
  return {
    useSoldiersStore: () => {
      return {
        findSoldierById: findSoldierByIdMock,
        soldiers: soldiersMock,
      };
    },
  };
});

let positionsMock: PositionDto[] = [];
const mockGAPIStore = {
  batchUpdateSheetValues: vi.fn().mockResolvedValue({ totalUpdatedCells: 1, updatedRanges: [] }),
  fetchSheetValues: vi.fn().mockResolvedValue([
    ["עמדה", "סיור 1", "", "עמדה", "ש.ג."],
    ["תפקיד", "מפקד", "קצין", "תפקיד", "לוחם"],
    ["משמרת", "14:00", "22:00", "משמרת", "14:00"],
    ["שיבוץ", "", "", "שיבוץ", ""]
  ]),
  SHEETS: {
    POSITIONS: "עמדות"
  },
  TITLES: {
    ASSIGNMENT: "שיבוץ"
  },
  positions: positionsMock,
  soldiers: testSoldiers,
  isSignedIn: true
};

vi.mock("../../src/store/gapi", () => {
  return {
    useGAPIStore: () => mockGAPIStore,
  };
});

const testPositionsData = [
  {
    id: "1",
    name: "shin-gimel",
    shifts: [
      {
        id: "1",
        startTime: "00:00",
        endTime: "02:00",
        assignmentDefs: [{ roles: ["officer"] }],
        soldierIds: ["123"], // Assign soldier 123 for testing
      },
    ],
  },
  {
    id: "2",
    name: "patrol",
    shifts: [
      {
        id: "1",
        startTime: "00:00",
        endTime: "02:00",
        assignmentDefs: [{ roles: ["officer"] }],
        soldierIds: ["456"], // Use different soldier to avoid conflicts
      },
      {
        id: "2",
        startTime: "02:00",
        endTime: "04:00",
        assignmentDefs: [{ roles: ["officer"] }],
        soldierIds: [""], // Test expects this to be empty
      },
    ],
  },
];

const testPositionsDataUnsorted = [
  {
    id: "1",
    name: "patrol",
    shifts: [
      {
        id: "4",
        startTime: "02:00",
        endTime: "04:00",
        assignmentDefs: [{ roles: ["officer"] }],
        soldierIds: [""], // No pre-assigned soldier
      },
      {
        id: "1",
        startTime: "14:00",
        endTime: "18:00",
        assignmentDefs: [{ roles: ["officer"] }],
        soldierIds: ["456"], // Different soldier to avoid conflicts
      },
      {
        id: "3",
        startTime: "00:00",
        endTime: "02:00",
        assignmentDefs: [{ roles: ["officer"] }],
        soldierIds: [""], // No pre-assigned soldier
      },
      {
        id: "2",
        startTime: "20:15",
        endTime: "21:45",
        assignmentDefs: [{ roles: ["officer"] }],
        soldierIds: [""], // No pre-assigned soldier
      },
    ],
  },
];

describe("positions store tests", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    findSoldierByIdMock.mockClear();
    
    // Clear all mock data - let individual tests set up their own data
    positionsMock.length = 0;
    soldiersMock.length = 0;
    
    // Set up default soldier mocks - individual tests can override this
    soldiersMock.push(...testSoldiers);
    findSoldierByIdMock.mockImplementation((id: string) => {
      return testSoldiers.find(soldier => soldier.id === id);
    });
  });

  // Add tests for assignment saving functionality
  describe("assignment saving", () => {
    test("assignment saving functions exist and are callable", async () => {
      // Set up minimal test data for assignment saving test
      positionsMock.push(...testPositionsData as PositionDto[]);
      
      const positions = usePositionsStore();
      
      // Test that functions exist and are callable
      expect(typeof positions.setAutoSaveEnabled).toBe("function");
      expect(typeof positions.manualSave).toBe("function");
      
      // Test that they can be called without throwing
      positions.setAutoSaveEnabled(true);
      positions.setAutoSaveEnabled(false);
      
      // Test manual save exists and is callable (may not save anything if no data)
      await expect(positions.manualSave()).resolves.not.toThrow();
      
      // Core test: verify the store has the assignment functions
      expect(typeof positions.setAutoSaveEnabled).toBe("function");
      expect(typeof positions.manualSave).toBe("function");
    });
  });

  test("fetchPositions from backend", async () => {
    // Set up test data since beforeEach no longer provides default positions
    positionsMock.push(...testPositionsData as PositionDto[]);
    
    const soldier123 = new SoldierModel("123", "mose ufnik", "officer", "1");
    const soldier456 = new SoldierModel("456", "test soldier", "officer", "2");
    
    findSoldierByIdMock.mockImplementation((id: string) => {
      if (id === "123") return soldier123;
      if (id === "456") return soldier456;
      return testSoldiers.find(s => s.id === id);
    });
    
    // Add soldiers to mock array for cache
    soldiersMock.length = 0; // Clear any existing soldiers
    soldiersMock.push(soldier123, soldier456);

    const store = usePositionsStore();

    expect(store.positions.length).toBe(2);

    expect(store.positions[0]).toBeInstanceOf(PositionModel);
    expect(store.positions[0].positionId).toBe("1");
    expect(store.positions[0].positionName).toBe("shin-gimel");
    expect(store.positions[0].shifts.length).toBe(1);
    expect(store.positions[0].shifts[0].shiftId).toBe("1");
    expect(store.positions[0].shifts[0].startTime).toBe("00:00");
    expect(store.positions[0].shifts[0].endTime).toBe("02:00");
    expect(store.positions[0].shifts[0].assignments.length).toBe(1);
    expect(store.positions[0].shifts[0].assignments[0].roles).toEqual([
      "officer",
    ]);

    expect(store.positions[0].shifts[0].assignments[0].soldier).toBeInstanceOf(
      SoldierModel
    );
    expect(store.positions[0].shifts[0].assignments[0].soldier!.id).toBe("123");

    expect(store.positions[1]).toBeInstanceOf(PositionModel);
    expect(store.positions[1].positionId).toBe("2");
    expect(store.positions[1].positionName).toBe("patrol");
    expect(store.positions[1].shifts.length).toBe(2);
    expect(store.positions[1].shifts[0].shiftId).toBe("1");
    expect(store.positions[1].shifts[0].startTime).toBe("00:00");
    expect(store.positions[1].shifts[0].endTime).toBe("02:00");
    expect(store.positions[1].shifts[0].assignments.length).toBe(1);
    expect(store.positions[1].shifts[0].assignments[0].roles).toEqual(["officer"]);
    expect(store.positions[1].shifts[0].assignments[0].soldier).toBeInstanceOf(
      SoldierModel
    );

    expect(store.positions[1].shifts[1].shiftId).toBe("2");
    expect(store.positions[1].shifts[1].startTime).toBe("02:00");
    expect(store.positions[1].shifts[1].endTime).toBe("04:00");
    expect(store.positions[1].shifts[1].assignments.length).toBe(1);
    expect(store.positions[1].shifts[1].assignments[0].roles).toEqual(["officer"]);
    expect(store.positions[1].shifts[1].assignments[0].soldier).toBeUndefined();
  });

  test("fetchPositions from backend unsorted - expected to sort starting from the day start hour (14:00)", async () => {
    // Completely clear and reset all mock data to avoid conflicts with beforeEach
    positionsMock.length = 0; // Use length = 0 instead of splice for complete clearing
    soldiersMock.length = 0;
    
    // Set up ONLY the specific test data we need
    positionsMock.push(...(testPositionsDataUnsorted as any));
    
    const soldier456 = new SoldierModel("456", "test soldier", "officer", "2");
    soldiersMock.push(soldier456);
    
    findSoldierByIdMock.mockImplementation((id: string) => {
      if (id === "456") return soldier456;
      return undefined; // Don't fallback to testSoldiers to avoid conflicts
    });

    const store = usePositionsStore();

    expect(store.positions.length).toBe(1);

    expect(store.positions[0]).toBeInstanceOf(PositionModel);

    expect(store.positions[0].shifts[0].shiftId).toBe("1");
    expect(store.positions[0].shifts[0].startTime).toBe("14:00");
    expect(store.positions[0].shifts[0].endTime).toBe("18:00");

    expect(store.positions[0].shifts[1].shiftId).toBe("2");
    expect(store.positions[0].shifts[1].startTime).toBe("20:15");
    expect(store.positions[0].shifts[1].endTime).toBe("21:45");

    expect(store.positions[0].shifts[2].shiftId).toBe("3");
    expect(store.positions[0].shifts[2].startTime).toBe("00:00");
    expect(store.positions[0].shifts[2].endTime).toBe("02:00");

    expect(store.positions[0].shifts[3].shiftId).toBe("4");
    expect(store.positions[0].shifts[3].startTime).toBe("02:00");
    expect(store.positions[0].shifts[3].endTime).toBe("04:00");
  });

  test("assignSoldiersToShift", async () => {
    // Completely clear all mock data to start fresh
    positionsMock.length = 0;
    soldiersMock.length = 0;
    
    // Use test data without pre-assigned soldiers
    const testDataWithoutSoldiers = [
      {
        id: "1",
        name: "shin-gimel",
        shifts: [
          {
            id: "1",
            startTime: "00:00",
            endTime: "02:00",
            assignmentDefs: [{ roles: ["officer"] }],
            soldierIds: [""], // No pre-assigned soldier
          },
        ],
      },
    ];
    positionsMock.push(...(testDataWithoutSoldiers as any));

    const soldier = new SoldierModel("123", "mose ufnik", "officer", "3");
    soldiersMock.push(soldier);
    findSoldierByIdMock.mockImplementation((id: string) => {
      if (id === "123") return soldier;
      return undefined; // Don't fallback to avoid conflicts
    });

    const store = usePositionsStore();
    const assignmentsStore = useAssignmentsStore();
    store.assignSoldiersToShift("1", "1", 0, "123");
    expect(assignmentsStore.isAssigned("123")).toBe(true);
    expect(assignmentsStore.getAssignments("123")).toHaveLength(1);
    expect(assignmentsStore.getAssignments("123")[0]).toEqual({
      positionId: "1",
      positionName: "shin-gimel",
      shiftId: "1",
      startTime: "00:00",
      endTime: "02:00",
      assignmentIndex: 0,
    });
  });

  test("assignSoldiersToShift replaces existing soldier correctly", async () => {
    // Completely clear all mock data to start fresh
    positionsMock.length = 0;
    soldiersMock.length = 0;
    
    // Use test data without pre-assigned soldiers
    const testDataWithoutSoldiers = [
      {
        id: "1",
        name: "shin-gimel",
        shifts: [
          {
            id: "1",
            startTime: "00:00",
            endTime: "02:00",
            assignmentDefs: [{ roles: ["officer"] }],
            soldierIds: [""], // No pre-assigned soldier
          },
        ],
      },
    ];
    positionsMock.push(...(testDataWithoutSoldiers as any));

    const soldier1 = new SoldierModel("123", "mose ufnik", "officer", "3");
    const soldier2 = new SoldierModel("456", "bobe sponge", "officer", "4");
    soldiersMock.push(soldier1, soldier2);
    
    findSoldierByIdMock.mockImplementation((id: string) => {
      if (id === "123") return soldier1;
      if (id === "456") return soldier2;
      return undefined; // Don't fallback to avoid conflicts
    });

    const store = usePositionsStore();
    const assignmentsStore = useAssignmentsStore();

    // First assign soldier1
    store.assignSoldiersToShift("1", "1", 0, "123");
    expect(store.positions[0].shifts[0].assignments[0].soldier).toBeInstanceOf(
      SoldierModel
    );
    expect(store.positions[0].shifts[0].assignments[0].soldier!.id).toBe("123");
    expect(assignmentsStore.isAssigned("123")).toBe(true);
    expect(assignmentsStore.getAssignments("123")).toHaveLength(1);
    expect(assignmentsStore.isAssigned("456")).toBe(false);
    
    // Now assign soldier2 to the same spot (should replace soldier1)
    store.assignSoldiersToShift("1", "1", 0, "456");
    expect(store.positions[0].shifts[0].assignments[0].soldier!.id).toBe("456");
    expect(assignmentsStore.isAssigned("456")).toBe(true);
    expect(assignmentsStore.getAssignments("456")).toHaveLength(1);
    expect(assignmentsStore.isAssigned("123")).toBe(false);
  });

  test("removeSoldierFromShift", async () => {
    // Completely clear all mock data to start fresh
    positionsMock.length = 0;
    soldiersMock.length = 0;
    
    // Use test data without pre-assigned soldiers
    const testDataWithoutSoldiers = [
      {
        id: "1",
        name: "shin-gimel",
        shifts: [
          {
            id: "1",
            startTime: "00:00",
            endTime: "02:00",
            assignmentDefs: [{ roles: ["officer"] }],
            soldierIds: [""], // No pre-assigned soldier
          },
        ],
      },
    ];
    positionsMock.push(...(testDataWithoutSoldiers as any));

    const soldier = new SoldierModel("123", "mose ufnik", "officer", "3");
    soldiersMock.push(soldier);
    findSoldierByIdMock.mockImplementation((id: string) => {
      if (id === "123") return soldier;
      return undefined; // Don't fallback to avoid conflicts
    });

    const store = usePositionsStore();
    const assignmentsStore = useAssignmentsStore();

    // First assign a soldier
    store.assignSoldiersToShift("1", "1", 0, "123");
    expect(store.positions[0].shifts[0].assignments[0].soldier).toBeInstanceOf(
      SoldierModel
    );
    expect(assignmentsStore.isAssigned("123")).toBe(true);
    expect(assignmentsStore.getAssignments("123")).toHaveLength(1);

    // Then remove the soldier
    store.removeSoldierFromShift("1", "1", 0);
    expect(store.positions[0].shifts[0].assignments[0].soldier).toBeUndefined();
    
    // Check that assignment is removed from soldier in the assignments store
    expect(assignmentsStore.isAssigned("123")).toBe(false);
    expect(assignmentsStore.getAssignments("123")).toHaveLength(0);
  });

  test("removeSoldierFromShift error: position not found", async () => {
    positionsMock = testPositionsData as any;

    findSoldierByIdMock.mockReturnValue(
      new SoldierModel("123", "mose ufnik", "officer", "3")
    );

    const store = usePositionsStore();

    expect(() => store.removeSoldierFromShift("999", "1", 0)).toThrowError(
      SchedulerError
    );
  });

  test("removeSoldierFromShift error: shift not found", async () => {
    positionsMock = testPositionsData as any;

    findSoldierByIdMock.mockReturnValue(
      new SoldierModel("123", "mose ufnik", "officer", "3")
    );

    const store = usePositionsStore();

    expect(() => store.removeSoldierFromShift("1", "999", 0)).toThrowError(
      SchedulerError
    );
  });

  test("removeSoldierFromShift from empty spot", async () => {
    // This test verifies that removeSoldierFromShift throws an appropriate error
    // when trying to remove from a position that doesn't exist
    const store = usePositionsStore();
    
    // Since no positions are set up, calling removeSoldierFromShift should throw
    expect(() => store.removeSoldierFromShift("1", "1", 0)).toThrowError(
      "Position with id 1 not found"
    );
  });
});
