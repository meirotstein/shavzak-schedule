import { SoldierDto } from "./dto";

export class GAPIClient {
  constructor() {}

  async getSoldiers(): Promise<SoldierDto[]> {
    return Promise.resolve([
      { name: "משה אופניק", role: "קצין" },
      { name: "בוב ספוג", role: "לוחם" },
      { name: "ג'ורג קונסטנזה", role: "לוחם" },
    ]);
  }
}
