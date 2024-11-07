export interface ISoldier {
  id: string;
  name: string;
  role: string;
  platoon: string;
}

export class SoldierModel implements ISoldier {
  id: string;
  name: string;
  role: string;
  platoon: string;

  constructor(id: string, name: string, role: string, platoon: string) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.platoon = platoon;
  }
}
