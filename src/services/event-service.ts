import type { Row, Event } from "@/lib/model";
import { occurrences, milestones, duration } from "@/lib/time";
export class EventService {
  constructor(
    readonly rows: Row[],
    readonly facts: Row[],
  ) {}
  get start() {
    return String(
      this.facts.find((f) => f.key === "relationship_start")?.value || "",
    );
  }
  range(from: Date, to: Date) {
    return occurrences(this.rows as Event[], from, to);
  }
  upcoming(now = new Date()) {
    return this.range(now, new Date(now.getTime() + 366 * 86400000))
      .filter((e) => e.status !== "completed")
      .slice(0, 12);
  }
  duration(now = new Date()) {
    return this.start ? duration(this.start, now) : null;
  }
  milestones() {
    return this.start ? milestones(this.start) : [];
  }
}
