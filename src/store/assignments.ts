import { defineStore } from "pinia";
import { reactive } from "vue";
import { SoldierAssignment } from "../types/soldier-assignment";

export const useAssignmentsStore = defineStore("assignments", () => {
  // Map of soldier ID to their assignments
  const soldierAssignments = reactive<Map<string, SoldierAssignment[]>>(new Map());

  function addAssignment(soldierId: string, assignment: SoldierAssignment) {
    if (!soldierAssignments.has(soldierId)) {
      soldierAssignments.set(soldierId, []);
    }
    soldierAssignments.get(soldierId)!.push(assignment);
  }

  function removeAssignment(soldierId: string, positionId: string, shiftId: string) {
    const assignments = soldierAssignments.get(soldierId);
    if (assignments) {
      const index = assignments.findIndex(
        a => a.positionId === positionId && a.shiftId === shiftId
      );
      if (index !== -1) {
        assignments.splice(index, 1);
      }
    }
  }

  function getAssignments(soldierId: string): SoldierAssignment[] {
    return soldierAssignments.get(soldierId) || [];
  }

  function clearAssignments(soldierId: string) {
    soldierAssignments.set(soldierId, []);
  }

  function isAssigned(soldierId: string): boolean {
    return getAssignments(soldierId).length > 0;
  }

  return {
    addAssignment,
    removeAssignment,
    getAssignments,
    clearAssignments,
    isAssigned
  };
}); 