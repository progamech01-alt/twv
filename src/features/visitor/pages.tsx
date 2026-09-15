"use client";
import Link from "next/link";
import {
  useMemo,
  useState,
  useEffect,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  LockKeyhole,
  MapPin,
  BookOpen,
  Shuffle,
} from "lucide-react";
import { useUniverse } from "@/components/universe-provider";
import { Modal, Empty, MediaImage } from "@/components/primitives";
import { EventService } from "@/services/event-service";
import { dateKey, thaiDate, calendarGrid } from "@/lib/time";
import {
  pageConfig,
  type PageConfig,
  type Row,
  type State,
  type Occurrence,
} from "@/lib/model";
import { api } from "@/services/client";

const heading: Record<string, [string, string]> = {
  journey: [
    "ทุกช่วงเวลา\nพาเรามาถึงตรงนี้",
    "จากวันแรก สู่วันนี้ และเรื่องราวที่ยังรออยู่ข้างหน้า",
  ],
  memories: [
    "ความทรงจำ\nที่ยังส่องแสง",
    "เก็บภาพ เสียง และความรู้สึกของวันนั้นไว้ด้วยกัน",
  ],
  time: [
    "เวลาเดินไป\nพร้อมกับเรา",
    "วันสำคัญ แผนเล็ก ๆ และการนับถอยหลังครั้งต่อไป",
  ],
  letters: [
    "บางความรู้สึก\nอยากเก็บไว้เป็นจดหมาย",
    "ถึงคนที่ทำให้วันธรรมดา มีความหมายมากกว่าเดิม",
  ],
  lumi: [
    "มีอะไรอยากเล่า\nให้ LUMI ฟังไหม",
    "ผู้ดูแลเรื่องราวเล็ก ๆ ในจักรวาลของเรา",
  ],
};
export function PageFrame({
  slug,
  children,
  preview,
  state: given,
}: {
  slug: string;
  children: ReactNode;
  preview?: PageConfig;
  state?: State;
}) {
  const { state } = useUniverse();
  const s = given || state!;
  const page = s.pages.find((p) => p.slug === slug);
  const config = preview || pageConfig(page);
  const title =
    page || preview
      ? config.hero_title
      : heading[slug]?.[0] || config.hero_title;
  return (
    <div
      className={`page-frame layout-${config.layout} motion-${config.motion}`}
      style={
        {
          "--accent": config.accent,
          "--glow": config.glow,
          "--font-scale": config.font_scale,
        } as CSSProperties
      }
    >
      <div className={`page-heading align-${config.alignment}`}>
        <p className="eyebrow">
          <span className="tiny-star">✦</span> OUR UNIVERSE /{" "}
          {slug.toUpperCase()}
        </p>
        <h1>{title}</h1>
        <p className="muted">
          {page || preview ? config.subtitle : heading[slug]?.[1]}
        </p>
      </div>
      {children}
    </div>
  );
}
export function Home({
  preview,
  state: provided,
}: {
  preview?: PageConfig;
  state?: State;
}) {
  const { state: live } = useUniverse();
  const state = provided || live!;
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const engine = new EventService(state.events, state.facts),
    dur = engine.duration(now),
    next = engine.upcoming(now)[0],
    config = preview || pageConfig(state.pages.find((p) => p.slug === "home"));
  const surprise = state.surprises.find(
    (s) =>
      s.enabled &&
      new Date(String(s.start_at)) <= now &&
      new Date(String(s.end_at)) >= now,
  );
  const sections: Record<string, ReactNode> = {
    today: (
      <section className="today-strip" key="today">
        <div>
          <span className="eyebrow">TODAY IN OUR UNIVERSE</span>
          <h3>{thaiDate(now)}</h3>
        </div>
        <div className="live-dot">วันนี้ก็ยังมีเรา</div>
        <Link href="/time">
          ดูปฏิทิน <ArrowUpRight size={17} />
        </Link>
      </section>
    ),
    upcoming: (
      <section className="section" key="upcoming">
        <div className="section-title">
          <div>
            <span className="eyebrow">SOMETHING TO LOOK FORWARD TO</span>
            <h2>เรื่องราวที่กำลังจะมาถึง</h2>
          </div>
          <Link href="/journey">
            ดู Journey <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="feature-grid">
          <Link href="/time" className="event-feature">
            <div className="mini-orbit" aria-hidden="true" />
            <div>
              <span className="pill">NEXT CHAPTER</span>
              <h3>{next?.title || "วันพรุ่งนี้ยังรอให้เราเขียน"}</h3>
              <p>
                {next ? thaiDate(next.occurs_at) : "เพิ่มแผนแรกของเราใน Studio"}
              </p>
            </div>
            <span className="circle-arrow">
              <ArrowUpRight />
            </span>
          </Link>
          <div className="countdown-card">
            <CalendarDays size={22} />
            <p className="eyebrow">OUR NEXT MOMENT</p>
            <strong>
              {next
                ? Math.max(
                    0,
                    Math.ceil(
                      (new Date(next.occurs_at).getTime() - now.getTime()) /
                        86400000,
                    ),
                  )
                : "—"}
              <small>วัน</small>
            </strong>
            <p>{next?.title || "มีเรื่องดี ๆ รออยู่เสมอ"}</p>
          </div>
        </div>
      </section>
    ),
    memories: (
      <section className="section" key="memories">
        <div className="section-title">
          <div>
            <span className="eyebrow">KEEP THE FEELING</span>
            <h2>แสงจากวันที่ผ่านมา</h2>
          </div>
          <Link href="/memories">
            เปิดความทรงจำ <ArrowUpRight size={17} />
          </Link>
        </div>
        {state.memories.length ? (
          <div className="memory-grid">
            {state.memories.slice(0, 3).map((m) => (
              <Link href="/memories" className="memory-card" key={m.id}>
                <MediaImage url={String(m.cover_url || "")} alt={m.title} />
                <div>
                  <span className="eyebrow">
                    {thaiDate(String(m.date), true)}
                  </span>
                  <h3>{m.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Link href="/studio" className="memory-empty">
            <div className="memory-empty-art" aria-hidden="true">
              <span>✦</span>
            </div>
            <div>
              <p className="eyebrow">A SPACE FOR YOUR FIRST MEMORY</p>
              <h3>
                ความทรงจำแรกของเรา
                <br />
                จะเป็นเรื่องอะไรดี
              </h3>
              <p className="muted">เพิ่มภาพหนึ่งภาพ แล้วเล่าเรื่องของวันนั้น</p>
            </div>
            <Plus size={25} />
          </Link>
        )}
      </section>
    ),
    note: (
      <section className="note-section" key="note">
        <span className="eyebrow">A LITTLE NOTE FOR YOU</span>
        <blockquote>
          “
          {String(
            state.quick_notes[0]?.content ||
              "ทุกวันมีพื้นที่ให้เรื่องราวใหม่ ๆ เสมอ",
          )}
          ”
        </blockquote>
        <Link href="/letters">
          เปิดจดหมายของเรา <ArrowRight size={16} />
        </Link>
      </section>
    ),
  };
  return (
    <div
      className={`home-page layout-${config.layout} motion-${config.motion}`}
      style={
        {
          "--accent": surprise ? String(surprise.accent) : config.accent,
          "--glow": config.glow,
          "--font-scale": config.font_scale,
        } as CSSProperties
      }
    >
      <section className={`hero align-${config.alignment}`}>
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> A LITTLE UNIVERSE, JUST FOR US
          </p>
          <h1>{surprise ? String(surprise.title) : config.hero_title}</h1>
          <p className="hero-description">
            {surprise ? String(surprise.message) : config.subtitle}
          </p>
          <div className="hero-buttons">
            <Link className="primary" href="/journey">
              เปิดเรื่องราวของเรา <ArrowRight size={17} />
            </Link>
            <Link className="text-button" href="/lumi">
              คุยกับ LUMI <span>✦</span>
            </Link>
          </div>
          <div className="together">
            <span className="together-line" />
            <div>
              <span className="eyebrow">EVERY MOMENT, TOGETHER</span>
              <p>
                {dur ? (
                  <>
                    <strong>{dur.days}</strong> วัน <b>{dur.hours}</b> ชั่วโมง{" "}
                    <b>{dur.minutes}</b> นาที
                  </>
                ) : (
                  <>
                    เริ่มเขียน <strong>วันแรก</strong> ไปด้วยกัน
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orb" />
          <span className="orbit-star star-a">✦</span>
          <span className="orbit-star star-b">✧</span>
          <div className="orb-caption">
            <span>YOU + ME</span>
            <small>some things are written in the stars</small>
          </div>
        </div>
        <span className="hero-index">01 — ∞</span>
      </section>
      {config.sections
        .filter((k) => !config.hidden.includes(k))
        .map((k) => sections[k])}
      <Link href="/lumi" className="lumi-entry">
        <div className="lumi-gem">✦</div>
        <div>
          <span className="eyebrow">THE KEEPER OF OUR UNIVERSE</span>
          <h3>ให้ LUMI ช่วยจำเรื่องราวของเรา</h3>
          <p>ถามถึงวันสำคัญ ค้นหาความทรงจำ หรือเริ่มต้นไอเดียใหม่</p>
        </div>
        <ArrowUpRight />
      </Link>
    </div>
  );
}
export function Journey() {
  const { state } = useUniverse();
  const [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState<Row | null>(null);
  const now = new Date();
  const rows = [...state!.events]
    .sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)))
    .filter(
      (r) =>
        filter === "all" ||
        (filter === "past"
          ? new Date(String(r.start_at)) < now
          : new Date(String(r.start_at)) >= now),
    );
  return (
    <PageFrame slug="journey">
      <div className="segmented">
        {[
          ["all", "ทุกช่วงเวลา"],
          ["past", "วันผ่านมา"],
          ["future", "วันข้างหน้า"],
        ].map(([k, label]) => (
          <button
            key={k}
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="timeline">
        {rows.length ? (
          rows.map((r, i) => (
            <button
              className="timeline-item"
              key={r.id}
              onClick={() => setSelected(r)}
            >
              <span className="timeline-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="timeline-point" />
              <div>
                <p className="eyebrow">
                  {thaiDate(String(r.start_at))}{" "}
                  <span className="pill">{String(r.status)}</span>
                </p>
                <h2>{r.title}</h2>
                <p className="muted">{String(r.description)}</p>
                {!!r.location && (
                  <p className="location">
                    <MapPin size={14} />
                    {String(r.location)}
                  </p>
                )}
              </div>
              <ArrowUpRight size={20} />
            </button>
          ))
        ) : (
          <Empty />
        )}
      </div>
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <p className="eyebrow">{thaiDate(String(selected.start_at))}</p>
          <p className="prose">{String(selected.description)}</p>
          {!!selected.cover_url && (
            <MediaImage url={String(selected.cover_url)} alt={selected.title} />
          )}
        </Modal>
      )}
    </PageFrame>
  );
}
export function Time() {
  const { state } = useUniverse();
  const [month, setMonth] = useState(() => dateKey().slice(0, 7)),
    [type, setType] = useState("all"),
    [day, setDay] = useState<string | null>(null);
  const [y, m] = month.split("-").map(Number),
    grid = calendarGrid(y, m - 1),
    engine = new EventService(state!.events, state!.facts);
  const events = engine
    .range(
      new Date(`${grid[0]}T00:00:00+07:00`),
      new Date(`${grid[41]}T23:59:59+07:00`),
    )
    .filter((e) => type === "all" || e.type === type);
  const forDay = (key: string) =>
    events.filter((e) => {
      const start = dateKey(e.occurs_at);
      const span = e.end_at
        ? new Date(e.end_at).getTime() - new Date(e.start_at).getTime()
        : 0;
      return (
        key >= start &&
        key <= dateKey(new Date(new Date(e.occurs_at).getTime() + span))
      );
    });
  const move = (n: number) =>
    setMonth(new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7));
  return (
    <PageFrame slug="time">
      <div className="calendar-layout">
        <section className="calendar glass">
          <div className="calendar-toolbar">
            <h2>
              {new Intl.DateTimeFormat("th-TH", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(`${month}-01`))}
            </h2>
            <div>
              <button
                className="icon-button"
                aria-label="เดือนก่อน"
                onClick={() => move(-1)}
              >
                <ChevronLeft />
              </button>
              <button onClick={() => setMonth(dateKey().slice(0, 7))}>
                วันนี้
              </button>
              <button
                className="icon-button"
                aria-label="เดือนถัดไป"
                onClick={() => move(1)}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
          <div className="calendar-filters">
            <label>
              เดือน / ปี
              <input
                aria-label="เลือกเดือนและปี"
                type="month"
                value={month}
                onInput={(e) => {
                  if (e.currentTarget.value) setMonth(e.currentTarget.value);
                }}
                onChange={(e) => {
                  if (e.target.value) setMonth(e.target.value);
                }}
              />
            </label>
            <label>
              ประเภท
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">ทั้งหมด</option>
                {[
                  "relationship",
                  "birthday",
                  "trip",
                  "plan",
                  "special",
                  "custom",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="calendar-grid">
            {["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"].map((d) => (
              <span className="weekday" key={d}>
                {d}
              </span>
            ))}
            {grid.map((key) => (
              <button
                key={key}
                aria-label={`${key} ${forDay(key)
                  .map((e) => e.title)
                  .join(", ")}`}
                className={`calendar-day ${key.slice(0, 7) !== month ? "outside" : ""} ${key === dateKey() ? "is-today" : ""}`}
                onClick={() => setDay(key)}
              >
                <span>{Number(key.slice(-2))}</span>
                {forDay(key)
                  .slice(0, 2)
                  .map((e) => (
                    <small key={e.id + e.occurs_at}>{e.title}</small>
                  ))}
                {forDay(key).length > 2 && (
                  <small>+{forDay(key).length - 2}</small>
                )}
              </button>
            ))}
          </div>
        </section>
        <aside>
          <p className="eyebrow">COMING UP NEXT</p>
          <h2>วันดี ๆ ที่รอเรา</h2>
          {engine
            .upcoming()
            .slice(0, 5)
            .map((e) => (
              <div className="upcoming-row" key={e.id + e.occurs_at}>
                <CalendarDays size={18} />
                <div>
                  <h4>{e.title}</h4>
                  <p>{thaiDate(e.occurs_at, true)}</p>
                </div>
              </div>
            ))}
          {!engine.upcoming().length && <Empty text="ยังไม่มีแผนถัดไป" />}
          <p className="eyebrow milestone-label">OUR MILESTONES</p>
          {engine
            .milestones()
            .filter((x) => new Date(x.date) >= new Date())
            .slice(0, 3)
            .map((x) => (
              <div className="upcoming-row" key={x.days}>
                <span>✧</span>
                <div>
                  <h4>{x.days} วันของเรา</h4>
                  <p>{thaiDate(x.date, true)}</p>
                </div>
              </div>
            ))}
        </aside>
      </div>
      {day && (
        <Modal
          title={thaiDate(`${day}T00:00:00+07:00`)}
          onClose={() => setDay(null)}
        >
          {forDay(day).length ? (
            forDay(day).map((e) => (
              <article key={e.id}>
                <span className="pill">{e.type}</span>
                <h3>{e.title}</h3>
                <p className="prose">{e.description}</p>
              </article>
            ))
          ) : (
            <Empty text="วันว่าง ๆ ที่ยังเติมเรื่องราวได้" />
          )}
        </Modal>
      )}
    </PageFrame>
  );
}
export function Memories() {
  const { state } = useUniverse();
  const [query, setQuery] = useState(""),
    [album, setAlbum] = useState("all"),
    [selected, setSelected] = useState<Row | null>(null),
    [story, setStory] = useState(false),
    [index, setIndex] = useState(0);
  const rows = state!.memories.filter(
    (r) =>
      (album === "all" || r.album_id === album) &&
      `${r.title} ${r.story} ${r.tags}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <PageFrame slug="memories">
      <div className="toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาเรื่องราว สถานที่ หรือแท็ก"
            aria-label="ค้นหาความทรงจำ"
          />
        </label>
        <select
          aria-label="อัลบั้ม"
          value={album}
          onChange={(e) => setAlbum(e.target.value)}
        >
          <option value="all">ทุกอัลบั้ม</option>
          {state!.albums.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
        <button
          disabled={!rows.length}
          onClick={() => {
            setIndex(0);
            setStory(true);
          }}
        >
          <BookOpen size={16} /> Story Mode
        </button>
      </div>
      <div className="memory-grid">
        {rows.map((r) => (
          <button
            className="memory-card"
            key={r.id}
            onClick={() => setSelected(r)}
          >
            <MediaImage url={String(r.cover_url)} alt={r.title} />
            <div>
              <span className="eyebrow">{thaiDate(String(r.date), true)}</span>
              <h3>{r.title}</h3>
              <p>{String(r.location)}</p>
            </div>
          </button>
        ))}
      </div>
      {!rows.length && (
        <Empty
          text={query ? "ยังไม่พบความทรงจำนี้" : "ความทรงจำแรกกำลังรอคุณ"}
          detail="เพิ่มภาพและเรื่องราวจาก Studio → ความทรงจำ"
        />
      )}
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <MediaImage url={String(selected.cover_url)} alt={selected.title} />
          <p className="eyebrow">{thaiDate(String(selected.date))}</p>
          <p className="prose">{String(selected.story)}</p>
          <p className="muted">{(selected.tags as string[]).join(" · ")}</p>
        </Modal>
      )}
      {story && rows[index] && (
        <Modal
          title={`OUR STORY · ${index + 1} / ${rows.length}`}
          onClose={() => setStory(false)}
        >
          <div className="story-slide" key={rows[index].id}>
            <MediaImage
              url={String(rows[index].cover_url)}
              alt={rows[index].title}
            />
            <span className="eyebrow">
              {thaiDate(String(rows[index].date))}
            </span>
            <h2>{rows[index].title}</h2>
            <p className="prose">{String(rows[index].story)}</p>
          </div>
          <div className="dialog-actions">
            <button disabled={index === 0} onClick={() => setIndex(index - 1)}>
              ก่อนหน้า
            </button>
            <button
              disabled={index === rows.length - 1}
              onClick={() => setIndex(index + 1)}
            >
              ถัดไป
            </button>
          </div>
        </Modal>
      )}
      <Wrapped state={state!} />
    </PageFrame>
  );
}
function Wrapped({ state }: { state: State }) {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const memories = state.memories.filter((m) =>
      String(m.date).startsWith(year),
    ),
    events = state.events.filter(
      (e) =>
        dateKey(String(e.start_at)).startsWith(year) &&
        e.status === "completed",
    );
  return (
    <section className="wrapped">
      <div>
        <span className="eyebrow">OUR YEAR, IN LITTLE MOMENTS</span>
        <h2>Our {year}</h2>
        <label>
          ปี
          <input
            aria-label="ปีสรุปเรื่องราว"
            type="number"
            min="2000"
            max="2200"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </label>
      </div>
      <div>
        <strong>{memories.length}</strong>
        <span>ความทรงจำที่บันทึก</span>
      </div>
      <div>
        <strong>{events.length}</strong>
        <span>เหตุการณ์ที่ทำสำเร็จ</span>
      </div>
      <div>
        <strong>
          {
            state.letters.filter((l) => String(l.created_at).startsWith(year))
              .length
          }
        </strong>
        <span>จดหมายที่อ่านได้</span>
      </div>
    </section>
  );
}
export function Letters() {
  const { state } = useUniverse();
  const [selected, setSelected] = useState<Row | null>(null),
    [note, setNote] = useState(0);
  return (
    <PageFrame slug="letters">
      <div className="letter-grid">
        {state!.letters.map((r) => (
          <button
            className="letter-card"
            key={r.id}
            onClick={() => setSelected(r)}
          >
            <span className="letter-symbol">
              {r.kind === "capsule" ? "✧" : "♡"}
            </span>
            <span className="eyebrow">
              {r.kind === "capsule"
                ? "AN UNLOCKED CAPSULE"
                : "A LETTER FOR YOU"}
            </span>
            <h2>{r.title}</h2>
            <p>{thaiDate(String(r.created_at), true)}</p>
            <ArrowUpRight size={19} />
          </button>
        ))}
        <div className="locked-card">
          <LockKeyhole size={25} />
          <h3>บางเรื่องราวมีเวลาของมัน</h3>
          <p>
            แคปซูลที่ยังไม่ถึงวันเปิด
            <br />
            จะไม่ถูกส่งมาที่เว็บหรือ LUMI
          </p>
        </div>
      </div>
      {!state!.letters.length && <Empty text="ยังไม่มีจดหมายที่เปิดอ่านได้" />}
      <section className="note-section">
        <span className="eyebrow">A JAR OF LITTLE WORDS</span>
        <blockquote>
          {String(
            state!.quick_notes[note % Math.max(1, state!.quick_notes.length)]
              ?.content || "โน้ตเล็ก ๆ ของเราจะอยู่ตรงนี้",
          )}
        </blockquote>
        <button
          onClick={() =>
            setNote(
              Math.floor(
                Math.random() * Math.max(1, state!.quick_notes.length),
              ),
            )
          }
        >
          <Shuffle size={15} /> สุ่มโน้ตอีกใบ
        </button>
      </section>
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <div className="letter-paper">
            <p className="eyebrow">JUST FOR YOU</p>
            <p className="prose">{String(selected.content)}</p>
            <span>ด้วยรักเสมอ ♡</span>
          </div>
        </Modal>
      )}
    </PageFrame>
  );
}
