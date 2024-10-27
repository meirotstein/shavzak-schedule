import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { PositionModel } from "../../src/model/position";
import { SoldierModel } from "../../src/model/soldier";
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

    const store = usePositionsStore();

    expect(store.positions.length).toBe(2);

    expect(store.positions[0]).toBeInstanceOf(PositionModel);
    expect(store.positions[0].positionId).toBe("1");
    expect(store.positions[0].positionName).toBe("shin-gimel");
    expect(store.positions[0].shifts.length).toBe(1);
    expect(store.positions[0].shifts[0].shiftId).toBe("1");
    expect(store.positions[0].shifts[0].startTime).toBe("00:00");
    expect(store.positions[0].shifts[0].endTime).toBe("02:00");
    expect(store.positions[0].shifts[0].assignmentDefinitions).toEqual([
      { roles: ["officer"] },
    ]);
    // TODO: enable when soldier is added to shift
    // expect(store.positions[0].shifts[0].soldiers.length).toBe(1);
    // expect(store.positions[0].shifts[0].soldiers[0]).toBeInstanceOf(SoldierModel);
    // expect(store.positions[0].shifts[0].soldiers[0].id).toBe("123");

    expect(store.positions[1]).toBeInstanceOf(PositionModel);
    expect(store.positions[1].positionId).toBe("2");
    expect(store.positions[1].positionName).toBe("patrol");
    expect(store.positions[1].shifts.length).toBe(2);
    expect(store.positions[1].shifts[0].shiftId).toBe("1");
    expect(store.positions[1].shifts[0].startTime).toBe("00:00");
    expect(store.positions[1].shifts[0].endTime).toBe("02:00");
    expect(store.positions[1].shifts[0].assignmentDefinitions).toEqual([
      { roles: ["officer"] },
    ]);
    expect(store.positions[1].shifts[1].shiftId).toBe("2");
    expect(store.positions[1].shifts[1].startTime).toBe("02:00");
    expect(store.positions[1].shifts[1].endTime).toBe("04:00");
    expect(store.positions[1].shifts[1].assignmentDefinitions).toEqual([
      { roles: ["officer"] },
    ]);
  });

  test("fetchPositions from backend unsorted - expected to sort starting from the day start hour (14:00)", async () => {
    positionsMock = testPositionsDataUnsorted as any;

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
    positionsMock = testPositionsData as any;

    findSoldierByIdMock.mockReturnValue(
      new SoldierModel("123", "mose ufnik", "officer")
    );

    const store = usePositionsStore();

    store.assignSoldiersToShift("1", "1", 0, "123");

    expect(store.positions[0].shifts[0].soldiers.length).toBe(1);
    expect(store.positions[0].shifts[0].soldiers[0]).toBeInstanceOf(
      SoldierModel
    );
    expect(store.positions[0].shifts[0].soldiers[0].id).toBe("123");
    expect(store.positions[0].shifts[0].soldiers[0].name).toBe("mose ufnik");
    expect(store.positions[0].shifts[0].soldiers[0].role).toBe("officer");
  });
});
