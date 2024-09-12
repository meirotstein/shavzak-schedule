import { defineStore } from "pinia";
import { ref } from "vue";
import { GAPIClient } from "../clients/gapi-client";
import { SoldierModel } from "../model/soldier";
import { PositionModel } from "../model/position";
import { ShiftModel } from "../model/shift";
import { useSoldiersStore } from "./soldiers";
import { SchedulerError } from "../errors/scheduler-error";

export const usePositionsStore = defineStore("positions", () => {
  const soldiers = useSoldiersStore();
  const positions = ref<PositionModel[]>([]);

  async function fetchPositions() {
    const gapi = new GAPIClient();
    const positionsData = await gapi.getPositions();
    positionsData.forEach((positionData) => {
      const position = new PositionModel(positionData.id, positionData.name);
      positionData.shifts.forEach((shiftData) =>
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

  function assignSoldiersToShift(positionId: string, shiftsId: string, shiftSpotIndex: number, soldierId: string) {
    const position = positions.value.find((position) => position.positionId === positionId);
    if (!position) {
      throw new SchedulerError(`Position with id ${positionId} not found`);
    }
    const shift = position.shifts.find((shift) => shift.shiftId === shiftsId);
    if (!shift) {
      throw new SchedulerError(`Shift with id ${shiftsId} not found in position with id ${positionId}`);
    }
    const soldier = soldiers.findSoldierById(soldierId);
    if (!soldier) {
      throw new SchedulerError(`Soldier with id ${soldierId} not found`);
    }
    shift.addSoldier(soldier, shiftSpotIndex);
  }

  return { positions, fetchPositions, assignSoldiersToShift };
});
