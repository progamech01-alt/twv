"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  PenLine,
  Trash2,
  Eye,
  Undo2,
  Sparkles,
  LayoutTemplate,
  BookOpen,
  Upload,
  ArrowRight,
} from "lucide-react";
import { useUniverse } from "@/components/universe-provider";
import { Modal, Empty } from "@/components/primitives";
import {
  resources,
  resourceLabels,
  pageConfig,
  type Resource,
  type Row,
  type State,
} from "@/lib/model";
import { RecordEditor } from "./editor";
import { LumiChat } from "@/features/lumi/chat";
import { Home, PageFrame } from "@/features/visitor/pages";
import { api } from "@/services/client";
import { uploadMedia } from "@/services/media-service";
import { dateKey, thaiDate } from "@/lib/time";
type Tab = Resource | "overview" | "lumi" | "changes" | "versions";
export function Studio() {
  const u = useUniverse();
  const [tab, setTab] = useState<Tab>("overview"),
    [edit, setEdit] = useState<{
      resource: Resource;
      row?: Row;
      initial?: Record<string, unknown>;
    } | null>(null),
    [del, setDel] = useState<Row | null>(null),
    [preview, setPreview] = useState<Row | null>(null),
    [viewed, setViewed] = useState<Set<string>>(new Set()),
    [compare, setCompare] = useState<Row | null>(null),
    [busy, setBusy] = useState(false),
    [plan, setPlan] = useState<Row | null>(null),
    [start, setStart] = useState(`${dateKey()}T18:00`);
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("tab");
    if (t === "changes") setTab(t);
  }, []);
  if (u.state?.role !== "admin")
    return (
      <Empty
        text="หน้านี้สำหรับแอดมิน"
        detail="เข้าสู่ระบบด้วยบัญชีที่ได้รับสิทธิ์ admin"
      />
    );
  const state = u.state;
  const action = async (
    kind: string,
    id: string,
    extra: Record<string, unknown> = {},
  ) => {
    if (u.demo) {
      u.notify("โหมดตัวอย่างไม่บันทึกข้อมูล");
      return;
    }
    setBusy(true);
    try {
      await api("action", { action: kind, id, ...extra });
      await u.refresh();
      u.notify("ทำรายการแล้ว");
      setPreview(null);
      setCompare(null);
      setPlan(null);
    } catch (e) {
      u.notify(e instanceof Error ? e.message : "ทำรายการไม่ได้");
    } finally {
      setBusy(false);
    }
  };
  const deleteRecord = async () => {
    if (!del || !resources.includes(tab as Resource)) return;
    setBusy(true);
    try {
      await api("mutate", {
        change: {
          resource: tab,
          id: del.id,
          expected_revision: del.revision,
          patch: {},
          action: "delete",
        },
      });
      await u.refresh();
      setDel(null);
      u.notify("ลบแล้ว · ย้อนกลับได้ในประวัติ");
    } catch (e) {
      u.notify(e instanceof Error ? e.message : "ลบไม่ได้");
    } finally {
      setBusy(false);
    }
  };
  const upload = async (file: File) => {
    if (u.demo) {
      u.notify("โหมดตัวอย่างไม่อัปโหลด");
      return;
    }
    setBusy(true);
    try {
      await uploadMedia(file);
      await u.refresh();
      u.notify("อัปโหลดแล้ว ใช้ storage:// ตาม path ในฟอร์มภาพหรือเพลงได้");
    } catch (e) {
      u.notify(e instanceof Error ? e.message : "อัปโหลดไม่ได้");
    } finally {
      setBusy(false);
    }
  };
  const rows = resources.includes(tab as Resource)
    ? state[tab as Resource]
    : [];
  return (
    <div className="studio">
      <aside className="studio-sidebar">
        <p className="eyebrow">CREATIVE CONTROL CENTER</p>
        <h1>
          Studio <em>02</em>
        </h1>
        <div className="studio-nav">
          <button
            className={tab === "overview" ? "active" : ""}
            onClick={() => setTab("overview")}
          >
            ภาพรวม
          </button>
          <button
            className={tab === "lumi" ? "active" : ""}
            onClick={() => setTab("lumi")}
          >
            <Sparkles size={16} /> สั่ง LUMI ออกแบบเว็บ
          </button>
          <button
            className={tab === "changes" ? "active" : ""}
            onClick={() => setTab("changes")}
          >
            ข้อเสนอ / Drafts{" "}
            <span>
              {state.changes.filter((c) => c.status === "draft").length}
            </span>
          </button>
          {resources.map((r) => (
            <button
              key={r}
              className={tab === r ? "active" : ""}
              onClick={() => setTab(r)}
            >
              {resourceLabels[r]}
            </button>
          ))}
          <button
            className={tab === "versions" ? "active" : ""}
            onClick={() => setTab("versions")}
          >
            ประวัติ / Undo
          </button>
        </div>
      </aside>
      <section className="studio-main">
        <div className="studio-top">
          <span className="eyebrow">YOUR UNIVERSE, YOUR WAY</span>
          <span className="pill">{u.demo ? "DEMO · READ ONLY" : "ADMIN"}</span>
        </div>
        {tab === "overview" ? (
          <>
            <h2>วันนี้อยากสร้างอะไรดี</h2>
            <p className="muted">
              เรื่องราวและรูปลักษณ์ทั้งหมด เริ่มต้นจากตรงนี้
            </p>
            <div className="studio-stats">
              {[
                ["เหตุการณ์", state.events.length],
                ["ความทรงจำ", state.memories.length],
                ["ข้อมูลของตะวัน", state.knowledge.length],
                [
                  "ร่างรอตรวจ",
                  state.changes.filter((c) => c.status === "draft").length,
                ],
              ].map(([l, n]) => (
                <div key={l}>
                  <span>{l}</span>
                  <strong>{n}</strong>
                </div>
              ))}
            </div>
            <button className="studio-feature" onClick={() => setTab("lumi")}>
              <div className="lumi-gem">✦</div>
              <div>
                <h3>บอก LUMI ว่าอยากได้เว็บแบบไหน</h3>
                <p>แก้ทุกหน้า จัดข้อความ ปรับสีและการเคลื่อนไหว พร้อมพรีวิว</p>
              </div>
              <ArrowRight />
            </button>
            <div className="studio-cards">
              <button onClick={() => setTab("pages")}>
                <LayoutTemplate />
                <h3>ออกแบบหน้าเว็บ</h3>
                <p>6 หน้า · ข้อความ · สี · เอฟเฟกต์</p>
              </button>
              <button onClick={() => setTab("knowledge")}>
                <BookOpen />
                <h3>ให้ LUMI รู้จักตะวัน</h3>
                <p>เพิ่มความชอบ เรื่องสำคัญ และที่มาของข้อมูล</p>
              </button>
            </div>
            <p className="notice">
              ระบบอ่านข้อมูลสูงสุด 500 รายการต่อหมวดและประวัติล่าสุด 100
              รายการในหน้าจอนี้ สำรองข้อมูลก่อนลบหรือเปลี่ยนข้อมูลสำคัญ
            </p>
          </>
        ) : tab === "lumi" ? (
          <LumiChat studio />
        ) : tab === "changes" ? (
          <>
            <h2>ข้อเสนอที่รอให้คุณตัดสินใจ</h2>
            <p className="muted">
              Preview ไม่เปลี่ยนเว็บจริง · Apply บันทึกลงฐานข้อมูล · Undo
              อยู่ในประวัติ
            </p>
            {state.changes.length ? (
              state.changes.map((c) => (
                <article className="admin-row change-row" key={c.id}>
                  <div>
                    <span className="pill">
                      {String(c.status)} · {String(c.resource)}
                    </span>
                    <h3>{c.title}</h3>
                    <p>{thaiDate(c.created_at, true)}</p>
                  </div>
                  {c.status === "draft" && (
                    <div className="row-actions">
                      
                      <button
                        onClick={() => {
                          setPreview(c);
                          setViewed((s) => new Set([...s, c.id]));
                        }}
                      >
                        <Eye size={16} /> Preview
                      </button>
                      <button
                        disabled={busy || u.demo || !viewed.has(c.id)}
                        className="primary"
                        onClick={() => void action("apply", c.id)}
                      >
                        Apply
                      </button>
                      <button
                        disabled={busy || u.demo}
                        onClick={() => void action("cancel", c.id)}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  )}
                </article>
              ))
            ) : (
              <Empty
                text="ยังไม่มีร่าง"
                detail="สั่ง LUMI หรือเก็บร่างจากฟอร์ม Studio"
              />
            )}
          </>
        ) : tab === "versions" ? (
          <>
            <h2>ทุกการเปลี่ยนแปลง มีทางย้อนกลับ</h2>
            <p className="muted">
              Undo จะทำได้เมื่อข้อมูลยังตรงกับผลของรายการนั้น เพื่อไม่ทับงานใหม่
            </p>
            {state.versions.length ? (
              state.versions.map((v) => (
                <article className="admin-row" key={v.id}>
                  <div>
                    <span className="eyebrow">{String(v.resource)}</span>
                    <h3>
                      {String(
                        (v.after_data as Row | null)?.title ||
                          (v.before_data as Row | null)?.title ||
                          "การเปลี่ยนแปลง",
                      )}
                    </h3>
                    <p>
                      {new Date(v.created_at).toLocaleString("th-TH", {
                        timeZone: "Asia/Bangkok",
                      })}
                    </p>
                  </div>
                  <button onClick={() => setCompare(v)}>
                    <Eye size={15} /> เปรียบเทียบ
                  </button>
                </article>
              ))
            ) : (
              <Empty />
            )}
          </>
        ) : (
          <>
            <div className="section-title">
              <div>
                <h2>{resourceLabels[tab]}</h2>
                <p className="muted">
                  {tab === "knowledge"
                    ? "บันทึกข้อมูลจริงให้ LUMI ค้นใช้ได้ · ไม่มีการเดาความทรงจำ"
                    : tab === "pages"
                      ? "ข้อความและบรรยากาศสำหรับทุกหน้า · เก็บร่างก่อน Apply"
                      : "ข้อมูลเชื่อมกับหน้าที่เกี่ยวข้องโดยอัตโนมัติ"}
                </p>
              </div>
              <button
                className="primary"
                onClick={() => setEdit({ resource: tab })}
              >
                <Plus size={16} /> เพิ่ม
              </button>
            </div>
            {tab === "media" && (
              <label className="upload-box">
                <Upload /> อัปโหลดภาพ / วิดีโอ / เพลง (สูงสุด 20 MB)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,audio/mpeg"
                  disabled={busy || u.demo}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(file);
                  }}
                />
              </label>
            )}
            {tab === "wishlist" && !!rows.length && (
              <button
                onClick={() => {
                  const active = rows.filter((r) => r.status === "active");
                  if (active.length)
                    setPlan(active[Math.floor(Math.random() * active.length)]);
                  else u.notify("ยังไม่มีไอเดียที่ active");
                }}
              >
                สุ่มสิ่งที่อยากทำ
              </button>
            )}
            {rows.length ? (
              rows.map((r) => (
                <article className="admin-row" key={r.id}>
                  <div>
                    <span className="eyebrow">
                      {String(r.category || r.slug || r.status || r.kind || "")}
                    </span>
                    <h3>{r.title}</h3>
                    <p>
                      {String(
                        r.content || r.description || r.value || "",
                      ).slice(0, 130)}
                    </p>
                    {tab === "media" && !!r.storage_path && (
                      <code className="storage-path">
                        storage://{String(r.storage_path)}
                      </code>
                    )}
                  </div>
                  <div className="row-actions">
                    {tab === "themes" && (
                        <button
                          disabled={busy || u.demo}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              for (const p of state.pages) {
                                await api("mutate", {
                                  draft: true,
                                  title: `Theme: ${r.title} → ${p.title}`,
                                  change: {
                                    resource: "pages",
                                    id: p.id,
                                    expected_revision: p.revision,
                                    action: "save",
                                    patch: {
                                      title: p.title,
                                      slug: p.slug,
                                      config: {
                                        ...pageConfig(p),
                                        accent: r.accent,
                                        glow: Number(r.glow),
                                      },
                                    },
                                  },
                                });
                              }
                              await u.refresh();
                              setTab("changes");
                              u.notify(
                                "สร้างร่างธีมสำหรับทุกหน้าแล้ว ตรวจ Preview ก่อน Apply",
                              );
                            } catch (e) {
                              u.notify(
                                e instanceof Error
                                  ? e.message
                                  : "เตรียมธีมไม่ได้",
                              );
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          เตรียมธีมให้ทุกหน้า
                        </button>
                      )}
                    {tab === "events" &&
                      r.status === "completed" &&
                      !state.memories.some((m) => m.event_id === r.id) && (
                        <button
                          onClick={() =>
                            setEdit({
                              resource: "memories",
                              initial: {
                                title: r.title,
                                story: String(r.description),
                                date: dateKey(String(r.start_at)),
                                event_id: r.id,
                                location: r.location,
                                cover_url: r.cover_url,
                              },
                            })
                          }
                        >
                          สร้างความทรงจำ
                        </button>
                      )}
                    {tab === "wishlist" && r.status === "active" && (
                      <button onClick={() => setPlan(r)}>สร้างแผน</button>
                    )}
                    <button
                      aria-label={`แก้ไข ${r.title}`}
                      onClick={() => setEdit({ resource: tab, row: r })}
                    >
                      <PenLine size={16} />
                    </button>
                    <button
                      aria-label={`ลบ ${r.title}`}
                      disabled={u.demo}
                      onClick={() => setDel(r)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <Empty />
            )}
            {tab === "letters" && (
              <p className="notice">
                แคปซูลที่ยังไม่ถึงเวลาเปิดจะไม่ปรากฏที่นี่
                รวมถึงในประวัติที่มีเนื้อหาล็อกอยู่
              </p>
            )}
          </>
        )}
      </section>
      {edit && <RecordEditor {...edit} onClose={() => setEdit(null)} />}{" "}
      {del && (
        <Modal title={`ลบ “${del.title}” ?`} onClose={() => setDel(null)}>
          <p>
            ข้อมูลจะถูกนำออกจากทุกหน้าที่เกี่ยวข้อง และบันทึกประวัติสำหรับ Undo
          </p>
          <div className="dialog-actions">
            <button onClick={() => setDel(null)}>ยกเลิก</button>
            <button
              className="danger"
              disabled={busy}
              onClick={() => void deleteRecord()}
            >
              ยืนยันลบ
            </button>
          </div>
        </Modal>
      )}
      {preview && (
        <Modal title="Preview · ยังไม่เผยแพร่" onClose={() => setPreview(null)}>
          <ChangePreview change={preview} state={state} />
          <details>
            <summary>ดูรายละเอียดการเปลี่ยนแปลง</summary>
            <pre>{JSON.stringify(preview.patch, null, 2)}</pre>
          </details>
          <div className="dialog-actions">
            <button
              disabled={busy || u.demo}
              className="primary"
              onClick={() => void action("apply", preview.id)}
            >
              Apply การเปลี่ยนแปลงนี้
            </button>
          </div>
        </Modal>
      )}
      {compare && (
        <Modal title="เปรียบเทียบก่อน / หลัง" onClose={() => setCompare(null)}>
          <div className="diff-grid">
            <div>
              <h3>ก่อน</h3>
              <pre>{JSON.stringify(compare.before_data, null, 2)}</pre>
            </div>
            <div>
              <h3>หลัง</h3>
              <pre>{JSON.stringify(compare.after_data, null, 2)}</pre>
            </div>
          </div>
          <button
            className="primary"
            disabled={busy || u.demo}
            onClick={() => void action("undo", compare.id)}
          >
            <Undo2 size={16} /> Undo รายการนี้
          </button>
        </Modal>
      )}
      {plan && (
        <Modal title={`วางแผน: ${plan.title}`} onClose={() => setPlan(null)}>
          <label>
            วันและเวลา (ไทย)
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <button
            className="primary"
            disabled={busy || u.demo || !start}
            onClick={() =>
              void action("plan", plan.id, { start: `${start}:00+07:00` })
            }
          >
            สร้าง Event และเชื่อม Wishlist
          </button>
        </Modal>
      )}
    </div>
  );
}
function ChangePreview({ change, state }: { change: Row; state: State }) {
  const patch = change.patch as Row;
  if (change.resource === "pages") {
    const config = pageConfig({ ...patch } as Row);
    return (
      <div className="preview-window">
        {patch.slug === "home" ? (
          <Home preview={config} state={state} />
        ) : (
          <PageFrame slug={String(patch.slug)} preview={config} state={state}>
            <div className="glass preview-example">
              <h3>รูปแบบส่วนเนื้อหา</h3>
              <p>
                ข้อความและสีในหัวเรื่องด้านบนคือผลของร่างนี้
                เนื้อหาเดิมของหน้าจะยังอยู่
              </p>
            </div>
          </PageFrame>
        )}
      </div>
    );
  }
  if (change.resource === "surprises")
    return (
      <div className="preview-window">
        <Home
          state={{
            ...state,
            surprises: [
              {
                ...patch,
                id: "preview",
                enabled: true,
                start_at: "2000-01-01",
                end_at: "2200-01-01",
              },
            ],
          }}
        />
      </div>
    );
  return (
    <article className="preview-example glass">
      <p className="eyebrow">
        {String(change.resource)} · {String(change.action)}
      </p>
      <h2>{patch.title}</h2>
      <p className="prose">
        {String(patch.content || patch.story || patch.description || "")}
      </p>
      {!!patch.start_at && <p>{thaiDate(String(patch.start_at))}</p>}
    </article>
  );
}
