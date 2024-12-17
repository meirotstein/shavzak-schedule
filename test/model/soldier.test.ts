import { parse } from "date-fns";
import { describe, expect, test } from "vitest";
import { PresenceModel, PresenceState } from "../../src/model/presence";
import { SoldierModel } from "../../src/model/soldier";

describe("Soldier model tests", () => {
  test("Soldier model initiation", () => {
    const soldier = new SoldierModel("123", "mose ufnik", "officer", "1");

    expect(soldier.id).toBe("123");
    expect(soldier.name).toBe("mose ufnik");
    expect(soldier.role).toBe("officer");
    expect(soldier.platoon).toBe("1");
  });

  test("Soldier model add presence - sort from the earliest to the latest", () => {
    const soldier = new SoldierModel("123", "mose ufnik", "officer", "1");

    const date1 = parse("2024-10-27", "yyyy-MM-dd", new Date());
    const date2 = parse("2023-10-27", "yyyy-MM-dd", new Date());
    const date3 = parse("2024-10-30", "yyyy-MM-dd", new Date());

    soldier.addPresence(new PresenceModel(date1, "1"));
    soldier.addPresence(new PresenceModel(date2, "0"));
    soldier.addPresence(new PresenceModel(date3, "2"));

    expect(soldier.presence.length).toBe(3);

    expect(soldier.presence[0].presence).toBe(PresenceState.HOME);
    expect(soldier.presence[0].date).toStrictEqual(date2);

    expect(soldier.presence[1].presence).toBe(PresenceState.PRESENT);
    expect(soldier.presence[1].date).toStrictEqual(date1);

    expect(soldier.presence[2].presence).toBe(PresenceState.SICK);
    expect(soldier.presence[2].date).toStrictEqual(date3);
  });
});
