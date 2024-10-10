import { PositionDto, SoldierDto } from "./dto";

export class GAPIClient {
  constructor() {}

  async getSoldiers(): Promise<SoldierDto[]> {
    return Promise.resolve([
      { id: "123", name: "משה אופניק", role: "קצין" },
      { id: "456", name: "בוב ספוג", role: "לוחם" },
      { id: "789", name: "ג'ורג קונסטנזה", role: "לוחם" },
    ]);
  }

  async getPositions(): Promise<PositionDto[]> {
    return Promise.resolve([
      {
        id: "1",
        name: "ש.ג.",
        shifts: [
          {
            id: "1",
            startTime: "00:00",
            endTime: "02:00",
            assignmentDefs: [{ roles: ["קצין", "לוחם"] }, { roles: ["לוחם"] }],
            // soldierIds: ['123', '456']
          },
          {
            id: "2",
            startTime: "13:00",
            endTime: "15:00",
            assignmentDefs: [{ roles: ["קצין", "לוחם"] }, { roles: ["לוחם"] }],
            // soldierIds: ['123', '456']
          },
        ],
      },
      {
        id: "2",
        name: "סיור",
        shifts: [
          {
            id: "1",
            startTime: "00:00",
            endTime: "04:00",
            assignmentDefs: [{ roles: ["קצין"] }],
            // soldierIds: ['123', '789']
          },
          {
            id: "2",
            startTime: "04:00",
            endTime: "08:00",
            assignmentDefs: [{ roles: ["לוחם"] }],
            // soldierIds: ['123', '789']
          },
          {
            id: "3",
            startTime: "08:00",
            endTime: "12:00",
            assignmentDefs: [{ roles: ["לוחם"] }],
            // soldierIds: ['123', '789']
          },
          {
            id: "4",
            startTime: "16:00",
            endTime: "20:00",
            assignmentDefs: [{ roles: ["לוחם"] }],
            // soldierIds: ['123', '789']
          },
          {
            id: "5",
            startTime: "20:00",
            endTime: "00:00",
            assignmentDefs: [{ roles: ["לוחם"] }],
            // soldierIds: ['123', '789']
          },
        ],
      },
    ]);
  }
}
