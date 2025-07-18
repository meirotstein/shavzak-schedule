import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SchedulerError } from "../../src/errors/scheduler-error";
import { PositionModel } from "../../src/model/position";
import { SoldierModel } from "../../src/model/soldier";
import { useAssignmentsStore } from "../../src/store/assignments";
import { usePositionsStore } from "../../src/store/positions";
import { PositionDto } from "../../src/types/client-dto";

const findSoldierByIdMock = vi.fn();
vi.mock("../../src/store/soldiers", () => {
  return {
    useSoldiersStore: () => {
      return {
        findSoldierById: findSoldierByIdMock,
      };
    },
  };
});

let positionsMock: PositionDto[] = [];
vi.mock("../../src/store/gapi", () => {
  return {
    useGAPIStore: () => {
      return {
        positions: positionsMock,
      };
    },
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
        soldierIds: ["123"],
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
        soldierIds: ["123"],
      },
      {
        id: "2",
        startTime: "02:00",
        endTime: "04:00",
        assignmentDefs: [{ roles: ["officer"] }],
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
      },
      {
        id: "1",
        startTime: "14:00",
        endTime: "18:00",
        assignmentDefs: [{ roles: ["officer"] }],
        soldierIds: ["123"],
      },
      {
        id: "3",
        startTime: "00:00",
        endTime: "02:00",
        assignmentDefs: [{ roles: ["officer"] }],
        soldierIds: ["123"],
      },
      {
        id: "2",
        startTime: "20:15",
        endTime: "21:45",
        assignmentDefs: [{ roles: ["officer"] }],
        soldierIds: ["123"],
      },
    ],
  },
];

describe("positions store tests", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    findSoldierByIdMock.mockClear();
    positionsMock = [];
    vi.resetAllMocks();
  });

  test("fetchPositions from backend", async () => {
    positionsMock = testPositionsData as any;
    findSoldierByIdMock.mockReturnValue(
      new SoldierModel("123", "mose ufnik", "officer", "1")
    );

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
    positionsMock = testPositionsDataUnsorted as any;
    findSoldierByIdMock.mockReturnValue(
      new SoldierModel("123", "mose ufnik", "officer", "2")
    );

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
          },
        ],
      },
    ];
    positionsMock = testDataWithoutSoldiers as any;

    const soldier = new SoldierModel("123", "mose ufnik", "officer", "3");
    findSoldierByIdMock.mockReturnValue(soldier);

    const store = usePositionsStore();

    store.assignSoldiersToShift("1", "1", 0, "123");

    // Check that soldier is assigned to shift
    expect(store.positions[0].shifts[0].assignments[0].soldier).toBeInstanceOf(
      SoldierModel
    );
    expect(store.positions[0].shifts[0].assignments[0].soldier!.id).toBe("123");
    expect(store.positions[0].shifts[0].assignments[0].soldier!.name).toBe(
      "mose ufnik"
    );
    expect(store.positions[0].shifts[0].assignments[0].soldier!.role).toBe(
      "officer"
    );

    // Check that assignment is added to soldier in the assignments store
    const assignmentsStore = useAssignmentsStore();
    expect(assignmentsStore.isAssigned("123")).toBe(true);
    expect(assignmentsStore.getAssignments("123")).toHaveLength(1);
    expect(assignmentsStore.getAssignments("123")[0]).toEqual({
      positionId: "1",
      positionName: "shin-gimel",
      shiftId: "1",
      startTime: "00:00",
      endTime: "02:00",
      assignmentIndex: 0
    });
  });

  test("removeSoldierFromShift", async () => {
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
          },
        ],
      },
    ];
    positionsMock = testDataWithoutSoldiers as any;

    const soldier = new SoldierModel("123", "mose ufnik", "officer", "3");
    findSoldierByIdMock.mockReturnValue(soldier);

    const store = usePositionsStore();

    // First assign a soldier
    store.assignSoldiersToShift("1", "1", 0, "123");
    expect(store.positions[0].shifts[0].assignments[0].soldier).toBeInstanceOf(
      SoldierModel
    );
    const assignmentsStore = useAssignmentsStore();
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
          },
        ],
      },
    ];
    positionsMock = testDataWithoutSoldiers as any;

    findSoldierByIdMock.mockReturnValue(
      new SoldierModel("123", "mose ufnik", "officer", "3")
    );

    const store = usePositionsStore();

    // Remove from an empty spot (should work, sets to undefined)
    store.removeSoldierFromShift("1", "1", 0);
    expect(store.positions[0].shifts[0].assignments[0].soldier).toBeUndefined();
  });
});
