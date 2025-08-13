import { describe, expect, it } from "vitest";
import { SoldierAssignment } from "../../src/types/soldier-assignment";
import { getAssignmentAlertLevel } from "../../src/utils/assignment-alerts";

describe("Assignment Alerts", () => {
  const testDate = new Date("2024-01-15");

  const createAssignment = (
    startTime: string,
    endTime: string,
    positionId = "pos1",
    date = testDate
  ): SoldierAssignment => ({
    positionId,
    positionName: "Test Position",
    shiftId: `shift_${startTime}_${endTime}`,
    startTime: startTime as any,
    endTime: endTime as any,
    assignmentIndex: 0,
    date,
  });

  it("should return none for single assignment", () => {
    const assignments = [createAssignment("14:00", "18:00")];
    expect(getAssignmentAlertLevel(assignments)).toBe("none");
  });

  it("should return none for no assignments", () => {
    expect(getAssignmentAlertLevel([])).toBe("none");
  });

  it("should return red alert for parallel/overlapping shifts", () => {
    const assignments = [
      createAssignment("14:00", "22:00"),
      createAssignment("14:00", "18:00"), // Starts at same time
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe("red");
  });

  it("should return red alert for partially overlapping shifts", () => {
    const assignments = [
      createAssignment("14:00", "18:00"),
      createAssignment("16:00", "20:00"), // Overlaps 16:00-18:00
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe("red");
  });

  it("should return orange alert when gap equals first shift duration", () => {
    const assignments = [
      createAssignment("14:00", "18:00"), // 4 hours duration
      createAssignment("22:00", "02:00"), // Gap = 4 hours (18:00-22:00)
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe("orange");
  });

  it("should return orange alert when gap is less than first shift duration", () => {
    const assignments = [
      createAssignment("14:00", "18:00"), // 4 hours duration
      createAssignment("20:00", "22:00"), // Gap = 2 hours (18:00-20:00)
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe("orange");
  });

  it("should return yellow alert when gap is less than twice first shift duration", () => {
    const assignments = [
      createAssignment("14:00", "18:00"), // 4 hours duration
      createAssignment("24:00", "02:00"), // Gap = 6 hours (less than 8 hours = 2x duration)
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe("yellow");
  });

  it("should return none when gap is more than twice first shift duration", () => {
    const assignments = [
      createAssignment("14:00", "18:00"), // 4 hours duration
      createAssignment("02:00", "06:00"), // Gap = 10 hours (more than 8 hours = 2x duration)
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe("none");
  });

  it("should handle shifts crossing midnight", () => {
    const assignments = [
      createAssignment("22:00", "02:00"), // 4 hours duration, crosses midnight
      createAssignment("04:00", "08:00"), // Gap = 2 hours (02:00-04:00)
    ];
    // Since shifts are sorted by start time, 04:00-08:00 will come first
    // But we need to check the gap between them when they're in chronological order
    // The 22:00-02:00 shift ends at 02:00, and 04:00-08:00 starts at 04:00
    // Gap = 2 hours, Duration of 22:00-02:00 = 4 hours
    // Since gap (2h) < duration (4h), this should be orange
    expect(getAssignmentAlertLevel(assignments)).toBe("orange");
  });

  it("should only consider assignments on the same date", () => {
    const assignments = [
      createAssignment("14:00", "18:00", "pos1", testDate),
      createAssignment("16:00", "20:00", "pos2", new Date("2024-01-16")), // Different date
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe("none");
  });

  it("should detect cross-day gap alerts", () => {
    const yesterday = new Date("2024-11-12");
    const today = new Date("2024-11-13");

    const assignments = [
      createAssignment("10:00", "14:00", "pos1", yesterday), // Yesterday 10:00-14:00
      createAssignment("14:00", "22:00", "pos2", today), // Today 14:00-22:00
    ];
    // Gap = 0 hours (14:00 yesterday to 14:00 today = 0 hours gap)
    // Duration of first shift = 4 hours, gap = 0 hours (no gap between shifts)
    // Since gap (0h) <= duration (4h), this should be orange alert
    expect(getAssignmentAlertLevel(assignments)).toBe("orange");
  });

  it("should return highest priority alert when multiple alerts exist", () => {
    const assignments = [
      createAssignment("08:00", "12:00"), // First shift
      createAssignment("14:00", "18:00"), // Gap = 2 hours (would be orange)
      createAssignment("16:00", "20:00"), // Overlaps with second shift (red alert)
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe("red");
  });

  it("should handle multiple consecutive shifts with orange taking priority over yellow", () => {
    const assignments = [
      createAssignment("08:00", "12:00"), // 4 hours
      createAssignment("18:00", "22:00"), // Gap = 6 hours (yellow alert - less than 8)
      createAssignment("24:00", "04:00"), // Gap = 2 hours (orange alert - less than 4)
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe("orange");
  });

  it("should trigger orange alert for 14:00-22:00 and 02:00-06:00 case (user reported bug)", () => {
    const assignments = [
      createAssignment("14:00", "22:00"), // 8 hours duration (14:00-22:00)
      createAssignment("02:00", "06:00"), // 4 hours duration (02:00-06:00)
    ];
    // Gap between 22:00 and 02:00 = 4 hours
    // Since gap (4h) <= duration of first shift (8h), this should be orange
    expect(getAssignmentAlertLevel(assignments)).toBe("orange");
  });

  it("should trigger orange alert for consecutive shifts with gap = 0 (02:00-06:00 and 06:00-10:00)", () => {
    const assignments = [
      createAssignment("02:00", "06:00"), // 4 hours duration
      createAssignment("06:00", "10:00"), // 4 hours duration, starts exactly when first ends
    ];
    // Gap = 0 hours (consecutive shifts)
    // Since gap (0h) <= duration of first shift (4h), this should be orange
    expect(getAssignmentAlertLevel(assignments)).toBe("orange");
  });

  it("should NOT trigger alert for 14:00-18:00 and 06:00-10:00 next day (12 hour gap)", () => {
    const assignments = [
      createAssignment("14:00", "18:00"), // 4 hours duration
      createAssignment("06:00", "10:00"), // 4 hours duration, 12 hour gap
    ];
    // First shift: 14:00-18:00 (4 hours)
    // Second shift: 06:00-10:00 next day
    // Gap = 12 hours (18:00 to 06:00 next day)
    // Since gap (12h) > 2 * duration of first shift (8h), this should be none
    expect(getAssignmentAlertLevel(assignments)).toBe("none");
  });

  it("should NOT trigger any alert for 24-hour gap between shifts", () => {
    const yesterday = new Date("2024-11-12");
    const today = new Date("2024-11-13");

    const assignments = [
      createAssignment("14:00", "22:00", "pos1", yesterday), // Yesterday 14:00-22:00 (8 hours)
      createAssignment("22:00", "06:00", "pos2", today), // Today 22:00-06:00 (8 hours)
    ];
    // First shift: 14:00-22:00 on 12/11 (8 hours duration)
    // Second shift: 22:00-06:00 on 13/11 (8 hours duration)
    // Gap = 24 hours (22:00 on 12/11 to 22:00 on 13/11)
    // Since gap (24h) > 2 * duration of first shift (16h), this should be none
    // NOT orange as currently implemented
    expect(getAssignmentAlertLevel(assignments)).toBe("none");
  });

  it("should trigger orange alert if soldier has relevant assignments between schedules", () => {
    const yesterday = new Date("2024-11-12");
    const today = new Date("2024-11-13");

    const assignments = [
      createAssignment("06:00", "10:00", "pos1", yesterday), // Yesterday 06:00-10:00 (4 hours)
      createAssignment("14:00", "22:00", "pos2", today), // Today 14:00-22:00 (8 hours)
    ];
    // First shift: 06:00-10:00 on 12/11 (4 hours duration)
    // Second shift: 14:00-22:00 on 13/11 (8 hours duration)
    // Gap = 4 hours (10:00 on 12/11 to 14:00 on 13/11)
    // Since gap (4h) <= duration of first shift (4h), this should be orange alert
    expect(getAssignmentAlertLevel(assignments)).toBe("orange");
  });
});
