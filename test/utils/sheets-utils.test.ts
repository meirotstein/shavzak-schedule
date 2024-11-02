import { describe, expect, test } from "vitest";
import { numberToColumnLetter } from "../../src/utils/sheets-utils";

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
});
