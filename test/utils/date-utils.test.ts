import { describe, expect, test } from "vitest";
import {
  getClosestDate,
  getHebrewDayName,
  getNextHour,
  hoursBetween,
  timeToDate,
  timeToMinutes,
} from "../../src/utils/date-utils";

describe("date utils tests", () => {
  describe("timeToDate", () => {
    test("expect 14:00 to return equivalent date object", () => {
      const date = timeToDate("14:00");

      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(0);
    });
  });

  describe("timeToMinutes", () => {
    test("should convert 00:00 to 0 minutes", () => {
      const minutes = timeToMinutes("00:00");
      expect(minutes).toBe(0);
    });

    test("should convert 01:00 to 60 minutes", () => {
      const minutes = timeToMinutes("01:00");
      expect(minutes).toBe(60);
    });

    test("should convert 14:30 to 870 minutes", () => {
      const minutes = timeToMinutes("14:30");
      expect(minutes).toBe(870); // 14 * 60 + 30
    });

    test("should convert 23:45 to 1425 minutes", () => {
      const minutes = timeToMinutes("23:45");
      expect(minutes).toBe(1425); // 23 * 60 + 45
    });

    test("should handle single digit hours with valid minutes", () => {
      const minutes = timeToMinutes("09:15");
      expect(minutes).toBe(555); // 9 * 60 + 15
    });

    test("should convert midnight 00:00 correctly", () => {
      const minutes = timeToMinutes("00:00");
      expect(minutes).toBe(0);
    });

    test("should convert noon 12:00 to 720 minutes", () => {
      const minutes = timeToMinutes("12:00");
      expect(minutes).toBe(720);
    });

    test("should handle 15-minute intervals", () => {
      expect(timeToMinutes("06:15")).toBe(375); // 6 * 60 + 15
      expect(timeToMinutes("18:45")).toBe(1125); // 18 * 60 + 45
    });

    test("should handle extended hours correctly", () => {
      expect(timeToMinutes("25:30")).toBe(1530); // 25 * 60 + 30
      expect(timeToMinutes("29:45")).toBe(1785); // 29 * 60 + 45
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
  });

  describe("getHebrewDayName", () => {
    test("should return 'יום ראשון' for Sunday", () => {
      const sunday = new Date(2024, 0, 7); // January 7, 2024 is a Sunday
      const dayName = getHebrewDayName(sunday);
      expect(dayName).toBe("יום ראשון");
    });

    test("should return 'יום שני' for Monday", () => {
      const monday = new Date(2024, 0, 8); // January 8, 2024 is a Monday
      const dayName = getHebrewDayName(monday);
      expect(dayName).toBe("יום שני");
    });

    test("should return 'יום שלישי' for Tuesday", () => {
      const tuesday = new Date(2024, 0, 9); // January 9, 2024 is a Tuesday
      const dayName = getHebrewDayName(tuesday);
      expect(dayName).toBe("יום שלישי");
    });

    test("should return 'יום רביעי' for Wednesday", () => {
      const wednesday = new Date(2024, 0, 10); // January 10, 2024 is a Wednesday
      const dayName = getHebrewDayName(wednesday);
      expect(dayName).toBe("יום רביעי");
    });

    test("should return 'יום חמישי' for Thursday", () => {
      const thursday = new Date(2024, 0, 11); // January 11, 2024 is a Thursday
      const dayName = getHebrewDayName(thursday);
      expect(dayName).toBe("יום חמישי");
    });

    test("should return 'יום שישי' for Friday", () => {
      const friday = new Date(2024, 0, 12); // January 12, 2024 is a Friday
      const dayName = getHebrewDayName(friday);
      expect(dayName).toBe("יום שישי");
    });

    test("should return 'שבת' for Saturday", () => {
      const saturday = new Date(2024, 0, 13); // January 13, 2024 is a Saturday
      const dayName = getHebrewDayName(saturday);
      expect(dayName).toBe("שבת");
    });

    test("should handle different years consistently", () => {
      const sunday2023 = new Date(2023, 11, 31); // December 31, 2023 is a Sunday
      const sunday2024 = new Date(2024, 0, 7); // January 7, 2024 is a Sunday

      expect(getHebrewDayName(sunday2023)).toBe("יום ראשון");
      expect(getHebrewDayName(sunday2024)).toBe("יום ראשון");
    });

    test("should handle leap year dates correctly", () => {
      const leapYearDate = new Date(2024, 1, 29); // February 29, 2024 (leap year) is a Thursday
      const dayName = getHebrewDayName(leapYearDate);
      expect(dayName).toBe("יום חמישי");
    });

    test("should handle edge case dates", () => {
      // Test New Year's Day 2024 (Monday)
      const newYear = new Date(2024, 0, 1);
      expect(getHebrewDayName(newYear)).toBe("יום שני");

      // Test New Year's Eve 2024 (Tuesday)
      const newYearEve = new Date(2024, 11, 31);
      expect(getHebrewDayName(newYearEve)).toBe("יום שלישי");
    });
  });
});
