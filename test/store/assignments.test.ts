import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test } from "vitest";
import { useAssignmentsStore } from "../../src/store/assignments";
import { SoldierAssignment } from "../../src/types/soldier-assignment";
import { ShiftHours } from "../../src/types/shift-hours";

describe("assignments store tests", () => {
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
      assignmentIndex: 0
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
      assignmentIndex: 0
    };
    const assignment2: SoldierAssignment = {
      positionId: "pos-2",
      positionName: "שער",
      shiftId: "shift-2",
      startTime: "22:00" as ShiftHours,
      endTime: "06:00" as ShiftHours,
      assignmentIndex: 1
    };

    store.addAssignment("soldier1", assignment1);
    store.addAssignment("soldier1", assignment2);

    const assignments = store.getAssignments("soldier1");
    expect(assignments).toHaveLength(2);
    expect(assignments).toEqual([assignment1, assignment2]);
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
      assignmentIndex: 0
    };
    const assignment2: SoldierAssignment = {
      positionId: "pos-2",
      positionName: "שער",
      shiftId: "shift-2",
      startTime: "22:00" as ShiftHours,
      endTime: "06:00" as ShiftHours,
      assignmentIndex: 1
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
      assignmentIndex: 0
    };

    store.addAssignment("soldier1", assignment);
    expect(store.isAssigned("soldier1")).toBe(true);

    store.removeAssignment("soldier1", "pos-1", "shift-1");

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
      assignmentIndex: 0
    };
    const assignment2: SoldierAssignment = {
      positionId: "pos-2",
      positionName: "שער",
      shiftId: "shift-2",
      startTime: "22:00" as ShiftHours,
      endTime: "06:00" as ShiftHours,
      assignmentIndex: 1
    };

    store.addAssignment("soldier1", assignment1);
    store.addAssignment("soldier1", assignment2);

    store.removeAssignment("soldier1", "pos-1", "shift-1");

    const assignments = store.getAssignments("soldier1");
    expect(assignments).toHaveLength(1);
    expect(assignments).toEqual([assignment2]);
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
      assignmentIndex: 0
    };

    store.addAssignment("soldier1", assignment);

    // Try to remove a different assignment
    store.removeAssignment("soldier1", "pos-2", "shift-2");

    // Original assignment should still be there
    expect(store.getAssignments("soldier1")).toEqual([assignment]);
    expect(store.isAssigned("soldier1")).toBe(true);
  });

  test("should handle removing assignment from soldier with no assignments", () => {
    const store = useAssignmentsStore();

    // Should not throw error
    store.removeAssignment("soldier1", "pos-1", "shift-1");

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
      assignmentIndex: 0
    };
    const assignment2: SoldierAssignment = {
      positionId: "pos-2",
      positionName: "שער",
      shiftId: "shift-2",
      startTime: "22:00" as ShiftHours,
      endTime: "06:00" as ShiftHours,
      assignmentIndex: 1
    };

    store.addAssignment("soldier1", assignment1);
    store.addAssignment("soldier1", assignment2);
    expect(store.getAssignments("soldier1")).toHaveLength(2);

    store.clearAssignments("soldier1");

    expect(store.getAssignments("soldier1")).toEqual([]);
    expect(store.isAssigned("soldier1")).toBe(false);
  });

  test("should handle clearing assignments for soldier with no assignments", () => {
    const store = useAssignmentsStore();

    // Should not throw error
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
      assignmentIndex: 0
    };

    store.addAssignment("soldier1", assignment);
    const retrieved = store.getAssignments("soldier1")[0];

    expect(retrieved).toEqual(assignment);
    expect(retrieved.positionId).toBe("pos-1");
    expect(retrieved.positionName).toBe("סיור 1");
    expect(retrieved.shiftId).toBe("shift-1");
    expect(retrieved.startTime).toBe("14:00");
    expect(retrieved.endTime).toBe("22:00");
    expect(retrieved.assignmentIndex).toBe(0);
  });

  test("should handle assignment operations for different soldiers independently", () => {
    const store = useAssignmentsStore();
    const assignment1: SoldierAssignment = {
      positionId: "pos-1",
      positionName: "סיור 1",
      shiftId: "shift-1",
      startTime: "14:00" as ShiftHours,
      endTime: "22:00" as ShiftHours,
      assignmentIndex: 0
    };
    const assignment2: SoldierAssignment = {
      positionId: "pos-2",
      positionName: "שער",
      shiftId: "shift-2",
      startTime: "22:00" as ShiftHours,
      endTime: "06:00" as ShiftHours,
      assignmentIndex: 1
    };

    // Add assignments to different soldiers
    store.addAssignment("soldier1", assignment1);
    store.addAssignment("soldier2", assignment2);

    // Clear assignments for soldier1
    store.clearAssignments("soldier1");

    // soldier1 should have no assignments, soldier2 should still have theirs
    expect(store.getAssignments("soldier1")).toEqual([]);
    expect(store.isAssigned("soldier1")).toBe(false);
    expect(store.getAssignments("soldier2")).toEqual([assignment2]);
    expect(store.isAssigned("soldier2")).toBe(true);
  });

  test("should handle complex assignment scenarios", () => {
    const store = useAssignmentsStore();
    
    // Multiple soldiers with multiple assignments
    const assignments: SoldierAssignment[] = [
      {
        positionId: "pos-1",
        positionName: "סיור 1",
        shiftId: "shift-1",
        startTime: "14:00" as ShiftHours,
        endTime: "22:00" as ShiftHours,
        assignmentIndex: 0
      },
      {
        positionId: "pos-2",
        positionName: "שער",
        shiftId: "shift-2",
        startTime: "22:00" as ShiftHours,
        endTime: "06:00" as ShiftHours,
        assignmentIndex: 1
      },
      {
        positionId: "pos-3",
        positionName: "מח״ט",
        shiftId: "shift-3",
        startTime: "06:00" as ShiftHours,
        endTime: "14:00" as ShiftHours,
        assignmentIndex: 2
      }
    ];

    // Add assignments to multiple soldiers
    store.addAssignment("soldier1", assignments[0]);
    store.addAssignment("soldier1", assignments[1]);
    store.addAssignment("soldier2", assignments[2]);

    // Verify initial state
    expect(store.getAssignments("soldier1")).toHaveLength(2);
    expect(store.getAssignments("soldier2")).toHaveLength(1);
    expect(store.isAssigned("soldier1")).toBe(true);
    expect(store.isAssigned("soldier2")).toBe(true);

    // Remove one assignment from soldier1
    store.removeAssignment("soldier1", "pos-1", "shift-1");
    
    expect(store.getAssignments("soldier1")).toHaveLength(1);
    expect(store.getAssignments("soldier1")).toEqual([assignments[1]]);
    expect(store.isAssigned("soldier1")).toBe(true);

    // Clear all assignments from soldier2
    store.clearAssignments("soldier2");
    
    expect(store.getAssignments("soldier2")).toEqual([]);
    expect(store.isAssigned("soldier2")).toBe(false);
  });
}); 