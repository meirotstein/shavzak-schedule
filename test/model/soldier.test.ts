import { describe, expect, test } from "vitest";
import { Soldier } from "../../src/model/soldier";

describe("Soldier model tests", () => {
  test("Soldier model initiation", () => {
    const soldier = new Soldier("123", "mose ufnik", "officer");

    expect(soldier.id).toBe("123");
    expect(soldier.name).toBe("mose ufnik");
    expect(soldier.role).toBe("officer");
  });
});
