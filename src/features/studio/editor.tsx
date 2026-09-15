"use client";
import { useState, type FormEvent } from "react";
import { ArrowUp, ArrowDown, Eye, Save } from "lucide-react";
import { Modal } from "@/components/primitives";
import { useUniverse } from "@/components/universe-provider";
import { fields, defaults } from "./fields";
import {
  pageConfig,
  type Resource,
  type Row,
  type PageConfig,
} from "@/lib/model";
import { schemas } from "@/lib/validation";
import { api } from "@/services/client";
import { Home, PageFrame } from "@/features/visitor/pages";
import { dateKey } from "@/lib/time";
export function RecordEditor({
  resource,
  row,
  initial,
  onClose,
}: {
  resource: Resource;
  row?: Row;
  initial?: Record<string, unknown>;
  onClose: () => void;
}) {
  const u = useUniverse();
  const [values, setValues] = useState<Record<string, unknown>>(() =>
      row
        ? Object.fromEntries(
            Object.entries(row).filter(
              ([k]) =>
                !["id", "revision", "created_at", "updated_at"].includes(k),
            ),
          )
        : { ...defaults(resource), ...initial },
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(false);
  const set = (key: string, value: unknown) =>
    setValues((v) => ({ ...v, [key]: value }));
  const save = async (draft: boolean) => {
    if (u.demo) {
      u.notify("บันทึกไม่ได้ในโหมดตัวอย่าง");
      return;
    }
    const parsed = schemas[resource].safeParse(values);
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("\n"),
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("mutate", {
        change: {
          resource,
          id: row?.id ?? null,
          expected_revision: row?.revision ?? null,
          patch: parsed.data,
          action: "save",
        },
        draft,
        title: `Studio: ${values.title}`,
      });
      await u.refresh();
      u.notify(
        draft ? "เก็บร่างแล้ว เปิดแท็บข้อเสนอเพื่อ Apply" : "บันทึกแล้ว",
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่ได้");
    } finally {
      setBusy(false);
    }
  };
  const config = values.config as PageConfig | undefined;
  return (
    <Modal
      title={`${row ? "แก้ไข" : "เพิ่ม"} ${resource === "knowledge" ? "ข้อมูลของตะวัน" : String(values.title || "เรื่องราวใหม่")}`}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(resource === "pages" || resource === "surprises");
        }}
        className="record-form"
      >
        <div className="form-grid">
          {fields[resource].map((f) => {
            const v = values[f.key];
            if (f.type === "checkbox")
              return (
                <label className="check" key={f.key}>
                  <input
                    type="checkbox"
                    checked={!!v}
                    onChange={(e) => set(f.key, e.target.checked)}
                  />
                  {f.label}
                </label>
              );
            return (
              <label key={f.key}>
                {f.label}
                {f.type === "textarea" ? (
                  <textarea
                    rows={5}
                    value={String(v ?? "")}
                    onChange={(e) => set(f.key, e.target.value)}
                    maxLength={12000}
                  />
                ) : f.type === "select" || f.type === "relation" ? (
                  <select
                    value={String(v ?? "")}
                    onChange={(e) => set(f.key, e.target.value || null)}
                  >
                    {f.type === "relation" && (
                      <option value="">ไม่เชื่อม</option>
                    )}
                    {f.type === "select"
                      ? f.options?.map((o) => <option key={o}>{o}</option>)
                      : u.state![f.resource!].map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                  </select>
                ) : f.type === "datetime" ? (
                  <input
                    type="datetime-local"
                    value={
                      v
                        ? new Date(new Date(String(v)).getTime() + 7 * 3600000)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      set(
                        f.key,
                        e.target.value ? `${e.target.value}:00+07:00` : null,
                      )
                    }
                  />
                ) : (
                  <input
                    type={
                      f.type === "tags"
                        ? "text"
                        : f.type === "url"
                          ? "text"
                          : f.type || "text"
                    }
                    step={f.type === "number" ? "0.05" : undefined}
                    value={
                      f.type === "tags"
                        ? (v as string[]).join(", ")
                        : String(v ?? "")
                    }
                    maxLength={
                      f.type === "number" || f.type === "date" ? undefined : 240
                    }
                    onChange={(e) =>
                      set(
                        f.key,
                        f.type === "number"
                          ? Number(e.target.value)
                          : f.type === "tags"
                            ? e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                            : e.target.value,
                      )
                    }
                  />
                )}
              </label>
            );
          })}
        </div>
        {resource === "pages" && config && (
          <PageProperties
            config={config}
            setConfig={(c) => set("config", c)}
            home={values.slug === "home"}
          />
        )}{" "}
        {resource === "letters" && values.kind === "capsule" && (
          <p className="notice">
            หลังบันทึก แคปซูลจะหายจากรายการจนถึงเวลาเปิด
            แม้เป็นแอดมินก็อ่านผ่านเว็บไม่ได้
          </p>
        )}
        {resource === "knowledge" && (
          <p className="tiny muted">
            ข้อมูลนี้ใช้เป็นข้อเท็จจริงสำหรับ LUMI ·
            เขียนเฉพาะข้อมูลที่ทราบจริงและระบุที่มา
          </p>
        )}
        {error && (
          <p className="error prose" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          {(resource === "pages" || resource === "surprises") && (
            <button type="button" onClick={() => setPreview(true)}>
              <Eye size={16} /> Preview
            </button>
          )}
          <button
            type="button"
            disabled={busy || u.demo}
            onClick={() => void save(true)}
          >
            เก็บร่าง
          </button>
          <button className="primary" disabled={busy || u.demo}>
            <Save size={16} />
            {busy
              ? "กำลังบันทึก…"
              : resource === "pages" || resource === "surprises"
                ? "บันทึกร่างเพื่อ Apply"
                : "บันทึก"}
          </button>
        </div>
      </form>
      {preview && (
        <Modal
          title="ตัวอย่าง · ยังไม่เผยแพร่"
          onClose={() => setPreview(false)}
        >
          <div className="preview-window">
            {resource === "pages" && config ? (
              values.slug === "home" ? (
                <Home preview={config} />
              ) : (
                <PageFrame slug={String(values.slug)} preview={config}>
                  <div className="glass preview-example">
                    ตัวอย่างส่วนเนื้อหา · ข้อมูลจริงจะอยู่ใต้หัวเรื่องนี้
                  </div>
                </PageFrame>
              )
            ) : (
              <Home
                state={{
                  ...u.state!,
                  surprises: [
                    {
                      ...row,
                      ...values,
                      id: "preview",
                      revision: 1,
                      created_at: "",
                      updated_at: "",
                      enabled: true,
                      start_at: "2000-01-01",
                      end_at: "2200-01-01",
                    } as Row,
                  ],
                }}
              />
            )}
          </div>
        </Modal>
      )}
    </Modal>
  );
}
export function PageProperties({
  config,
  setConfig,
  home = true,
}: {
  config: PageConfig;
  setConfig: (v: PageConfig) => void;
  home?: boolean;
}) {
  const set = <K extends keyof PageConfig>(key: K, value: PageConfig[K]) =>
    setConfig({ ...config, [key]: value });
  return (
    <section className="page-properties">
      <h3>รูปแบบหน้าเว็บ</h3>
      <div className="form-grid">
        <label>
          ข้อความหลัก
          <textarea
            value={config.hero_title}
            onChange={(e) => set("hero_title", e.target.value)}
            maxLength={240}
          />
        </label>
        <label>
          คำโปรย
          <textarea
            value={config.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            maxLength={1000}
          />
        </label>
        <label>
          สีหลัก
          <input
            type="color"
            value={config.accent}
            onChange={(e) => set("accent", e.target.value)}
          />
        </label>
        <label>
          แสง {config.glow}
          <input
            type="range"
            min="0"
            max="1"
            step=".05"
            value={config.glow}
            onChange={(e) => set("glow", Number(e.target.value))}
          />
        </label>
        <label>
          ขนาดตัวอักษร {config.font_scale}
          <input
            type="range"
            min=".8"
            max="1.3"
            step=".05"
            value={config.font_scale}
            onChange={(e) => set("font_scale", Number(e.target.value))}
          />
        </label>
        <label>
          การเคลื่อนไหว
          <select
            value={config.motion}
            onChange={(e) =>
              set("motion", e.target.value as PageConfig["motion"])
            }
          >
            <option value="full">เต็มรูปแบบ</option>
            <option value="gentle">นุ่มนวล</option>
            <option value="none">ไม่มี</option>
          </select>
        </label>
        <label>
          การจัดข้อความ
          <select
            value={config.alignment}
            onChange={(e) =>
              set("alignment", e.target.value as PageConfig["alignment"])
            }
          >
            <option value="left">ชิดซ้าย</option>
            <option value="center">กึ่งกลาง</option>
          </select>
        </label>
        <label>
          พื้นที่ว่าง
          <select
            value={config.layout}
            onChange={(e) =>
              set("layout", e.target.value as PageConfig["layout"])
            }
          >
            <option value="editorial">โปร่ง</option>
            <option value="compact">กระชับ</option>
          </select>
        </label>
      </div>
      {home && (
        <div className="section-order">
          <h4>ส่วนต่าง ๆ ของหน้า Home</h4>
          {config.sections.map((s, i) => (
            <div key={s}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={!config.hidden.includes(s)}
                  onChange={(e) =>
                    set(
                      "hidden",
                      e.target.checked
                        ? config.hidden.filter((k) => k !== s)
                        : [...config.hidden, s],
                    )
                  }
                />
                {
                  (
                    {
                      today: "วันนี้",
                      upcoming: "เหตุการณ์ถัดไป",
                      memories: "ความทรงจำ",
                      note: "โน้ต",
                    } as Record<string, string>
                  )[s]
                }
              </label>
              <button
                type="button"
                aria-label={`เลื่อน ${s} ขึ้น`}
                disabled={i === 0}
                onClick={() => {
                  const a = [...config.sections];
                  [a[i - 1], a[i]] = [a[i], a[i - 1]];
                  set("sections", a);
                }}
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                aria-label={`เลื่อน ${s} ลง`}
                disabled={i === config.sections.length - 1}
                onClick={() => {
                  const a = [...config.sections];
                  [a[i + 1], a[i]] = [a[i], a[i + 1]];
                  set("sections", a);
                }}
              >
                <ArrowDown size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
