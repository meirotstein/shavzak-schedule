import { ShiftHours } from "./shift-hours";

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
export enum PresenceStateDto {
  PRESENT = "present", // 1
  HOME = "home", // 0
  SICK = "sick", // 2
  DISCHARGED = "discharged", // ""
}
export type PresenceDto = {
  start: Date;
  end: Date;
  soldiersPresence: SoldierPresenceDto[];
};
export type SoldierPresenceDto = {
  soldierId: string;
  presence: Array<{ day: Date; presence: PresenceStateDto }>;
};
