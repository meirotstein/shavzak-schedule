import { SchedulerError } from "../errors/scheduler-error";
import { ShiftHours } from "../types/shift-hours";
import { SoldierModel } from "./soldier";

type AssignmentDefinition = { roles: string[] };

export class ShiftModel {
  private _soldiers: SoldierModel[] = [];

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

  get soldiers(): SoldierModel[] {
    return this._soldiers;
  }

  addSoldier(soldier: SoldierModel, index?: number) {
    if (typeof index === "undefined") {
      index = this._soldiers.length;
    }
    if (index < this.assignmentDefinitions.length) {
      if (!this.assignmentDefinitions[index].roles.includes(soldier.role)) {
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
