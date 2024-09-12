import { describe, expect, test } from "vitest";
import { Shift } from "../../src/model/shift";
import { SchedulerError } from "../../src/errors/scheduler-error";
import { Position } from "../../src/model/position";

describe("Position model tests", () => {
  test("Position model initiation", () => {
    const position = new Position("123", "Patrol");

    expect(position.positionId).toBe("123");
    expect(position.positionName).toBe("Patrol");
  });

  test("Position model addShift - adding shift for all day, expecting validation to pass", () => {
    const position = new Position("123", "Patrol");

    const shift1 = new Shift("midnight_to_4am", "00:00", "04:00", [
      { role: "trooper" },
    ]);
    const shift2 = new Shift("4am_to_8am", "04:00", "08:00", [
      { role: "trooper" },
    ]);
    const shift3 = new Shift("8am_to_12pm", "08:00", "12:00", [
      { role: "trooper" },
    ]);
    const shift4 = new Shift("12pm_to_4pm", "12:00", "16:00", [
      { role: "trooper" },
    ]);
    const shift5 = new Shift("4pm_to_8pm", "16:00", "20:00", [
      { role: "trooper" },
    ]);
    const shift6 = new Shift("8pm_to_midnight", "20:00", "00:00", [
      { role: "trooper" },
    ]);

    position.addShift(shift1);
    position.addShift(shift2);
    position.addShift(shift3);
    position.addShift(shift4);
    position.addShift(shift5);
    position.addShift(shift6);

    expect(position.shifts.length).toBe(6);
    expect(position.shifts[0]).toBe(shift1);
    expect(position.shifts[1]).toBe(shift2);
    expect(position.shifts[2]).toBe(shift3);
    expect(position.shifts[3]).toBe(shift4);
    expect(position.shifts[4]).toBe(shift5);
    expect(position.shifts[5]).toBe(shift6);
  });

  test("Position model addShift - adding shift overlapping shifts, expecting validation to fail", () => {
    const position = new Position("123", "Patrol");

    const shift1 = new Shift("midnight_to_4am", "00:00", "04:00", [
      { role: "trooper" },
    ]);
    const shift2 = new Shift("2am_to_8am", "02:00", "08:00", [
      { role: "trooper" },
    ]);

    position.addShift(shift1);
    expect(() => position.addShift(shift2)).toThrowError(SchedulerError);
  });
});
