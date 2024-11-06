import { parse } from "date-fns";

export const positionsRaw = [
  ["עמדה", "סיור", "", "עמדה", "ש.ג."],
  ["תפקיד", "מפקד", "קצין", "תפקיד", "לוחם"],
  ["תפקיד", "לוחם", "", "תפקיד", "לוחם"],
  ["תפקיד", "לוחם", "", "משמרת", "14:00", "18:00"],
  ["תפקיד", "לוחם", "", "משמרת", "18:00", "22:00"],
  ["משמרת", "14:00", "22:00", "משמרת", "22:00", "2:00"],
  ["משמרת", "22:00", "6:00", "משמרת", "2:00", "6:00"],
  ["תפקיד", "קצין", "", "משמרת", "6:00", "10:00"],
  ["תפקיד", "לוחם", "", "משמרת", "10:00", "14:00"],
  ["משמרת", "6:00", "14:00", "שיבוץ", "6097455"],
  ["שיבוץ", "8155316", "", "שיבוץ", "8689463"],
  ["שיבוץ", "7233957"],
];

export const positionsDto = [
  {
    id: "pos-0",
    name: "סיור",
    shifts: [
      {
        assignmentDefs: [
          {
            roles: ["מפקד", "קצין"],
          },
          {
            roles: ["לוחם"],
          },
          {
            roles: ["לוחם"],
          },
          {
            roles: ["לוחם"],
          },
        ],
        endTime: "22:00",
        id: "pos-0-shift-4",
        soldierIds: ["8155316", "7233957"],
        startTime: "14:00",
      },
      {
        assignmentDefs: [
          {
            roles: ["קצין"],
          },
          {
            roles: ["לוחם"],
          },
        ],
        endTime: "6:00",
        id: "pos-0-shift-5",
        soldierIds: [],
        startTime: "22:00",
      },
      {
        assignmentDefs: [
          {
            roles: ["מפקד", "קצין"],
          },
          {
            roles: ["לוחם"],
          },
          {
            roles: ["לוחם"],
          },
          {
            roles: ["לוחם"],
          },
        ],
        endTime: "14:00",
        id: "pos-0-shift-8",
        soldierIds: [],
        startTime: "6:00",
      },
    ],
  },
  {
    id: "pos-3",
    name: "ש.ג.",
    shifts: [
      {
        assignmentDefs: [
          {
            roles: ["לוחם"],
          },
          {
            roles: ["לוחם"],
          },
        ],
        endTime: "18:00",
        id: "pos-3-shift-2",
        soldierIds: ["6097455", "8689463"],
        startTime: "14:00",
      },
      {
        assignmentDefs: [
          {
            roles: ["לוחם"],
          },
          {
            roles: ["לוחם"],
          },
        ],
        endTime: "22:00",
        id: "pos-3-shift-3",
        soldierIds: [],
        startTime: "18:00",
      },
      {
        assignmentDefs: [
          {
            roles: ["לוחם"],
          },
          {
            roles: ["לוחם"],
          },
        ],
        endTime: "2:00",
        id: "pos-3-shift-4",
        soldierIds: [],
        startTime: "22:00",
      },
      {
        assignmentDefs: [
          {
            roles: ["לוחם"],
          },
          {
            roles: ["לוחם"],
          },
        ],
        endTime: "6:00",
        id: "pos-3-shift-5",
        soldierIds: [],
        startTime: "2:00",
      },
      {
        assignmentDefs: [
          {
            roles: ["לוחם"],
          },
          {
            roles: ["לוחם"],
          },
        ],
        endTime: "10:00",
        id: "pos-3-shift-6",
        soldierIds: [],
        startTime: "6:00",
      },
      {
        assignmentDefs: [
          {
            roles: ["לוחם"],
          },
          {
            roles: ["לוחם"],
          },
        ],
        endTime: "14:00",
        id: "pos-3-shift-7",
        soldierIds: [],
        startTime: "10:00",
      },
    ],
  },
];
