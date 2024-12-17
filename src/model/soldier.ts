import { IPresence } from "./presence";

export interface ISoldier {
  id: string;
  name: string;
  role: string;
  platoon: string;
  presence: Array<IPresence>;
}

export class SoldierModel implements ISoldier {
  id: string;
  name: string;
  role: string;
  platoon: string;
  presence: Array<IPresence> = [];

  constructor(id: string, name: string, role: string, platoon: string) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.platoon = platoon;
  }

  addPresence(presence: IPresence): void {
    this.presence.push(presence);
    this.presence.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
