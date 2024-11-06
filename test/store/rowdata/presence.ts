import { parse } from "date-fns";

export const presenceRaw = [
  ["התחלה", "2024-10-27", "4", "14", "15", "73", "73", "2", "2", "74", "75"],
  ["סיום", "2024-12-31", "8", "21", "22", "82", "82", "82", "82", "85", "85"],
  ["", "בחופש", "0", "0", "0", "1", "1", "80", "80", "3", "0"],
  ["", "נהג", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
  ["", "סמבצ", "0", "0", "0", "5", "5", "1", "1", "5", "5"],
  ["", "מפקד", "0", "7", "8", "8", "8", "0", "0", "8", "9"],
  ["", "חובש", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
  ["", "לוחם", "4", "3", "3", "56", "56", "1", "1", "57", "57"],
  ["", "קצין", "0", "4", "4", "4", "4", "0", "0", "4", "4"],
  ["", "סהכ", "8", "21", "22", "81", "81", "2", "2", "81", "84"],
  ["יממ", "", "א", "ב", "ג", "ד", "ה", "ו", "ש", "א", "ב"],
  [
    "3408",
    "",
    "10/27",
    "10/28",
    "10/29",
    "10/30",
    "10/31",
    "11/1",
    "11/2",
    "11/3",
    "11/4",
  ],
  ["42", "משה אופניק [לוחם] 1", "", "", "", "1", "1", "0", "0", "2", "2"],
  ["42", "בוב ספוג [לוחם] 2", "", "", "", "1", "1", "0", "0", "1", "1"],
  ["42", "ג׳ורג קוסטנזה [סמבצ] מפלג", "", "", "", "1", "1", "0", "0", "1", "1"],
];

export const presenceDto = [
  {
    presence: [
      {
        day: parse("2024-10-27", "yyyy-MM-dd", new Date()),
        presence: "discharged",
      },
      {
        day: parse("2024-10-28", "yyyy-MM-dd", new Date()),
        presence: "discharged",
      },
      {
        day: parse("2024-10-29", "yyyy-MM-dd", new Date()),
        presence: "discharged",
      },
      {
        day: parse("2024-10-30", "yyyy-MM-dd", new Date()),
        presence: "present",
      },
      {
        day: parse("2024-10-31", "yyyy-MM-dd", new Date()),
        presence: "present",
      },
      {
        day: parse("2024-11-01", "yyyy-MM-dd", new Date()),
        presence: "home",
      },
      {
        day: parse("2024-11-02", "yyyy-MM-dd", new Date()),
        presence: "home",
      },
      {
        day: parse("2024-11-03", "yyyy-MM-dd", new Date()),
        presence: "sick",
      },
      {
        day: parse("2024-11-04", "yyyy-MM-dd", new Date()),
        presence: "sick",
      },
    ],
    soldierId: "123",
  },
  {
    presence: [
      {
        day: parse("2024-10-27", "yyyy-MM-dd", new Date()),
        presence: "discharged",
      },
      {
        day: parse("2024-10-28", "yyyy-MM-dd", new Date()),
        presence: "discharged",
      },
      {
        day: parse("2024-10-29", "yyyy-MM-dd", new Date()),
        presence: "discharged",
      },
      {
        day: parse("2024-10-30", "yyyy-MM-dd", new Date()),
        presence: "present",
      },
      {
        day: parse("2024-10-31", "yyyy-MM-dd", new Date()),
        presence: "present",
      },
      {
        day: parse("2024-11-01", "yyyy-MM-dd", new Date()),
        presence: "home",
      },
      {
        day: parse("2024-11-02", "yyyy-MM-dd", new Date()),
        presence: "home",
      },
      {
        day: parse("2024-11-03", "yyyy-MM-dd", new Date()),
        presence: "present",
      },
      {
        day: parse("2024-11-04", "yyyy-MM-dd", new Date()),
        presence: "present",
      },
    ],
    soldierId: "456",
  },
  {
    presence: [
      {
        day: parse("2024-10-27", "yyyy-MM-dd", new Date()),
        presence: "discharged",
      },
      {
        day: parse("2024-10-28", "yyyy-MM-dd", new Date()),
        presence: "discharged",
      },
      {
        day: parse("2024-10-29", "yyyy-MM-dd", new Date()),
        presence: "discharged",
      },
      {
        day: parse("2024-10-30", "yyyy-MM-dd", new Date()),
        presence: "present",
      },
      {
        day: parse("2024-10-31", "yyyy-MM-dd", new Date()),
        presence: "present",
      },
      {
        day: parse("2024-11-01", "yyyy-MM-dd", new Date()),
        presence: "home",
      },
      {
        day: parse("2024-11-02", "yyyy-MM-dd", new Date()),
        presence: "home",
      },
      {
        day: parse("2024-11-03", "yyyy-MM-dd", new Date()),
        presence: "present",
      },
      {
        day: parse("2024-11-04", "yyyy-MM-dd", new Date()),
        presence: "present",
      },
    ],
    soldierId: "789",
  },
];
