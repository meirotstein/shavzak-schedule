import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test } from "vitest";
import { useAssignmentsStore } from "../../src/store/assignments";
import { useScheduleStore } from "../../src/store/schedule";
import { ISoldier } from "../../src/model/soldier";
import { SoldierAssignment } from "../../src/types/soldier-assignment";
import { ShiftHours } from "../../src/types/shift-hours";
import { PresenceState } from "../../src/model/presence";

describe("SoldierCard Past Assignments Logic Tests", () => {
  let assignmentsStore: ReturnType<typeof useAssignmentsStore>;
  let scheduleStore: ReturnType<typeof useScheduleStore>;
  
  const mockSoldier: ISoldier = {
    id: "12345",
    name: "משה אופניק",
    role: "לוחם",
    platoon: "מחלקה א",
    presence: [],
    addPresence: () => {}
  };

  // Test dates
  const currentDate = new Date(2024, 10, 11); // November 11, 2024
  const pastDate1 = new Date(2024, 10, 9);   // November 9, 2024 (2 days ago)
  const pastDate2 = new Date(2024, 10, 10);  // November 10, 2024 (1 day ago)
  const futureDate1 = new Date(2024, 10, 13); // November 13, 2024 (2 days future)
  const futureDate2 = new Date(2024, 10, 14); // November 14, 2024 (3 days future)

  beforeEach(() => {
    setActivePinia(createPinia());
    assignmentsStore = useAssignmentsStore();
    scheduleStore = useScheduleStore();
    
    // Set current date in schedule store using the proper method
    scheduleStore.setScheduleDate(currentDate);
  });

  const createAssignment = (date: Date, positionName: string, startTime: ShiftHours, endTime: ShiftHours): SoldierAssignment => ({
    positionId: `pos-${positionName}`,
    positionName,
    shiftId: `shift-${positionName}`,
    startTime,
    endTime,
    assignmentIndex: 0,
    date
  });

  // Helper function to simulate the pastAssignments computed property logic
  const getPastAssignments = (soldierId: string) => {
    const allAssignments = assignmentsStore.getAllAssignments(soldierId);
    const currentDate = scheduleStore.scheduleDate || new Date();
    
    return allAssignments
      .filter(assignment => assignment.date < currentDate) // Only assignments from dates before current date
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by date descending (most recent first)
      .slice(0, 3); // Take up to 3 most recent past assignments
  };

  test("should filter past assignments correctly - only show assignments before current date", () => {
    // Add assignments across different dates
    const pastAssignment1 = createAssignment(pastDate1, "סיור 1", "14:00", "22:00");
    const pastAssignment2 = createAssignment(pastDate2, "יזומה", "22:00", "06:00");
    const currentAssignment = createAssignment(currentDate, "עמדה 1", "06:00", "14:00");
    const futureAssignment1 = createAssignment(futureDate1, "עמדה 2", "14:00", "22:00");
    const futureAssignment2 = createAssignment(futureDate2, "שער", "22:00", "06:00");

    assignmentsStore.addAssignment(mockSoldier.id, pastAssignment1);
    assignmentsStore.addAssignment(mockSoldier.id, pastAssignment2);
    assignmentsStore.addAssignment(mockSoldier.id, currentAssignment);
    assignmentsStore.addAssignment(mockSoldier.id, futureAssignment1);
    assignmentsStore.addAssignment(mockSoldier.id, futureAssignment2);

    const pastAssignments = getPastAssignments(mockSoldier.id);

    // Should only include assignments from dates before current date
    expect(pastAssignments).toHaveLength(2);
    expect(pastAssignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ 
          positionName: "יזומה", 
          date: pastDate2 
        }),
        expect.objectContaining({ 
          positionName: "סיור 1", 
          date: pastDate1 
        })
      ])
    );

    // Should NOT include current date assignment
    expect(pastAssignments).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ date: currentDate })
      ])
    );

    // Should NOT include future assignments
    expect(pastAssignments).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ date: futureDate1 }),
        expect.objectContaining({ date: futureDate2 })
      ])
    );
  });

  test("should sort past assignments by date descending (most recent first)", () => {
    const oldAssignment = createAssignment(pastDate1, "סיור 1", "14:00", "22:00");
    const recentAssignment = createAssignment(pastDate2, "יזומה", "22:00", "06:00");

    assignmentsStore.addAssignment(mockSoldier.id, oldAssignment);
    assignmentsStore.addAssignment(mockSoldier.id, recentAssignment);

    const pastAssignments = getPastAssignments(mockSoldier.id);

    expect(pastAssignments).toHaveLength(2);
    // Most recent past assignment should be first
    expect(pastAssignments[0].date).toEqual(pastDate2);
    expect(pastAssignments[1].date).toEqual(pastDate1);
  });

  test("should limit past assignments to maximum of 3", () => {
    const dates = [
      new Date(2024, 10, 7),  // 4 days ago
      new Date(2024, 10, 8),  // 3 days ago
      new Date(2024, 10, 9),  // 2 days ago
      new Date(2024, 10, 10), // 1 day ago
    ];

    // Add 4 past assignments
    dates.forEach((date, index) => {
      const assignment = createAssignment(date, `Position ${index + 1}`, "14:00", "22:00");
      assignmentsStore.addAssignment(mockSoldier.id, assignment);
    });

    const pastAssignments = getPastAssignments(mockSoldier.id);

    // Should only include the 3 most recent past assignments
    expect(pastAssignments).toHaveLength(3);
    
    // Should be the 3 most recent (excluding the oldest one from Nov 7)
    expect(pastAssignments[0].date).toEqual(dates[3]); // Most recent
    expect(pastAssignments[1].date).toEqual(dates[2]);
    expect(pastAssignments[2].date).toEqual(dates[1]);
    
    // Should not include the oldest assignment
    expect(pastAssignments).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ date: dates[0] })
      ])
    );
  });

  test("should return empty array when no past assignments exist", () => {
    // Only add current and future assignments
    const currentAssignment = createAssignment(currentDate, "עמדה 1", "14:00", "22:00");
    const futureAssignment = createAssignment(futureDate1, "עמדה 2", "22:00", "06:00");

    assignmentsStore.addAssignment(mockSoldier.id, currentAssignment);
    assignmentsStore.addAssignment(mockSoldier.id, futureAssignment);

    const pastAssignments = getPastAssignments(mockSoldier.id);

    expect(pastAssignments).toHaveLength(0);
  });

  test("should update past assignments when schedule date changes", () => {
    const assignment = createAssignment(pastDate1, "סיור 1", "14:00", "22:00");
    assignmentsStore.addAssignment(mockSoldier.id, assignment);

    let pastAssignments = getPastAssignments(mockSoldier.id);

    // Initially, pastDate1 should be considered past
    expect(pastAssignments).toHaveLength(1);

    // Change schedule date to an earlier date, making the assignment "future"
    scheduleStore.setScheduleDate(new Date(2024, 10, 8)); // November 8, 2024
    
    pastAssignments = getPastAssignments(mockSoldier.id);
    
    // Now the assignment should not be considered past anymore
    expect(pastAssignments).toHaveLength(0);
  });

  test("should exclude assignments from exact same date as current", () => {
    // Add assignment for same date as current
    const sameDateAssignment = createAssignment(currentDate, "עמדה 1", "14:00", "22:00");
    const pastAssignment = createAssignment(pastDate1, "סיור 1", "22:00", "06:00");

    assignmentsStore.addAssignment(mockSoldier.id, sameDateAssignment);
    assignmentsStore.addAssignment(mockSoldier.id, pastAssignment);

    const pastAssignments = getPastAssignments(mockSoldier.id);

    // Should only include the past assignment, not the same-date assignment
    expect(pastAssignments).toHaveLength(1);
    expect(pastAssignments[0].date).toEqual(pastDate1);
    expect(pastAssignments[0].positionName).toBe("סיור 1");
  });

  test("should handle edge case with exact midnight dates", () => {
    // Create dates at exactly midnight to test date boundary conditions
    const midnightCurrent = new Date(2024, 10, 11, 0, 0, 0, 0); // November 11, 2024 00:00:00
    const midnightPast = new Date(2024, 10, 10, 23, 59, 59, 999); // November 10, 2024 23:59:59

    scheduleStore.setScheduleDate(midnightCurrent);

    const pastAssignment = createAssignment(midnightPast, "סיור לילה", "22:00", "06:00");
    assignmentsStore.addAssignment(mockSoldier.id, pastAssignment);

    const pastAssignments = getPastAssignments(mockSoldier.id);

    // Should include the assignment from the previous day
    expect(pastAssignments).toHaveLength(1);
    expect(pastAssignments[0].positionName).toBe("סיור לילה");
  });
}); 