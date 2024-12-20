import { parse } from "date-fns";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SoldierModel } from "../../src/model/soldier";
import { useSoldiersStore } from "../../src/store/soldiers";
import { PresenceDto, SoldierDto } from "../../src/types/client-dto";

let soldiersMock: SoldierDto[] = [];
let presenceDtoMock: PresenceDto = {
  start: parse("2024-10-27", "yyyy-MM-dd", new Date()),
  end: parse("2024-12-31", "yyyy-MM-dd", new Date()),
  soldiersPresence: {},
};
vi.mock("../../src/store/gapi", () => {
  return {
    useGAPIStore: () => {
      return {
        soldiers: soldiersMock,
        presence: presenceDtoMock,
      };
    },
  };
});

let scheduleDateMock;
vi.mock("../../src/store/schedule", () => {
  return {
    useScheduleStore: () => {
      return {
        scheduleDate: scheduleDateMock,
      };
    },
  };
});

describe("soldiers store tests", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    soldiersMock = [];
    presenceDtoMock.soldiersPresence = {};
    scheduleDateMock = undefined;
    vi.resetAllMocks();
  });

  test("fetchSoldiers from backend", async () => {
    soldiersMock = [
      {
        id: "123",
        name: "משה אופניק",
        role: "קצין",
        platoon: "1",
        description: "משה אופניק [קצין] 1",
      },
      {
        id: "456",
        name: "בוב ספוג",
        role: "לוחם",
        platoon: "2",
        description: "בוב ספוג [לוחם] 2",
      },
      {
        id: "789",
        name: "ג'ורג קונסטנזה",
        role: "לוחם",
        platoon: "מפלג",
        description: "ג'ורג קונסטנזה [לוחם] מפלג",
      },
    ];

    const store = useSoldiersStore();

    expect(store.soldiers.length).toBe(3);

    expect(store.soldiers[0]).toBeInstanceOf(SoldierModel);
    expect(store.soldiers[0].id).toBe("123");
    expect(store.soldiers[0].name).toBe("משה אופניק");
    expect(store.soldiers[0].role).toBe("קצין");
    expect(store.soldiers[0].platoon).toBe("1");

    expect(store.soldiers[1]).toBeInstanceOf(SoldierModel);
    expect(store.soldiers[1].id).toBe("456");
    expect(store.soldiers[1].name).toBe("בוב ספוג");
    expect(store.soldiers[1].role).toBe("לוחם");
    expect(store.soldiers[1].platoon).toBe("2");

    expect(store.soldiers[2]).toBeInstanceOf(SoldierModel);
    expect(store.soldiers[2].id).toBe("789");
    expect(store.soldiers[2].name).toBe("ג'ורג קונסטנזה");
    expect(store.soldiers[2].role).toBe("לוחם");
    expect(store.soldiers[2].platoon).toBe("מפלג");
  });

  test("findSoldierById", async () => {
    soldiersMock = [
      {
        id: "123",
        name: "משה אופניק",
        role: "קצין",
        platoon: "1",
        description: "משה אופניק [קצין] 1",
      },
      {
        id: "456",
        name: "בוב ספוג",
        role: "לוחם",
        platoon: "2",
        description: "בוב ספוג [לוחם] 2",
      },
      {
        id: "789",
        name: "ג'ורג קונסטנזה",
        role: "לוחם",
        platoon: "מפלג",
        description: "ג'ורג קונסטנזה [לוחם] מפלג",
      },
    ];

    const store = useSoldiersStore();

    const soldier = store.findSoldierById("123");

    expect(soldier).toBeInstanceOf(SoldierModel);
    expect(soldier?.id).toBe("123");
    expect(soldier?.name).toBe("משה אופניק");
    expect(soldier?.role).toBe("קצין");
  });

  test("setDraggedSoldier", () => {
    const store = useSoldiersStore();

    store.setDraggedSoldier(new SoldierModel("123", "משה אופניק", "קצין", "2"));

    expect(store.draggedSoldier).toBeInstanceOf(SoldierModel);
    expect(store.draggedSoldier?.id).toBe("123");
    expect(store.draggedSoldier?.name).toBe("משה אופניק");
    expect(store.draggedSoldier?.role).toBe("קצין");
    expect(store.draggedSoldier?.platoon).toBe("2");
  });

  test("load soldiers with presence", async () => {
    soldiersMock = [
      {
        id: "123",
        name: "משה אופניק",
        role: "קצין",
        platoon: "1",
        description: "משה אופניק [קצין] 1",
      },
      {
        id: "456",
        name: "בוב ספוג",
        role: "לוחם",
        platoon: "2",
        description: "בוב ספוג [לוחם] 2",
      },
      {
        id: "789",
        name: "ג'ורג קונסטנזה",
        role: "לוחם",
        platoon: "מפלג",
        description: "ג'ורג קונסטנזה [לוחם] מפלג",
      },
    ];

    presenceDtoMock.soldiersPresence = {
      "123": {
        presence: [
          {
            day: parse("2024-10-27", "yyyy-MM-dd", new Date()),
            presence: "1",
          },
          {
            day: parse("2024-10-28", "yyyy-MM-dd", new Date()),
            presence: "0",
          },
        ],
      },
      "456": {
        presence: [
          {
            day: parse("2024-10-27", "yyyy-MM-dd", new Date()),
            presence: "2",
          },
        ],
      },
    };

    const store = useSoldiersStore();

    expect(store.soldiers.length).toBe(3);

    expect(store.soldiers[0]).toBeInstanceOf(SoldierModel);
    expect(store.soldiers[0].id).toBe("123");
    expect(store.soldiers[0].presence.length).toBe(2);
    expect(store.soldiers[0].presence[0].date).toStrictEqual(
      parse("2024-10-27", "yyyy-MM-dd", new Date())
    );
    expect(store.soldiers[0].presence[0].presence).toBe("present");
    expect(store.soldiers[0].presence[1].presence).toBe("home");

    expect(store.soldiers[1]).toBeInstanceOf(SoldierModel);
    expect(store.soldiers[1].id).toBe("456");
    expect(store.soldiers[1].presence.length).toBe(1);
    expect(store.soldiers[1].presence[0].date).toStrictEqual(
      parse("2024-10-27", "yyyy-MM-dd", new Date())
    );
    expect(store.soldiers[1].presence[0].presence).toBe("sick");

    expect(store.soldiers[2]).toBeInstanceOf(SoldierModel);
    expect(store.soldiers[2].id).toBe("789");
    expect(store.soldiers[2].presence.length).toBe(0);
  });

  test("load available soldiers for schedule date", async () => {
    soldiersMock = [
      {
        id: "123",
        name: "משה אופניק",
        role: "קצין",
        platoon: "1",
        description: "משה אופניק [קצין] 1",
      },
      {
        id: "456",
        name: "בוב ספוג",
        role: "לוחם",
        platoon: "2",
        description: "בוב ספוג [לוחם] 2",
      },
      {
        id: "789",
        name: "ג'ורג קונסטנזה",
        role: "לוחם",
        platoon: "מפלג",
        description: "ג'ורג קונסטנזה [לוחם] מפלג",
      },
      {
        id: "101112",
        name: "צנדלר בינג",
        role: "לוחם",
        platoon: "מפלג",
        description: "צנדלר בינג [לוחם] מפלג",
      },
    ];

    presenceDtoMock.soldiersPresence = {
      "123": {
        presence: [
          {
            day: parse("2024-10-27", "yyyy-MM-dd", new Date()),
            presence: "1",
          },
          {
            day: parse("2024-10-28", "yyyy-MM-dd", new Date()),
            presence: "0",
          },
        ],
      },
      "456": {
        presence: [
          {
            day: parse("2024-10-27", "yyyy-MM-dd", new Date()),
            presence: "2",
          },
        ],
      },
      "789": {
        presence: [
          {
            day: parse("2024-10-27", "yyyy-MM-dd", new Date()),
            presence: "1",
          },
        ],
      },
    };

    scheduleDateMock = parse("2024-10-27", "yyyy-MM-dd", new Date());

    const store = useSoldiersStore();

    expect(store.availableSoldiers.length).toBe(2);

    expect(store.availableSoldiers[0]).toBeInstanceOf(SoldierModel);
    expect(store.availableSoldiers[0].id).toBe("123");

    expect(store.availableSoldiers[1]).toBeInstanceOf(SoldierModel);
    expect(store.availableSoldiers[1].id).toBe("789");
  });
});
