import { ShiftHours } from "./shift-hours";

export type SoldierAssignment = {
  positionId: string;
  positionName: string;
  shiftId: string;
  startTime: ShiftHours;
  endTime: ShiftHours;
  assignmentIndex: number; // which spot in the shift assignments array
} 