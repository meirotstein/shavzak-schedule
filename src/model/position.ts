import { SchedulerError } from "../errors/scheduler-error";
import { ShiftModel } from "./shift";

export class PositionModel {
  private _shifts: ShiftModel[] = [];

  constructor(private _positionId: string, private _positionName: string) {}

  addShift(shift: ShiftModel) {
    this.validateShifts([...this._shifts, shift]);
    this._shifts.push(shift);
  }

  private validateShifts(shifts: ShiftModel[]) {
    const shiftIds = shifts.map((shift) => shift.shiftId);
    const dailyValidation: Array<boolean> = new Array(96).fill(false);
    const uniqueShiftIds = new Set(shiftIds);
    if (shiftIds.length !== uniqueShiftIds.size) {
      throw new SchedulerError("Shift ids must be unique", { shiftIds });
    }
    shifts.forEach((shift) => {
      const shiftStart = parseInt(shift.startTime.split(":")[0]);
      const shiftEnd = parseInt(shift.endTime.split(":")[0]);
      const shiftStartMinutes = parseInt(shift.startTime.split(":")[1]);
      const shiftEndMinutes = parseInt(shift.endTime.split(":")[1]);

      const shiftIndex = shiftStart * 4 + shiftStartMinutes / 15;
      // last shift will probably end at midnight, so we need to handle that (section 92-96 on the validation array)
      const shiftEndIndex =
        (shiftEnd > 0 ? shiftEnd * 4 : 92) + shiftEndMinutes / 15;
      if (shiftIndex >= shiftEndIndex) {
        throw new SchedulerError("Shift must be at least 15 minutes long", {
          shiftId: shift.shiftId,
          startTime: shift.startTime,
          endTime: shift.endTime,
        });
      }

      for (let i = shiftIndex; i < shiftEndIndex; i++) {
        if (dailyValidation[i]) {
          throw new SchedulerError("Shifts cannot overlap", {
            shiftId: shift.shiftId,
            startTime: shift.startTime,
            endTime: shift.endTime,
          });
        }
        dailyValidation[i] = true;
      }
    });
  }

  get positionId(): string {
    return this._positionId;
  }

  get positionName(): string {
    return this._positionName;
  }

  get shifts(): ShiftModel[] {
    return this._shifts;
  }
}
