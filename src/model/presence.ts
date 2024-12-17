
export interface IPresence {
  date: Date;
  presence: PresenceState;
}

export class PresenceModel implements IPresence {
  date: Date;
  presence: PresenceState;

  constructor(date: Date, presenceValue: string) {
    this.date = date;

    switch (presenceValue) {
      case "1":
        this.presence = PresenceState.PRESENT;
        break;
      case "0":
        this.presence = PresenceState.HOME;
        break;
      case "2":
        this.presence = PresenceState.SICK;
        break;
      default:
        this.presence = PresenceState.DISCHARGED;
        break;
    }
  }
}

export enum PresenceState {
  PRESENT = "present", // 1
  HOME = "home", // 0
  SICK = "sick", // 2
  DISCHARGED = "discharged", // ""
}
