import { ShiftHours } from "./shift-hours";

export type SoldierDto = {
  id: string;
  name: string;
  role: string;
  platoon: string;
  description: string;
};
export type AssignmentDefDto = { roles: string[] };
export type ShiftDto = {
  id: string;
  startTime: ShiftHours;
  endTime: ShiftHours;
  assignmentDefs: AssignmentDefDto[];
  soldierIds?: string[];
};
export type PositionDto = { id: string; name: string; shifts: ShiftDto[] };

export type PresenceDto = {
  start?: Date;
  end?: Date;
  soldiersPresence: Record<string /* soldierId */, SoldierPresenceDto>;
};
export type SoldierPresenceDto = {
  presence: Array<{ day: Date; presence: string }>;
};
