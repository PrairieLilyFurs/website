import { describe, it, expect, beforeEach } from "vitest";
import {
  CURRENT,
  FUTURE,
  PAST,
  getTemporal,
  compareEvents,
  processEvents,
  type Temporal,
  type ProcessedEvent,
} from "./events";

describe("Events Constants", () => {
  it("should have correct constant values", () => {
    expect(CURRENT).toBe(0);
    expect(FUTURE).toBe(1);
    expect(PAST).toBe(2);
  });
});

describe("getTemporal", () => {
  let today: Date;

  beforeEach(() => {
    // Use a fixed date for consistent testing
    today = new Date("2024-01-15T00:00:00.000Z");
  });

  it("should return PAST for dates before today", () => {
    const pastDate = new Date("2024-01-14T23:59:59.999Z");
    expect(getTemporal(pastDate, today)).toBe(PAST);
  });

  it("should return PAST for dates well before today", () => {
    const pastDate = new Date("2024-01-10T12:00:00.000Z");
    expect(getTemporal(pastDate, today)).toBe(PAST);
  });

  it("should return CURRENT for today", () => {
    const todayDate = new Date("2024-01-15T12:00:00.000Z");
    expect(getTemporal(todayDate, today)).toBe(CURRENT);
  });

  it("should return CURRENT for today at start of day", () => {
    const todayDate = new Date("2024-01-15T00:00:00.000Z");
    expect(getTemporal(todayDate, today)).toBe(CURRENT);
  });

  it("should return CURRENT for today at end of day", () => {
    const todayDate = new Date("2024-01-15T23:59:59.999Z");
    expect(getTemporal(todayDate, today)).toBe(CURRENT);
  });

  it("should return FUTURE for tomorrow", () => {
    const tomorrowDate = new Date("2024-01-16T00:00:00.000Z");
    expect(getTemporal(tomorrowDate, today)).toBe(FUTURE);
  });

  it("should return FUTURE for dates well in the future", () => {
    const futureDate = new Date("2024-01-20T12:00:00.000Z");
    expect(getTemporal(futureDate, today)).toBe(FUTURE);
  });

  it("should handle edge case at midnight boundary", () => {
    const todayMidnight = new Date("2024-01-15T00:00:00.000Z");
    const tomorrowMidnight = new Date("2024-01-16T00:00:00.000Z");

    expect(getTemporal(todayMidnight, today)).toBe(CURRENT);
    expect(getTemporal(tomorrowMidnight, today)).toBe(FUTURE);
  });
});

describe("compareEvents", () => {
  const baseDate = new Date("2024-01-15T12:00:00.000Z");
  const earlierDate = new Date("2024-01-14T12:00:00.000Z");
  const laterDate = new Date("2024-01-16T12:00:00.000Z");

  it("should sort by temporal status first (CURRENT < FUTURE < PAST)", () => {
    const currentEvent = { temporal: CURRENT, date: baseDate };
    const futureEvent = { temporal: FUTURE, date: baseDate };
    const pastEvent = { temporal: PAST, date: baseDate };

    expect(compareEvents(currentEvent, futureEvent)).toBeLessThan(0);
    expect(compareEvents(futureEvent, pastEvent)).toBeLessThan(0);
    expect(compareEvents(currentEvent, pastEvent)).toBeLessThan(0);

    expect(compareEvents(futureEvent, currentEvent)).toBeGreaterThan(0);
    expect(compareEvents(pastEvent, futureEvent)).toBeGreaterThan(0);
    expect(compareEvents(pastEvent, currentEvent)).toBeGreaterThan(0);
  });

  it("should sort past events in reverse chronological order (newer first)", () => {
    const olderPastEvent = { temporal: PAST, date: earlierDate };
    const newerPastEvent = { temporal: PAST, date: laterDate };

    expect(compareEvents(olderPastEvent, newerPastEvent)).toBeGreaterThan(0);
    expect(compareEvents(newerPastEvent, olderPastEvent)).toBeLessThan(0);
  });

  it("should sort current events in chronological order (earlier first)", () => {
    const earlierCurrentEvent = { temporal: CURRENT, date: earlierDate };
    const laterCurrentEvent = { temporal: CURRENT, date: laterDate };

    expect(compareEvents(earlierCurrentEvent, laterCurrentEvent)).toBeLessThan(
      0,
    );
    expect(
      compareEvents(laterCurrentEvent, earlierCurrentEvent),
    ).toBeGreaterThan(0);
  });

  it("should sort future events in chronological order (earlier first)", () => {
    const earlierFutureEvent = { temporal: FUTURE, date: earlierDate };
    const laterFutureEvent = { temporal: FUTURE, date: laterDate };

    expect(compareEvents(earlierFutureEvent, laterFutureEvent)).toBeLessThan(0);
    expect(compareEvents(laterFutureEvent, earlierFutureEvent)).toBeGreaterThan(
      0,
    );
  });

  it("should return 0 for identical events", () => {
    const event1 = { temporal: CURRENT, date: baseDate };
    const event2 = { temporal: CURRENT, date: new Date(baseDate.getTime()) };

    expect(compareEvents(event1, event2)).toBe(0);
  });
});

describe("processEvents", () => {
  let fixedToday: Date;

  beforeEach(() => {
    fixedToday = new Date("2024-01-15T10:30:00.000Z");
  });

  it("should return empty array for empty input", () => {
    const result = processEvents([], fixedToday);
    expect(result).toEqual([]);
  });

  it("should transform RawEvent to ProcessedEvent correctly", () => {
    const rawEvents = [
      {
        id: "event1",
        data: {
          title: "Test Event",
          date: new Date("2024-01-15T14:00:00.000Z"),
        },
        body: "Event description",
      },
    ];

    const result = processEvents(rawEvents, fixedToday);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "event1",
      title: "Test Event",
      date: new Date("2024-01-15T14:00:00.000Z"),
      temporal: CURRENT,
      description: "Event description",
    });
  });

  it("should handle events without body/description", () => {
    const rawEvents = [
      {
        id: "event1",
        data: {
          title: "Test Event",
          date: new Date("2024-01-15T14:00:00.000Z"),
        },
      },
    ];

    const result = processEvents(rawEvents, fixedToday);

    expect(result[0].description).toBeUndefined();
  });

  it("should correctly classify and sort mixed temporal events", () => {
    const rawEvents = [
      {
        id: "past1",
        data: {
          title: "Past Event 1",
          date: new Date("2024-01-10T10:00:00.000Z"),
        },
      },
      {
        id: "future1",
        data: {
          title: "Future Event 1",
          date: new Date("2024-01-20T10:00:00.000Z"),
        },
      },
      {
        id: "current1",
        data: {
          title: "Current Event 1",
          date: new Date("2024-01-15T14:00:00.000Z"),
        },
      },
      {
        id: "past2",
        data: {
          title: "Past Event 2",
          date: new Date("2024-01-12T10:00:00.000Z"),
        },
      },
      {
        id: "future2",
        data: {
          title: "Future Event 2",
          date: new Date("2024-01-18T10:00:00.000Z"),
        },
      },
    ];

    const result = processEvents(rawEvents, fixedToday);

    expect(result).toHaveLength(5);

    // Check temporal classification
    expect(result[0].temporal).toBe(CURRENT); // current1
    expect(result[1].temporal).toBe(FUTURE); // future2 (earlier)
    expect(result[2].temporal).toBe(FUTURE); // future1 (later)
    expect(result[3].temporal).toBe(PAST); // past2 (newer)
    expect(result[4].temporal).toBe(PAST); // past1 (older)

    // Check order within each category
    expect(result[0].id).toBe("current1");
    expect(result[1].id).toBe("future2"); // Earlier future event first
    expect(result[2].id).toBe("future1"); // Later future event second
    expect(result[3].id).toBe("past2"); // Newer past event first
    expect(result[4].id).toBe("past1"); // Older past event second
  });

  it("should use current date when today parameter is not provided", () => {
    const rawEvents = [
      {
        id: "event1",
        data: {
          title: "Test Event",
          date: new Date(),
        },
      },
    ];

    // Should not throw and should process the event
    const result = processEvents(rawEvents);
    expect(result).toHaveLength(1);
    expect(result[0].temporal).toBeOneOf([CURRENT, FUTURE, PAST]);
  });

  it("should normalize today parameter to start of day", () => {
    // Create a "today" with specific time
    const todayWithTime = new Date("2024-01-15T15:30:45.123Z");

    const rawEvents = [
      {
        id: "morning",
        data: {
          title: "Morning Event",
          date: new Date("2024-01-15T08:00:00.000Z"),
        },
      },
      {
        id: "evening",
        data: {
          title: "Evening Event",
          date: new Date("2024-01-15T20:00:00.000Z"),
        },
      },
    ];

    const result = processEvents(rawEvents, todayWithTime);

    // Both should be CURRENT since they're on the same day
    expect(result[0].temporal).toBe(CURRENT);
    expect(result[1].temporal).toBe(CURRENT);
  });

  it("should handle complex sorting with multiple events of same temporal type", () => {
    const rawEvents = [
      {
        id: "past3",
        data: { title: "Past 3", date: new Date("2024-01-13T15:00:00.000Z") },
      },
      {
        id: "past1",
        data: { title: "Past 1", date: new Date("2024-01-11T10:00:00.000Z") },
      },
      {
        id: "past2",
        data: { title: "Past 2", date: new Date("2024-01-12T12:00:00.000Z") },
      },
    ];

    const result = processEvents(rawEvents, fixedToday);

    // All should be PAST and sorted in reverse chronological order
    expect(result.map((e) => e.id)).toEqual(["past3", "past2", "past1"]);
  });
});
