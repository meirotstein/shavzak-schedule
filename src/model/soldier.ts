export interface ISoldier {
  id: string;
  name: string;
  role: string;
}

export class SoldierModel implements ISoldier {
  id: string;
  name: string;
  role: string;

  constructor(id: string, name: string, role: string) {
    this.id = id;
    this.name = name;
    this.role = role;
  }
}
