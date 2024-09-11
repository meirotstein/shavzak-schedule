import { SchedulerError } from "../errors/scheduler-error";
import { Soldier } from "./soldier";

type ShiftHours = `${0|1|2}${0|1|2|3|4|5|6|7|8|9}:${'00'|15|30|45}`;  // e.g. "16:00"

export class Shift {
  private _soldiers: Soldier[] = [];

  constructor(
    private _shiftId: string,
    private _startTime: ShiftHours,
    private _endTime: ShiftHours,
    private _numOfSoldiers: number
  ) {}

  get shiftId(): string {
    return this._shiftId;
  }

  get startTime(): ShiftHours {
    return this._startTime;
  }

  get endTime(): ShiftHours {
    return this._endTime;
  }

  get numOfSoldiers(): number {
    return this._numOfSoldiers;
  }

  get soldiers(): Soldier[] {
    return this._soldiers;
  }

  addSoldier(soldier: Soldier, index?: number) {
    if (typeof index === 'undefined' && this._soldiers.length < this.numOfSoldiers) {
      this._soldiers.push(soldier);
      return;
    }
    if (typeof index === 'number' && index < this.numOfSoldiers) {
      this._soldiers[index] = soldier;
      return;
    }
    throw new SchedulerError("Cannot add more soldiers to this shift", {
      numOfSoldiers: this.numOfSoldiers,
      index,
    });
  }
}
