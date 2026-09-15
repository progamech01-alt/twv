import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dateKey,
  duration,
  occurrences,
  calendarGrid,
  timeContext,
  milestones,
} from "../src/lib/time";
import { changeSchema } from "../src/lib/validation";
import { defaults } from "../src/features/studio/fields";
import type { Event } from "../src/lib/model";
const base = {
  id: "a",
  title: "Birthday",
  revision: 1,
  created_at: "",
  updated_at: "",
  description: "",
  end_at: null,
  timezone: "Asia/Bangkok",
  type: "birthday",
  status: "confirmed",
  recurrence: "yearly",
  location: "",
  cover_url: "",
} as Event;
test("Bangkok date rolls over at 17:00 UTC", () => {
  assert.equal(dateKey("2026-08-28T17:00:00Z"), "2026-08-29");
  assert.equal(
    timeContext(new Date("2026-08-28T17:00:00Z")).CURRENT_TIME,
    "00:00:00",
  );
});
test("relationship duration uses Bangkok midnight and never negative", () => {
  assert.deepEqual(duration("2026-08-29", new Date("2026-08-29T17:30:00Z")), {
    days: 1,
    hours: 0,
    minutes: 30,
  });
  assert.equal(duration("2026-08-29", new Date("2026-01-01")).days, 0);
});
test("yearly birthday keeps wall time, leap-day clamps to Feb 28", () => {
  const e = { ...base, start_at: "2024-02-29T09:15:00+07:00" };
  const got = occurrences([e], new Date("2025-01-01"), new Date("2025-12-31"));
  assert.equal(got.length, 1);
  assert.equal(got[0].occurs_at, "2025-02-28T02:15:00.000Z");
});
test("overlapping multi-day event appears even if start outside range", () => {
  const e = {
    ...base,
    start_at: "2026-09-10T12:00:00+07:00",
    end_at: "2026-09-15T12:00:00+07:00",
    recurrence: "none",
  };
  assert.equal(
    occurrences([e], new Date("2026-09-14"), new Date("2026-09-16")).length,
    1,
  );
  assert.equal(
    occurrences(
      [{ ...e, status: "cancelled" }],
      new Date("2026-09-14"),
      new Date("2026-09-16"),
    ).length,
    0,
  );
});
test("calendar has 42 days and starts Monday", () => {
  const grid = calendarGrid(2026, 8);
  assert.equal(grid.length, 42);
  assert.equal(new Date(grid[0]).getUTCDay(), 1);
  assert.equal(grid.includes("2026-09-01"), true);
});
test("100 day milestone derives from canonical start", () => {
  assert.equal(
    dateKey(milestones("2026-08-29").find((m) => m.days === 100)!.date),
    "2026-12-07",
  );
});
test("reject unknown mutation fields, insecure URLs and missing revisions", () => {
  const patch = { ...defaults("events"), title: "Trip" };
  assert.equal(
    changeSchema.safeParse({
      resource: "events",
      id: null,
      expected_revision: null,
      action: "save",
      patch,
    }).success,
    true,
  );
  assert.equal(
    changeSchema.safeParse({
      resource: "events",
      id: null,
      expected_revision: null,
      action: "save",
      patch: { ...patch, admin: true },
    }).success,
    false,
  );
  assert.equal(
    changeSchema.safeParse({
      resource: "events",
      id: null,
      expected_revision: null,
      action: "save",
      patch: { ...patch, cover_url: "javascript:alert(1)" },
    }).success,
    false,
  );
});
test("capsule requires unlock time", () => {
  const patch = { ...defaults("letters"), title: "Locked", kind: "capsule" };
  assert.equal(
    changeSchema.safeParse({
      resource: "letters",
      id: null,
      expected_revision: null,
      action: "save",
      patch,
    }).success,
    false,
  );
});
