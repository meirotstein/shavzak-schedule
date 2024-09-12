import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GAPIClient } from "../../src/clients/gapi-client";
import { PositionModel } from "../../src/model/position";
import { SoldierModel } from "../../src/model/soldier";
import { usePositionsStore } from "../../src/store/positions";

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
describe("positions store tests", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    findSoldierByIdMock.mockClear();
    vi.resetAllMocks();
  });

  test("fetchPositions from backend", async () => {
    vi.spyOn(GAPIClient.prototype, "getPositions").mockResolvedValue(
      testPositionsData as any
    );

    const store = usePositionsStore();
    await store.fetchPositions();

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

  test("assignSoldiersToShift", async () => {
    vi.spyOn(GAPIClient.prototype, "getPositions").mockResolvedValue(
      testPositionsData as any
    );

    findSoldierByIdMock.mockReturnValue(
      new SoldierModel("123", "mose ufnik", "officer")
    );

    const store = usePositionsStore();
    await store.fetchPositions();

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
