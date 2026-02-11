export const CURRENT = 0;
export const FUTURE = 1;
export const PAST = 2;

export type Temporal = typeof CURRENT | typeof FUTURE | typeof PAST;

interface RawEvent {
  id: string;
  data: { title: string; date: Date };
  body?: string;
}

export interface ProcessedEvent {
  id: string;
  title: string;
  date: Date;
  temporal: Temporal;
  description?: string;
}

export function getTemporal(date: Date, today: Date): Temporal {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return date >= tomorrow ? FUTURE : date >= today ? CURRENT : PAST;
}

export function compareEvents(
  a: { temporal: Temporal; date: Date },
  b: { temporal: Temporal; date: Date },
): number {
  if (a.temporal !== b.temporal) {
    return a.temporal - b.temporal;
  }

  // Past events: reverse chronological; current/future: chronological
  return a.temporal === PAST
    ? b.date.getTime() - a.date.getTime()
    : a.date.getTime() - b.date.getTime();
}

export function processEvents(events: RawEvent[], today?: Date): ProcessedEvent[] {
  const t = today ?? new Date();
  t.setHours(0, 0, 0, 0);

  return events
    .map(event => ({
      id: event.id,
      title: event.data.title,
      date: event.data.date,
      temporal: getTemporal(event.data.date, t),
      description: event.body,
    }))
    .sort(compareEvents);
}
