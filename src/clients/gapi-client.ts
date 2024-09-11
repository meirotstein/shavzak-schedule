import { SoldierDto } from "./dto";

export class GAPIClient {
  constructor() {}

  async getSoldiers(): Promise<SoldierDto[]> {
    return Promise.resolve([
      { id: '123', name: "משה אופניק", role: "קצין" },
      { id: '456', name: "בוב ספוג", role: "לוחם" },
      { id: '789', name: "ג'ורג קונסטנזה", role: "לוחם" },
    ]);
  }
}
