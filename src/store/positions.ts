import { defineStore } from "pinia";
import { computed, reactive, watch } from "vue";
import { dayStart } from "../app-config";
import { SchedulerError } from "../errors/scheduler-error";
import { PositionModel } from "../model/position";
import { ShiftModel } from "../model/shift";
import { ShiftDto } from "../types/client-dto";
import { ShiftHours } from "../types/shift-hours";
import { useAssignmentsStore } from "./assignments";
import { useGAPIStore } from "./gapi";
import { useSoldiersStore } from "./soldiers";

const timeToMinutes = (time: ShiftHours): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const shiftsByStartTimeCompare = (
  dayStartMinutes: number,
  a: ShiftDto,
  b: ShiftDto
) => {
  // Convert startTime into minutes relative to the dayStart
  const timeA = (timeToMinutes(a.startTime) - dayStartMinutes + 1440) % 1440;
  const timeB = (timeToMinutes(b.startTime) - dayStartMinutes + 1440) % 1440;

  return timeA - timeB;
};

export const usePositionsStore = defineStore("positions", () => {
  const gapi = useGAPIStore();
  const soldiersStore = useSoldiersStore();
  const assignmentsStore = useAssignmentsStore();

  const positions = computed(() => {
    const dayStartMinutes = timeToMinutes(dayStart);
    const compareFn = shiftsByStartTimeCompare.bind({}, dayStartMinutes);
    return gapi.positions.map((positionData) => {
      const position = reactive(
        new PositionModel(positionData.id, positionData.name)
      );
      positionData.shifts.sort(compareFn).forEach((shiftData) => {
        const shift = reactive(
          new ShiftModel(
            shiftData.id,
            shiftData.startTime,
            shiftData.endTime,
            shiftData.assignmentDefs
          )
        );
        shiftData.soldierIds?.forEach((soldierId) => {
          const soldier = soldiersStore.findSoldierById(soldierId);
          if (!soldier) {
            throw new SchedulerError(`Soldier with id ${soldierId} not found`);
          }
          shift.addSoldier(soldier);
        });
        position.shifts.push(shift);
      });
      return position;
    });
  });

  // Watch for changes in gapi.positions to initialize soldier assignments
  watch(
    () => ({ positions: gapi.positions, soldiers: gapi.soldiers }),
    ({ positions: newPositions, soldiers: newSoldiers }) => {
      if (newPositions.length > 0 && newSoldiers && newSoldiers.length > 0) {
        // Clear and repopulate soldier assignments in the assignments store
        const processedSoldiers = new Set<string>();
        
        positions.value.forEach(position => {
          position.shifts.forEach(shift => {
            shift.assignments.forEach((assignment, index) => {
              if (assignment.soldier) {
                // Clear assignments only once per soldier
                if (!processedSoldiers.has(assignment.soldier.id)) {
                  assignmentsStore.clearAssignments(assignment.soldier.id);
                  processedSoldiers.add(assignment.soldier.id);
                }
                
                assignmentsStore.addAssignment(assignment.soldier.id, {
                  positionId: position.positionId,
                  positionName: position.positionName,
                  shiftId: shift.shiftId,
                  startTime: shift.startTime,
                  endTime: shift.endTime,
                  assignmentIndex: index
                });
              }
            });
          });
        });
      }
    },
    { immediate: true }
  );

  function assignSoldiersToShift(
    positionId: string,
    shiftsId: string,
    shiftSpotIndex: number,
    soldierId: string
  ) {
    const position = positions.value.find(
      (position) => position.positionId === positionId
    );
    if (!position) {
      throw new SchedulerError(`Position with id ${positionId} not found`);
    }
    const shift = position.shifts.find((shift) => shift.shiftId === shiftsId);
    if (!shift) {
      throw new SchedulerError(
        `Shift with id ${shiftsId} not found in position with id ${positionId}`
      );
    }
    const soldier = soldiersStore.findSoldierById(soldierId);
    if (!soldier) {
      throw new SchedulerError(`Soldier with id ${soldierId} not found`);
    }
    
    // Add to shift
    shift.addSoldier(soldier, shiftSpotIndex);
    
    // Add assignment to assignments store
    assignmentsStore.addAssignment(soldierId, {
      positionId,
      positionName: position.positionName,
      shiftId: shiftsId,
      startTime: shift.startTime,
      endTime: shift.endTime,
      assignmentIndex: shiftSpotIndex
    });
  }

  function removeSoldierFromShift(
    positionId: string,
    shiftId: string,
    shiftSpotIndex: number
  ) {
    const position = positions.value.find(
      (position) => position.positionId === positionId
    );
    if (!position) {
      throw new SchedulerError(`Position with id ${positionId} not found`);
    }
    const shift = position.shifts.find((shift) => shift.shiftId === shiftId);
    if (!shift) {
      throw new SchedulerError(
        `Shift with id ${shiftId} not found in position with id ${positionId}`
      );
    }
    
    // Get soldier before removing
    const soldier = shift.assignments[shiftSpotIndex].soldier;
    
    // Remove from shift
    shift.removeSoldier(shiftSpotIndex);
    
    // Remove assignment from assignments store
    if (soldier) {
      assignmentsStore.removeAssignment(soldier.id, positionId, shiftId);
    }
  }

  return { positions, assignSoldiersToShift, removeSoldierFromShift };
});
