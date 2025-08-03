import { describe, expect, test } from "vitest";
import {
  getClosestDate,
  getHebrewDayName,
  getNextHour,
  hoursBetween,
  timeToDate,
  timeToMinutes,
  toHebrewDateString,
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

  describe("toHebrewDateString", () => {
    test("should return Hebrew date with gematriya format", () => {
      // Test with a known date: November 12, 2024 (11 Cheshvan 5785)
      const testDate = new Date(2024, 10, 12); // Month is 0-indexed, so 10 = November
      const hebrewDate = toHebrewDateString(testDate);

      // Should return format like "י״א חֶשְׁוָן תשפ״ה"
      expect(hebrewDate).toMatch(/^[א-ת״]+ [א-תְֱֲֳִֵֶַָָֹֻּֽׁ]+ [א-ת״]+$/);
      expect(hebrewDate).toContain("חֶשְׁוָן"); // Cheshvan month
      expect(hebrewDate).toContain("תשפ״ה"); // Year 5785 in Hebrew letters
    });

    test("should handle different months correctly", () => {
      // Test with Tishrei (September/October)
      const tishreiDate = new Date(2024, 9, 15); // October 15, 2024 (13 Tishrei 5785)
      const tishreiHebrew = toHebrewDateString(tishreiDate);

      expect(tishreiHebrew).toContain("תִּשְׁרֵי"); // Tishrei month
      expect(tishreiHebrew).toContain("י״ג"); // 13 in Hebrew letters
    });

    test("should handle single digit days correctly", () => {
      // Test with day 4
      const day4Date = new Date(2024, 10, 5); // November 5, 2024 (4 Cheshvan 5785)
      const day4Hebrew = toHebrewDateString(day4Date);

      expect(day4Hebrew).toContain("ד׳"); // 4 in Hebrew letters
    });

    test("should handle double digit days correctly", () => {
      // Test with day 19
      const day19Date = new Date(2024, 10, 20); // November 20, 2024 (19 Cheshvan 5785)
      const day19Hebrew = toHebrewDateString(day19Date);

      expect(day19Hebrew).toContain("י״ט"); // 19 in Hebrew letters
    });

    test("should handle leap year correctly", () => {
      // Test with a leap year date (2024 is a leap year)
      const leapYearDate = new Date(2024, 1, 29); // February 29, 2024 (29 Adar I 5784)
      const leapYearHebrew = toHebrewDateString(leapYearDate);

      expect(leapYearHebrew).toContain("תשפ״ד"); // Year 5784 in Hebrew letters
    });

    test("should handle current date correctly", () => {
      const currentDate = new Date();
      const currentHebrew = toHebrewDateString(currentDate);

      // Should be a valid Hebrew date string
      expect(currentHebrew.length).toBeGreaterThan(0);
      expect(typeof currentHebrew).toBe("string");
    });

    test("should handle edge case dates", () => {
      // Test with Rosh Hashanah (first day of Tishrei)
      const roshHashanah = new Date(2024, 9, 3); // October 3, 2024 (1 Tishrei 5785)
      const roshHashanahHebrew = toHebrewDateString(roshHashanah);

      expect(roshHashanahHebrew).toContain("א׳"); // 1 in Hebrew letters
      expect(roshHashanahHebrew).toContain("תִּשְׁרֵי"); // Tishrei month
    });

    test("should handle end of month dates", () => {
      // Test with last day of a month
      const lastDayDate = new Date(2024, 10, 30); // November 30, 2024 (29 Cheshvan 5785)
      const lastDayHebrew = toHebrewDateString(lastDayDate);

      expect(lastDayHebrew).toContain("כ״ט"); // 29 in Hebrew letters
    });

    test("should return consistent format for same date", () => {
      const testDate = new Date(2024, 10, 12);
      const hebrew1 = toHebrewDateString(testDate);
      const hebrew2 = toHebrewDateString(testDate);

      expect(hebrew1).toBe(hebrew2);
    });
  });
});
