import { SchedulerError } from "../errors/scheduler-error";
import { Soldier } from "./soldier";

type ShiftHours = `${0 | 1 | 2}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}:${
  | "00"
  | 15
  | 30
  | 45}`; // e.g. "16:00"
type AssignmentDefinition = { role: string };

export class Shift {
  private _soldiers: Soldier[] = [];

  constructor(
    private _shiftId: string,
    private _startTime: ShiftHours,
    private _endTime: ShiftHours,
    private _assignmentDefs: AssignmentDefinition[]
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

  get assignmentDefinitions(): AssignmentDefinition[] {
    return this._assignmentDefs;
  }

  get soldiers(): Soldier[] {
    return this._soldiers;
  }

  addSoldier(soldier: Soldier, index?: number) {
    if (typeof index === "undefined") {
      index = this._soldiers.length;
    }
    if (index < this.assignmentDefinitions.length) {
      if (this.assignmentDefinitions[index].role !== soldier.role) {
        throw new SchedulerError(
          "Soldier role does not match assignment definition",
          {
            assignmentDefinitions: this.assignmentDefinitions,
            index,
            soldierRole: soldier.role,
          }
        );
      }
      this._soldiers[index] = soldier;
      return;
    }
    throw new SchedulerError("Cannot add more soldiers to this shift", {
      assignmentDefinitions: this.assignmentDefinitions,
      index,
    });
  }
}
