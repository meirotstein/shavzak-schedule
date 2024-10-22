import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SoldierModel } from "../../src/model/soldier";
import { useSoldiersStore } from "../../src/store/soldiers";
import { SoldierDto } from "../../src/types/client-dto";

let soldiersMock: SoldierDto[] = [];
vi.mock("../../src/store/gapi", () => {
  return {
    useGAPIStore: () => {
      return {
        soldiers: soldiersMock,
      };
    },
  };
});

describe("soldiers store tests", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    soldiersMock = [];
    vi.resetAllMocks();
  });

  test("fetchSoldiers from backend", async () => {
    soldiersMock = [
      { id: "123", name: "משה אופניק", role: "קצין" },
      { id: "456", name: "בוב ספוג", role: "לוחם" },
      { id: "789", name: "ג'ורג קונסטנזה", role: "לוחם" },
    ];

    const store = useSoldiersStore();

    expect(store.soldiers.length).toBe(3);

    expect(store.soldiers[0]).toBeInstanceOf(SoldierModel);
    expect(store.soldiers[0].id).toBe("123");
    expect(store.soldiers[0].name).toBe("משה אופניק");
    expect(store.soldiers[0].role).toBe("קצין");

    expect(store.soldiers[1]).toBeInstanceOf(SoldierModel);
    expect(store.soldiers[1].id).toBe("456");
    expect(store.soldiers[1].name).toBe("בוב ספוג");
    expect(store.soldiers[1].role).toBe("לוחם");

    expect(store.soldiers[2]).toBeInstanceOf(SoldierModel);
    expect(store.soldiers[2].id).toBe("789");
    expect(store.soldiers[2].name).toBe("ג'ורג קונסטנזה");
    expect(store.soldiers[2].role).toBe("לוחם");
  });

  test("findSoldierById", async () => {
    soldiersMock = [
      { id: "123", name: "משה אופניק", role: "קצין" },
      { id: "456", name: "בוב ספוג", role: "לוחם" },
      { id: "789", name: "ג'ורג קונסטנזה", role: "לוחם" },
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

    store.setDraggedSoldier(new SoldierModel("123", "משה אופניק", "קצין"));

    expect(store.draggedSoldier).toBeInstanceOf(SoldierModel);
    expect(store.draggedSoldier?.id).toBe("123");
    expect(store.draggedSoldier?.name).toBe("משה אופניק");
    expect(store.draggedSoldier?.role).toBe("קצין");
  });
});
