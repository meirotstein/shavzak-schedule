import { ShiftHours } from "../types/shift-hours";

export type SoldierDto = { id: string; name: string; role: string };
export type AssignmentDefDto = { roles: string[] };
export type ShiftDto = {
  id: string;
  startTime: ShiftHours;
  endTime: ShiftHours;
  assignmentDefs: AssignmentDefDto[];
  soldierIds?: string[];
};
export type PositionDto = { id: string; name: string; shifts: ShiftDto[] };
