import { describe, expect, test } from "vitest";
import { numberToColumnLetter, shiftsByStartTimeCompare } from "../../src/utils/sheets-utils";
import { ShiftDto } from "../../src/types/client-dto";

describe("sheets utils tests", () => {
  test("numberToColumnLetter", () => {
    expect(numberToColumnLetter(1)).toBe("A");
    expect(numberToColumnLetter(2)).toBe("B");
    expect(numberToColumnLetter(3)).toBe("C");
    expect(numberToColumnLetter(26)).toBe("Z");
    expect(numberToColumnLetter(27)).toBe("AA");
    expect(numberToColumnLetter(28)).toBe("AB");
    expect(numberToColumnLetter(52)).toBe("AZ");
    expect(numberToColumnLetter(53)).toBe("BA");
    expect(numberToColumnLetter(54)).toBe("BB");
    expect(numberToColumnLetter(78)).toBe("BZ");
    expect(numberToColumnLetter(79)).toBe("CA");
    expect(numberToColumnLetter(80)).toBe("CB");
    expect(numberToColumnLetter(702)).toBe("ZZ");
    expect(numberToColumnLetter(703)).toBe("AAA");
    expect(numberToColumnLetter(704)).toBe("AAB");
  });

  describe("shiftsByStartTimeCompare", () => {
    const createMockShift = (startTime: any): ShiftDto => ({
      id: "mock-shift",
      startTime,
      endTime: "10:00",
      assignmentDefs: [],
      soldierIds: []
    });

    test("should return 0 for shifts with the same start time", () => {
      const dayStartMinutes = 14 * 60; // 14:00
      const shiftA = createMockShift("16:00");
      const shiftB = createMockShift("16:00");

      const result = shiftsByStartTimeCompare(dayStartMinutes, shiftA, shiftB);
      expect(result).toBe(0);
    });

    test("should sort shifts correctly relative to 14:00 day start", () => {
      const dayStartMinutes = 14 * 60; // 14:00
      const shift14 = createMockShift("14:00"); // Day start
      const shift16 = createMockShift("16:00"); // 2 hours after start
      const shift22 = createMockShift("22:00"); // 8 hours after start
      const shift06 = createMockShift("06:00"); // 16 hours after start (next day)

      // Earlier shift should come first (negative result)
      expect(shiftsByStartTimeCompare(dayStartMinutes, shift14, shift16)).toBeLessThan(0);
      expect(shiftsByStartTimeCompare(dayStartMinutes, shift16, shift22)).toBeLessThan(0);
      expect(shiftsByStartTimeCompare(dayStartMinutes, shift22, shift06)).toBeLessThan(0);

      // Later shift should come after (positive result)
      expect(shiftsByStartTimeCompare(dayStartMinutes, shift16, shift14)).toBeGreaterThan(0);
      expect(shiftsByStartTimeCompare(dayStartMinutes, shift22, shift16)).toBeGreaterThan(0);
      expect(shiftsByStartTimeCompare(dayStartMinutes, shift06, shift22)).toBeGreaterThan(0);
    });

    test("should handle midnight transition correctly", () => {
      const dayStartMinutes = 14 * 60; // 14:00
      const shift23 = createMockShift("23:00"); // Before midnight
      const shift01 = createMockShift("01:00"); // After midnight (next day)

      // 23:00 should come before 01:00 when day starts at 14:00
      expect(shiftsByStartTimeCompare(dayStartMinutes, shift23, shift01)).toBeLessThan(0);
      expect(shiftsByStartTimeCompare(dayStartMinutes, shift01, shift23)).toBeGreaterThan(0);
    });

    test("should work with different day start times", () => {
      // Test with 00:00 day start (normal day)
      const midnightDayStart = 0;
      const shift06 = createMockShift("06:00");
      const shift12 = createMockShift("12:00");
      
      expect(shiftsByStartTimeCompare(midnightDayStart, shift06, shift12)).toBeLessThan(0);

      // Test with 22:00 day start (night shift schedule)
      const nightDayStart = 22 * 60; // 22:00
      const shift22 = createMockShift("22:00"); // Start of night shift day
      const shift02 = createMockShift("02:00"); // Early morning (4 hours after start)
      const shift10 = createMockShift("10:00"); // Late morning (12 hours after start)

      expect(shiftsByStartTimeCompare(nightDayStart, shift22, shift02)).toBeLessThan(0);
      expect(shiftsByStartTimeCompare(nightDayStart, shift02, shift10)).toBeLessThan(0);
    });

    test("should handle 15-minute intervals correctly", () => {
      const dayStartMinutes = 14 * 60; // 14:00
      const shift1415 = createMockShift("14:15");
      const shift1430 = createMockShift("14:30");
      const shift1445 = createMockShift("14:45");

      expect(shiftsByStartTimeCompare(dayStartMinutes, shift1415, shift1430)).toBeLessThan(0);
      expect(shiftsByStartTimeCompare(dayStartMinutes, shift1430, shift1445)).toBeLessThan(0);
      expect(shiftsByStartTimeCompare(dayStartMinutes, shift1415, shift1445)).toBeLessThan(0);
    });

    test("should handle extended hours correctly", () => {
      const dayStartMinutes = 14 * 60; // 14:00
      const shift25 = createMockShift("25:00"); // Extended hour (equivalent to 01:00 next day)
      const shift26 = createMockShift("26:30"); // Extended hour (equivalent to 02:30 next day)

      expect(shiftsByStartTimeCompare(dayStartMinutes, shift25, shift26)).toBeLessThan(0);
    });

    test("should be transitive (if A < B and B < C, then A < C)", () => {
      const dayStartMinutes = 14 * 60; // 14:00
      const shiftA = createMockShift("14:00");
      const shiftB = createMockShift("18:00");
      const shiftC = createMockShift("22:00");

      const compareAB = shiftsByStartTimeCompare(dayStartMinutes, shiftA, shiftB);
      const compareBC = shiftsByStartTimeCompare(dayStartMinutes, shiftB, shiftC);
      const compareAC = shiftsByStartTimeCompare(dayStartMinutes, shiftA, shiftC);

      expect(compareAB).toBeLessThan(0);
      expect(compareBC).toBeLessThan(0);
      expect(compareAC).toBeLessThan(0);
    });
  });
});
