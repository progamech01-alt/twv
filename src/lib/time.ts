import type { Event, Occurrence } from "./model";
export const TIMEZONE = "Asia/Bangkok";
export function dateKey(date: Date | string = new Date()): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(date));
  return ["year", "month", "day"]
    .map((k) => p.find((x) => x.type === k)!.value)
    .join("-");
}
export function timeContext(now = new Date()) {
  return {
    CURRENT_DATE: dateKey(now),
    CURRENT_TIME: new Intl.DateTimeFormat("en-GB", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(now),
    TIMEZONE,
    ISO_TIMESTAMP: now.toISOString(),
  };
}
export function duration(start: string, now = new Date()) {
  const ms = Math.max(
    0,
    now.getTime() - new Date(`${start}T00:00:00+07:00`).getTime(),
  );
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
  };
}
export function thaiDate(value: string | Date, short = false) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: short ? "short" : "long",
    year: "numeric",
  }).format(new Date(value));
}
export function calendarGrid(year: number, month: number) {
  const start = new Date(Date.UTC(year, month, 1));
  const offset = (start.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) =>
    new Date(Date.UTC(year, month, 1 - offset + i)).toISOString().slice(0, 10),
  );
}
export function occurrences(
  events: Event[],
  from: Date,
  to: Date,
): Occurrence[] {
  const result: Occurrence[] = [];
  for (const event of events) {
    if (event.status === "cancelled" || event.status === "idea") continue;
    const original = new Date(event.start_at);
    const span = event.end_at
      ? Math.max(0, new Date(event.end_at).getTime() - original.getTime())
      : 0;
    const push = (d: Date) => {
      if (d <= to && d.getTime() + span >= from.getTime())
        result.push({ ...event, occurs_at: d.toISOString() });
    };
    if (event.recurrence !== "yearly") {
      push(original);
      continue;
    }
    // Anniversary recurrence keeps Bangkok wall-clock time; leap-day recurs Feb 28 in non-leap years.
    const wall = new Date(original.getTime() + 7 * 3600000);
    for (let y = from.getUTCFullYear() - 1; y <= to.getUTCFullYear() + 1; y++) {
      if (y < wall.getUTCFullYear()) continue;
      const m = wall.getUTCMonth(),
        day = Math.min(
          wall.getUTCDate(),
          new Date(Date.UTC(y, m + 1, 0)).getUTCDate(),
        );
      push(
        new Date(
          Date.UTC(y, m, day, wall.getUTCHours(), wall.getUTCMinutes()) -
            7 * 3600000,
        ),
      );
    }
  }
  return result.sort((a, b) => a.occurs_at.localeCompare(b.occurs_at));
}
export function milestones(start: string) {
  return [30, 50, 100, 200, 365, 500, 1000].map((days) => ({
    days,
    date: new Date(
      new Date(`${start}T00:00:00+07:00`).getTime() + days * 86400000,
    ).toISOString(),
  }));
}
