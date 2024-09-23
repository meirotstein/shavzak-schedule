import { SchedulerError } from "../errors/scheduler-error";
import { ShiftHours } from "../types/shift-hours";
import { ISoldier } from "./soldier";

type AssignmentDefinition = { roles: string[] };

export interface IShift {
  shiftId: string;
  startTime: ShiftHours;
  endTime: ShiftHours;
  assignmentDefinitions: AssignmentDefinition[];
  soldiers: ISoldier[];
  addSoldier(soldier: ISoldier, index?: number): void;
}

export class ShiftModel implements IShift {
  private _soldiers: ISoldier[] = [];

  constructor(
    private _shiftId: string,
    private _startTime: ShiftHours,
    private _endTime: ShiftHours,
    private _assignmentDefs: AssignmentDefinition[] // assignment definitions indexed by soldier index, // no assignment definition means that the time slot is not required
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

  get soldiers(): ISoldier[] {
    return this._soldiers;
  }

  get isAssignable(): boolean {
    return !!this._assignmentDefs.length;
  }

  addSoldier(soldier: ISoldier, index?: number): void {
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

export class UnAssignableShift extends ShiftModel {
  constructor(_shiftId: string, _startTime: ShiftHours, _endTime: ShiftHours) {
    super(_shiftId, _startTime, _endTime, []);
  }

  addSoldier(soldier: ISoldier, index?: number): void {
    throw new SchedulerError("Cannot add soldier to unassignable shift");
  }
}
