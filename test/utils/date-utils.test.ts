import { describe, expect, test } from "vitest";
import {
  getClosestDate,
  getNextHour,
  hoursBetween,
  timeToDate,
} from "../../src/utils/date-utils";

describe("date utils tests", () => {
  describe("timeToDate", () => {
    test("expect 14:00 to return equivalent date object", () => {
      const date = timeToDate("14:00");

      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(0);
    });
  });

  describe("hoursBetween", () => {
    test("expect 14:00 to 16:00 to return 2 hours", () => {
      const hours = hoursBetween("14:00", "16:00");

      expect(hours).toBe(2);
    });

    test("expect 16:00 to 14:00 to return 22 hours (Crossing a day)", () => {
      const hours = hoursBetween("16:00", "14:00");

      expect(hours).toBe(22);
    });
  });

  describe("getNextHour", () => {
    test("expect 14:00 with no given hours jumps to return 15:00 (one hour jump)", () => {
      const nextHour = getNextHour("14:00");

      expect(nextHour).toBe("15:00");
    });

    test("expect 14:00 with two jumps to return 16:00", () => {
      const nextHour = getNextHour("14:00", 2);

      expect(nextHour).toBe("16:00");
    });

    test("expect 14:00 with 0 jumps o return 14:00", () => {
      const nextHour = getNextHour("14:00", 0);

      expect(nextHour).toBe("14:00");
    });

    test("expect 22:00 with 4 jumps o return 02:00 (Crossing a day)", () => {
      const nextHour = getNextHour("22:00", 4);

      expect(nextHour).toBe("02:00");
    });
  });

  describe("getClosestDate", () => {
    test(" expect to return the given date is within the interval", () => {
      const date = new Date("2021-01-15T12:00:00");
      const interval = {
        start: new Date("2021-01-01T00:00:00"),
        end: new Date("2021-01-30T23:59:59"),
      };

      const closestDate = getClosestDate(date, interval);

      expect(closestDate).toStrictEqual(date);
    });

    test(" expect to return the start date when the given date is closer to it", () => {
      const date = new Date("2020-12-15T00:00:00");
      const interval = {
        start: new Date("2021-01-01T00:00:00"),
        end: new Date("2021-01-30T23:59:59"),
      };

      const closestDate = getClosestDate(date, interval);

      expect(closestDate).toStrictEqual(interval.start);
    });

    test(" expect to return the end date when the given date is closer to it", () => {
      const date = new Date("2021-02-15T00:00:00");
      const interval = {
        start: new Date("2021-01-01T00:00:00"),
        end: new Date("2021-01-30T23:59:59"),
      };

      const closestDate = getClosestDate(date, interval);

      expect(closestDate).toStrictEqual(interval.end);
    });

    test(" expect to return the given date when the end date is not given", () => {
      const date = new Date("2021-02-15T00:00:00");
      const interval = {
        start: new Date("2021-01-01T00:00:00"),
      };

      const closestDate = getClosestDate(date, interval);

      expect(closestDate).toStrictEqual(date);
    });

    test(" expect to return the given date when the start date is not given", () => {
      const date = new Date("2021-02-15T00:00:00");
      const interval = {
        end: new Date("2021-01-30T23:59:59"),
      };

      const closestDate = getClosestDate(date, interval);

      expect(closestDate).toStrictEqual(date);
    });
  });
});
