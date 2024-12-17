import { parse } from "date-fns";
import { describe, expect, test } from "vitest";
import { PresenceModel, PresenceState } from "../../src/model/presence";

describe("Presence model tests", () => {
  test("Presence model initiation with value PRESENT", () => {
    const date = parse("2024-10-27", "yyyy-MM-dd", new Date());
    const presence = new PresenceModel(date, "1");

    expect(presence.date).toStrictEqual(date);
    expect(presence.presence).toBe(PresenceState.PRESENT);
  });

  test("Presence model initiation with value HOME", () => {
    const date = parse("2024-10-27", "yyyy-MM-dd", new Date());
    const presence = new PresenceModel(date, "0");

    expect(presence.date).toStrictEqual(date);
    expect(presence.presence).toBe(PresenceState.HOME);
  });

  test("Presence model initiation with value SICK", () => {
    const date = parse("2024-10-27", "yyyy-MM-dd", new Date());
    const presence = new PresenceModel(date, "2");

    expect(presence.date).toStrictEqual(date);
    expect(presence.presence).toBe(PresenceState.SICK);
  });

  test("Presence model initiation with value DISCHARGED", () => {
    const date = parse("2024-10-27", "yyyy-MM-dd", new Date());
    const presence = new PresenceModel(date, "");

    expect(presence.date).toStrictEqual(date);
    expect(presence.presence).toBe(PresenceState.DISCHARGED);
  });

  test("Presence model initiation with unexpected value is considered as DISCHARGED", () => {
    const date = parse("2024-10-27", "yyyy-MM-dd", new Date());
    const presence = new PresenceModel(date, "unexpected");

    expect(presence.date).toStrictEqual(date);
    expect(presence.presence).toBe(PresenceState.DISCHARGED);
  });
});
