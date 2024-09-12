import { PositionDto, SoldierDto } from "./dto";

export class GAPIClient {
  constructor() {}

  async getSoldiers(): Promise<SoldierDto[]> {
    return Promise.resolve([
      { id: '123', name: "משה אופניק", role: "קצין" },
      { id: '456', name: "בוב ספוג", role: "לוחם" },
      { id: '789', name: "ג'ורג קונסטנזה", role: "לוחם" },
    ]);
  }

  async getPositions(): Promise<PositionDto[]> {
    return Promise.resolve([
      {
        id: '1',
        name: "shin-gimel",
        shifts: [
          {
            id: '1',
            startTime: "00:00",
            endTime: "02:00",
            assignmentDefs: [{ roles: ["קצין", "לוחם"] }],
            // soldierIds: ['123', '456']
          }
        ]
      },
      {
        id: '2',
        name: "patrol",
        shifts: [
          {
            id: '1',
            startTime: "00:00",
            endTime: "02:00",
            assignmentDefs: [{ roles: ["קצין"] }],
            // soldierIds: ['123', '789']
          },
          {
            id: '2',
            startTime: "02:00",
            endTime: "04:00",
            assignmentDefs: [{ roles: ["לוחם"] }],
            // soldierIds: ['123', '789']
          }
        ]
      }
    ])
  }
}
