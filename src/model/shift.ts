import { SchedulerError } from "../errors/scheduler-error";
import { ShiftHours } from "../types/shift-hours";
import { ISoldier } from "./soldier";

export type AssignmentDef = { roles: string[]; soldier?: ISoldier };
export type Assignment = AssignmentDef & { soldier?: ISoldier };

export interface IShift {
  shiftId: string;
  startTime: ShiftHours;
  endTime: ShiftHours;
  assignments: Assignment[];
  addSoldier(soldier: ISoldier, index?: number): void;
  removeSoldier(index: number): void;
}

export class ShiftModel implements IShift {
  private _assignments: Assignment[];

  constructor(
    private _shiftId: string,
    private _startTime: ShiftHours,
    private _endTime: ShiftHours,
    // no assignment definitions means that the time slot is not required
    _assignmentDefs: AssignmentDef[]
  ) {
    this._assignments = _assignmentDefs.map((assignmentDef) => {
      return { ...assignmentDef };
    });
  }

  get shiftId(): string {
    return this._shiftId;
  }

  get startTime(): ShiftHours {
    return this._startTime;
  }

  get endTime(): ShiftHours {
    return this._endTime;
  }

  get assignments(): Assignment[] {
    return this._assignments;
  }

  get isAssignable(): boolean {
    return !!this._assignments.length;
  }

  addSoldier(soldier: ISoldier, index?: number): void {
    if (typeof index === "undefined") {
      index = this.assignments.findIndex((assignment) => !assignment.soldier);
    }
    if (index !== -1 && index < this.assignments.length) {
      // if (!this.assignmentDefinitions[index].roles.includes(soldier.role)) {
      //   throw new SchedulerError(
      //     "Soldier role does not match assignment definition",
      //     {
      //       assignmentDefinitions: this.assignmentDefinitions,
      //       index,
      //       soldierRole: soldier.role,
      //     }
      //   );
      // }
      this.assignments[index].soldier = soldier;
      return;
    }
    throw new SchedulerError(
      `Cannot add more soldiers to this shift ${this.shiftId} ${index} ${this.assignments.length}`,
      {
        assignments: this.assignments,
        index,
      }
    );
  }

  removeSoldier(index: number): void {
    if (index < 0 || index >= this.assignments.length) {
      throw new SchedulerError(
        `Invalid index ${index} for removing soldier from shift ${this.shiftId}`,
        {
          assignments: this.assignments,
          index,
        }
      );
    }
    this.assignments[index].soldier = undefined;
  }
}

export class UnAssignableShift extends ShiftModel {
  constructor(_shiftId: string, _startTime: ShiftHours, _endTime: ShiftHours) {
    super(_shiftId, _startTime, _endTime, []);
  }

  addSoldier(): void {
    throw new SchedulerError("Cannot add soldier to unassignable shift");
  }

  removeSoldier(index: number): void {
    throw new SchedulerError("Cannot remove soldier from unassignable shift");
  }
}
