import { describe, expect, test } from "vitest";
import { Shift } from "../../src/model/shift";
import { SchedulerError } from "../../src/errors/scheduler-error";
import { Position } from '../../src/model/position';

describe("Position model tests", () => {
  test("Position model initiation", () => {
    const position = new Position("123", "Patrol");

    expect(position.positionId).toBe("123");
    expect(position.positionName).toBe("Patrol");
  });

  test("Position model addShift - adding shift for all day, expecting validation to pass", () => {
    const position = new Position("123", "Patrol");

    const shift1 = new Shift("midnight_to_4am", "00:00", "04:00", 1);
    const shift2 = new Shift("4am_to_8am", "04:00", "08:00", 1);
    const shift3 = new Shift("8am_to_12pm", "08:00", "12:00", 1);
    const shift4 = new Shift("12pm_to_4pm", "12:00", "16:00", 1);
    const shift5 = new Shift("4pm_to_8pm", "16:00", "20:00", 1);
    const shift6 = new Shift("8pm_to_midnight", "20:00", "00:00", 1);

    position.addShift(shift1);
    position.addShift(shift2);
    position.addShift(shift3);
    position.addShift(shift4);
    position.addShift(shift5);
    position.addShift(shift6);

    // expect(position.shifts.length).toBe(2);
    expect(position.shifts[0]).toBe(shift1);
    expect(position.shifts[1]).toBe(shift2);
  });

});
