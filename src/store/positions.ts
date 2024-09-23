import { defineStore } from "pinia";
import { ref } from "vue";
import { GAPIClient } from "../clients/gapi-client";
import { SchedulerError } from "../errors/scheduler-error";
import { IPosition, PositionModel } from "../model/position";
import { ShiftModel } from "../model/shift";
import { useSoldiersStore } from "./soldiers";
import { ShiftHours } from "../types/shift-hours";
import { ShiftDto } from "../clients/dto";

const dayStart: ShiftHours = "14:00"; // TODO: fetch from config store

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
  const soldiers = useSoldiersStore();
  const positions = ref<IPosition[]>([]);

  async function fetchPositions() {
    const gapi = new GAPIClient();
    const positionsData = await gapi.getPositions();

    const dayStartMinutes = timeToMinutes(dayStart);
    const compareFn = shiftsByStartTimeCompare.bind({}, dayStartMinutes);

    positionsData.forEach((positionData) => {
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
      positions.value.push(position);
    });
  }

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
    const soldier = soldiers.findSoldierById(soldierId);
    if (!soldier) {
      throw new SchedulerError(`Soldier with id ${soldierId} not found`);
    }
    shift.addSoldier(soldier, shiftSpotIndex);
  }

  return { positions, fetchPositions, assignSoldiersToShift };
});
