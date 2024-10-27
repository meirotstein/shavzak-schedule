import { defineStore } from "pinia";
import { computed } from "vue";
import { dayStart } from "../app-config";
import { SchedulerError } from "../errors/scheduler-error";
import { PositionModel } from "../model/position";
import { ShiftModel } from "../model/shift";
import { ShiftDto } from "../types/client-dto";
import { ShiftHours } from "../types/shift-hours";
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

  const positions = computed(() => {
    const dayStartMinutes = timeToMinutes(dayStart);
    const compareFn = shiftsByStartTimeCompare.bind({}, dayStartMinutes);
    return gapi.positions.map((positionData) => {
      const position = new PositionModel(positionData.id, positionData.name);
      positionData.shifts.sort(compareFn).forEach(
        (shiftData) =>
          position.shifts.push(
            new ShiftModel(
              shiftData.id,
              shiftData.startTime,
              shiftData.endTime,
              shiftData.assignmentDefs
            )
          )
        // TODO: add soldiers - fetch from soldiers store
      );
      return position;
    });
  });

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
    shift.addSoldier(soldier, shiftSpotIndex);
  }

  return { positions, assignSoldiersToShift };
});
