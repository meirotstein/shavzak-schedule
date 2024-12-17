import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useScheduleStore } from "../../src/store/schedule";
import { PresenceDto } from "../../src/types/client-dto";

let presenceMock: PresenceDto;
vi.mock("../../src/store/gapi", () => {
  return {
    useGAPIStore: () => {
      return {
        presence: presenceMock,
      };
    },
  };
});

let mockClosetDate = new Date("2020-12-15T00:00:00Z");
vi.mock("../../src/utils/date-utils", () => {
  return {
    getClosestDate: (date: Date) => mockClosetDate,
  };
});

describe("schedule store tests", () => {
  describe("schedule date", () => {
    beforeEach(() => {
      setActivePinia(createPinia());
      presenceMock = undefined as any;
      vi.resetAllMocks();
    });

    test("expect to have no date when interval is not loaded", async () => {
      const store = useScheduleStore();

      expect(store.scheduleDate).toBeUndefined();
    });

    test("expect to have closet date when interval is given", async () => {
      presenceMock = {
        start: new Date("2020-12-15T00:00:00Z"),
        end: new Date("2021-02-10T00:00:00Z"),
        soldiersPresence: {},
      };

      const store = useScheduleStore();

      expect(store.scheduleDate).toStrictEqual(mockClosetDate);
    });

    test("expect to have updated date when it is explicitly set", async () => {
      presenceMock = {
        start: new Date("2020-12-15T00:00:00Z"),
        end: new Date("2021-02-10T00:00:00Z"),
        soldiersPresence: {},
      };

      const store = useScheduleStore();
      const newDate = new Date("2020-12-16T00:00:00Z");
      store.setScheduleDate(newDate);

      expect(store.scheduleDate).toStrictEqual(newDate);
    });
  });
});
