import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test } from "vitest";
import { useAssignmentsStore } from "../../src/store/assignments";
import { SoldierAssignment } from "../../src/types/soldier-assignment";
import { ShiftHours } from "../../src/types/shift-hours";

describe("assignments store tests", () => {
  const testDate1 = new Date(2024, 10, 4); // November 4, 2024
  const testDate2 = new Date(2024, 10, 5); // November 5, 2024

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("should initialize with empty assignments", () => {
    const store = useAssignmentsStore();
    
    expect(store.getAssignments("soldier1")).toEqual([]);
    expect(store.isAssigned("soldier1")).toBe(false);
  });

  test("should add assignment to soldier", () => {
    const store = useAssignmentsStore();
    const assignment: SoldierAssignment = {
      positionId: "pos-1",
      positionName: "סיור 1",
      shiftId: "shift-1",
      startTime: "14:00" as ShiftHours,
      endTime: "22:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };

    store.addAssignment("soldier1", assignment);

    expect(store.getAssignments("soldier1")).toEqual([assignment]);
    expect(store.isAssigned("soldier1")).toBe(true);
  });

  test("should add multiple assignments to the same soldier", () => {
    const store = useAssignmentsStore();
    const assignment1: SoldierAssignment = {
      positionId: "pos-1",
      positionName: "סיור 1",
      shiftId: "shift-1",
      startTime: "14:00" as ShiftHours,
      endTime: "22:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };
    const assignment2: SoldierAssignment = {
      positionId: "pos-2",
      positionName: "שער",
      shiftId: "shift-2",
      startTime: "22:00" as ShiftHours,
      endTime: "06:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };

    store.addAssignment("soldier1", assignment1);
    store.addAssignment("soldier1", assignment2);

    expect(store.getAssignments("soldier1")).toEqual([assignment1, assignment2]);
    expect(store.isAssigned("soldier1")).toBe(true);
  });

  test("should add assignments to different soldiers", () => {
    const store = useAssignmentsStore();
    const assignment1: SoldierAssignment = {
      positionId: "pos-1",
      positionName: "סיור 1",
      shiftId: "shift-1",
      startTime: "14:00" as ShiftHours,
      endTime: "22:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };
    const assignment2: SoldierAssignment = {
      positionId: "pos-2",
      positionName: "שער",
      shiftId: "shift-2",
      startTime: "22:00" as ShiftHours,
      endTime: "06:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };

    store.addAssignment("soldier1", assignment1);
    store.addAssignment("soldier2", assignment2);

    expect(store.getAssignments("soldier1")).toEqual([assignment1]);
    expect(store.getAssignments("soldier2")).toEqual([assignment2]);
    expect(store.isAssigned("soldier1")).toBe(true);
    expect(store.isAssigned("soldier2")).toBe(true);
  });

  test("should remove assignment from soldier", () => {
    const store = useAssignmentsStore();
    const assignment: SoldierAssignment = {
      positionId: "pos-1",
      positionName: "סיור 1",
      shiftId: "shift-1",
      startTime: "14:00" as ShiftHours,
      endTime: "22:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };

    store.addAssignment("soldier1", assignment);
    expect(store.getAssignments("soldier1")).toEqual([assignment]);

    store.removeAssignment("soldier1", "pos-1", "shift-1", testDate1);
    expect(store.getAssignments("soldier1")).toEqual([]);
    expect(store.isAssigned("soldier1")).toBe(false);
  });

  test("should remove specific assignment when soldier has multiple", () => {
    const store = useAssignmentsStore();
    const assignment1: SoldierAssignment = {
      positionId: "pos-1",
      positionName: "סיור 1",
      shiftId: "shift-1",
      startTime: "14:00" as ShiftHours,
      endTime: "22:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };
    const assignment2: SoldierAssignment = {
      positionId: "pos-2",
      positionName: "שער",
      shiftId: "shift-2",
      startTime: "22:00" as ShiftHours,
      endTime: "06:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };

    store.addAssignment("soldier1", assignment1);
    store.addAssignment("soldier1", assignment2);

    store.removeAssignment("soldier1", "pos-1", "shift-1", testDate1);
    expect(store.getAssignments("soldier1")).toEqual([assignment2]);
    expect(store.isAssigned("soldier1")).toBe(true);
  });

  test("should handle removing non-existent assignment", () => {
    const store = useAssignmentsStore();
    const assignment: SoldierAssignment = {
      positionId: "pos-1",
      positionName: "סיור 1",
      shiftId: "shift-1",
      startTime: "14:00" as ShiftHours,
      endTime: "22:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };

    store.addAssignment("soldier1", assignment);

    // Try to remove non-existent assignment
    store.removeAssignment("soldier1", "pos-999", "shift-999", testDate1);
    expect(store.getAssignments("soldier1")).toEqual([assignment]);
    expect(store.isAssigned("soldier1")).toBe(true);
  });

  test("should handle removing assignment from soldier with no assignments", () => {
    const store = useAssignmentsStore();

    // Try to remove from soldier with no assignments
    store.removeAssignment("soldier1", "pos-1", "shift-1", testDate1);
    expect(store.getAssignments("soldier1")).toEqual([]);
    expect(store.isAssigned("soldier1")).toBe(false);
  });

  test("should clear all assignments for soldier", () => {
    const store = useAssignmentsStore();
    const assignment1: SoldierAssignment = {
      positionId: "pos-1",
      positionName: "סיור 1",
      shiftId: "shift-1",
      startTime: "14:00" as ShiftHours,
      endTime: "22:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };
    const assignment2: SoldierAssignment = {
      positionId: "pos-2",
      positionName: "שער",
      shiftId: "shift-2",
      startTime: "22:00" as ShiftHours,
      endTime: "06:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };

    store.addAssignment("soldier1", assignment1);
    store.addAssignment("soldier1", assignment2);

    store.clearAssignments("soldier1");
    expect(store.getAssignments("soldier1")).toEqual([]);
    expect(store.isAssigned("soldier1")).toBe(false);
  });

  test("should handle clearing assignments for soldier with no assignments", () => {
    const store = useAssignmentsStore();

    store.clearAssignments("soldier1");
    expect(store.getAssignments("soldier1")).toEqual([]);
    expect(store.isAssigned("soldier1")).toBe(false);
  });

  test("should maintain assignment data integrity", () => {
    const store = useAssignmentsStore();
    const assignment: SoldierAssignment = {
      positionId: "pos-1",
      positionName: "סיור 1",
      shiftId: "shift-1",
      startTime: "14:00" as ShiftHours,
      endTime: "22:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };

    store.addAssignment("soldier1", assignment);
    const retrievedAssignments = store.getAssignments("soldier1");

    expect(retrievedAssignments[0]).toEqual(assignment);
    expect(retrievedAssignments[0].positionId).toBe("pos-1");
    expect(retrievedAssignments[0].startTime).toBe("14:00");
    expect(retrievedAssignments[0].endTime).toBe("22:00");
    expect(retrievedAssignments[0].date).toEqual(testDate1);
  });

  test("should handle assignment operations for different soldiers independently", () => {
    const store = useAssignmentsStore();
    const assignment1: SoldierAssignment = {
      positionId: "pos-1",
      positionName: "סיור 1",
      shiftId: "shift-1",
      startTime: "14:00" as ShiftHours,
      endTime: "22:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };
    const assignment2: SoldierAssignment = {
      positionId: "pos-2",
      positionName: "שער",
      shiftId: "shift-2",
      startTime: "22:00" as ShiftHours,
      endTime: "06:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };

    store.addAssignment("soldier1", assignment1);
    store.addAssignment("soldier2", assignment2);

    // Remove assignment from soldier1 should not affect soldier2
    store.removeAssignment("soldier1", "pos-1", "shift-1", testDate1);

    expect(store.getAssignments("soldier1")).toEqual([]);
    expect(store.getAssignments("soldier2")).toEqual([assignment2]);
    expect(store.isAssigned("soldier1")).toBe(false);
    expect(store.isAssigned("soldier2")).toBe(true);
  });

  test("should handle complex assignment scenarios", () => {
    const store = useAssignmentsStore();
    const assignments = [
      {
        positionId: "pos-1",
        positionName: "סיור 1",
        shiftId: "shift-1",
        startTime: "14:00" as ShiftHours,
        endTime: "22:00" as ShiftHours,
        assignmentIndex: 0,
        date: testDate1
      },
      {
        positionId: "pos-1",
        positionName: "סיור 1",
        shiftId: "shift-2",
        startTime: "22:00" as ShiftHours,
        endTime: "06:00" as ShiftHours,
        assignmentIndex: 1,
        date: testDate1
      },
      {
        positionId: "pos-2",
        positionName: "שער",
        shiftId: "shift-3",
        startTime: "06:00" as ShiftHours,
        endTime: "14:00" as ShiftHours,
        assignmentIndex: 0,
        date: testDate1
      }
    ];

    store.addAssignment("soldier1", assignments[0]);
    store.addAssignment("soldier1", assignments[1]);
    store.addAssignment("soldier2", assignments[2]);

    // Verify initial state
    expect(store.getAssignments("soldier1")).toHaveLength(2);
    expect(store.getAssignments("soldier2")).toHaveLength(1);
    expect(store.isAssigned("soldier1")).toBe(true);
    expect(store.isAssigned("soldier2")).toBe(true);

    // Remove one assignment from soldier1
    store.removeAssignment("soldier1", "pos-1", "shift-1", testDate1);
    
    expect(store.getAssignments("soldier1")).toHaveLength(1);
    expect(store.getAssignments("soldier1")).toEqual([assignments[1]]);
    expect(store.isAssigned("soldier1")).toBe(true);

    // Clear all assignments from soldier2
    store.clearAssignments("soldier2");
    
    expect(store.getAssignments("soldier2")).toEqual([]);
    expect(store.isAssigned("soldier2")).toBe(false);
  });

  test("should clear all assignments from all soldiers", () => {
    const store = useAssignmentsStore();
    
    const assignment1: SoldierAssignment = {
      positionId: "pos-1",
      positionName: "סיור 1",
      shiftId: "shift-1",
      startTime: "14:00" as ShiftHours,
      endTime: "22:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };
    
    const assignment2: SoldierAssignment = {
      positionId: "pos-2",
      positionName: "שער",
      shiftId: "shift-2",
      startTime: "22:00" as ShiftHours,
      endTime: "06:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };

    // Add assignments to multiple soldiers
    store.addAssignment("soldier1", assignment1);
    store.addAssignment("soldier2", assignment2);
    store.addAssignment("soldier3", assignment1);

    // Verify soldiers have assignments
    expect(store.isAssigned("soldier1")).toBe(true);
    expect(store.isAssigned("soldier2")).toBe(true);
    expect(store.isAssigned("soldier3")).toBe(true);

    // Clear all assignments
    store.clearAllAssignments();

    // Verify all soldiers have no assignments
    expect(store.getAssignments("soldier1")).toEqual([]);
    expect(store.getAssignments("soldier2")).toEqual([]);
    expect(store.getAssignments("soldier3")).toEqual([]);
    expect(store.isAssigned("soldier1")).toBe(false);
    expect(store.isAssigned("soldier2")).toBe(false);
    expect(store.isAssigned("soldier3")).toBe(false);
  });

  test("should handle date-specific assignment filtering", () => {
    const store = useAssignmentsStore();
    
    const assignment1: SoldierAssignment = {
      positionId: "pos-1",
      positionName: "סיור 1",
      shiftId: "shift-1",
      startTime: "14:00" as ShiftHours,
      endTime: "22:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };
    
    const assignment2: SoldierAssignment = {
      positionId: "pos-2",
      positionName: "שער",
      shiftId: "shift-2",
      startTime: "22:00" as ShiftHours,
      endTime: "06:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate2
    };

    // Add assignments for different dates
    store.addAssignment("soldier1", assignment1);
    store.addAssignment("soldier1", assignment2);

    // Should return only assignments for testDate1
    expect(store.getAssignments("soldier1", testDate1)).toEqual([assignment1]);
    expect(store.isAssigned("soldier1", testDate1)).toBe(true);

    // Should return only assignments for testDate2  
    expect(store.getAssignments("soldier1", testDate2)).toEqual([assignment2]);
    expect(store.isAssigned("soldier1", testDate2)).toBe(true);

    // Should return all assignments when no date specified
    expect(store.getAllAssignments("soldier1")).toHaveLength(2);
  });

  test("should clear assignments for specific date only", () => {
    const store = useAssignmentsStore();
    
    const assignment1: SoldierAssignment = {
      positionId: "pos-1",
      positionName: "סיור 1",
      shiftId: "shift-1",
      startTime: "14:00" as ShiftHours,
      endTime: "22:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate1
    };
    
    const assignment2: SoldierAssignment = {
      positionId: "pos-2",
      positionName: "שער",
      shiftId: "shift-2",
      startTime: "22:00" as ShiftHours,
      endTime: "06:00" as ShiftHours,
      assignmentIndex: 0,
      date: testDate2
    };

    // Add assignments for different dates
    store.addAssignment("soldier1", assignment1);
    store.addAssignment("soldier1", assignment2);

    // Clear assignments for testDate1 only
    store.clearAssignmentsForDate(testDate1);

    // Should only have assignment for testDate2
    expect(store.getAssignments("soldier1", testDate1)).toEqual([]);
    expect(store.getAssignments("soldier1", testDate2)).toEqual([assignment2]);
    expect(store.getAllAssignments("soldier1")).toEqual([assignment2]);
  });
}); 