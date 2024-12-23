import { describe, expect, test } from "vitest";
import { SchedulerError } from "../../src/errors/scheduler-error";
import { ShiftModel, UnAssignableShift } from "../../src/model/shift";

describe("Shift model tests", () => {
  test("Shift model initiation", () => {
    const shift = new ShiftModel("123", "16:00", "18:00", [
      { roles: ["trooper"] },
      { roles: ["officer"] },
    ]);

    expect(shift.shiftId).toBe("123");
    expect(shift.startTime).toBe("16:00");
    expect(shift.endTime).toBe("18:00");
    expect(shift.assignments.length).toBe(2);
    expect(shift.isAssignable).toBe(true);
  });

  test("Shift model addSoldier", () => {
    const shift = new ShiftModel("123", "16:00", "18:00", [
      { roles: ["trooper"] },
      { roles: ["officer"] },
    ]);
    const soldier1 = {
      id: "123",
      name: "mose ufnik",
      role: "trooper",
      platoon: "1",
      presence: [],
    };
    const soldier2 = {
      id: "456",
      name: "mose ufnik",
      role: "officer",
      platoon: "1",
      presence: [],
    };

    shift.addSoldier(soldier1);
    shift.addSoldier(soldier2);

    expect(shift.assignments[0].soldier).toBe(soldier1);
    expect(shift.assignments[1].soldier).toBe(soldier2);
  });

  test("Shift model addSoldier add by index", () => {
    const shift = new ShiftModel("123", "16:00", "18:00", [
      { roles: ["trooper"] },
      { roles: ["officer"] },
    ]);
    const soldier1 = {
      id: "123",
      name: "mose ufnik",
      role: "officer",
      platoon: "1",
      presence: [],
    };

    shift.addSoldier(soldier1, 1);

    expect(shift.assignments[0].soldier).toBe(undefined);
    expect(shift.assignments[1].soldier).toBe(soldier1);
  });

  test("Shift model addSoldier replace by index", () => {
    const shift = new ShiftModel("123", "16:00", "18:00", [
      { roles: ["trooper"] },
      { roles: ["trooper"] },
      { roles: ["officer"] },
    ]);
    const soldier1 = {
      id: "123",
      name: "mose ufnik",
      role: "trooper",
      platoon: "1",
      presence: [],
    };
    const soldier2 = {
      id: "456",
      name: "mose ufnik",
      role: "trooper",
      platoon: "1",
      presence: [],
    };
    const soldier3 = {
      id: "789",
      name: "mose ufnik",
      role: "trooper",
      platoon: "1",
      presence: [],
    };

    shift.addSoldier(soldier1);
    shift.addSoldier(soldier2);
    shift.addSoldier(soldier3, 1);

    expect(shift.assignments[0].soldier).toBe(soldier1);
    expect(shift.assignments[1].soldier).toBe(soldier3);
    expect(shift.assignments[2].soldier).toBeUndefined();
  });

  test("Shift model - non assignable shift", () => {
    const shift = new UnAssignableShift("123", "16:00", "18:00");

    expect(shift.isAssignable).toBe(false);
  });

  test("Shift model addSoldier error: adding more than expected", () => {
    const shift = new ShiftModel("123", "16:00", "18:00", [
      { roles: ["trooper"] },
      { roles: ["trooper"] },
    ]);
    const soldier1 = {
      id: "123",
      name: "mose ufnik",
      role: "trooper",
      platoon: "1",
      presence: [],
    };
    const soldier2 = {
      id: "456",
      name: "mose ufnik",
      role: "trooper",
      platoon: "1",
      presence: [],
    };
    const soldier3 = {
      id: "789",
      name: "mose ufnik",
      role: "trooper",
      platoon: "1",
      presence: [],
    };

    shift.addSoldier(soldier1);
    shift.addSoldier(soldier2);
    expect(() => shift.addSoldier(soldier3)).toThrowError(SchedulerError);
  });

  test("Shift model addSoldier error: using exceeds index", () => {
    const shift = new ShiftModel("123", "16:00", "18:00", [
      { roles: ["trooper"] },
      { roles: ["trooper"] },
    ]);
    const soldier1 = {
      id: "123",
      name: "mose ufnik",
      role: "officer",
      platoon: "1",
      presence: [],
    };

    expect(() => shift.addSoldier(soldier1, 3)).toThrowError(SchedulerError);
  });

  // TODO: should expect relevant error/warning msg
  // test("Shift model addSoldier error: unexpected soldier role", () => {
  //   const shift = new ShiftModel("123", "16:00", "18:00", [
  //     { roles: ["trooper"] },
  //     { roles: ["trooper"] },
  //   ]);
  //   const soldier1 = {
  //     id: "123",
  //     name: "mose ufnik",
  //     role: "officer",
  //     platoon: "1",
  //     presence: [],
  //   };

  //   expect(() => shift.addSoldier(soldier1, 0)).toThrowError(SchedulerError);
  // });
});
