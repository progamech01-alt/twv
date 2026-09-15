import { z } from "zod";
import { resources } from "./model";
const text = z.string().max(12000),
  short = z.string().max(240),
  url = z.union([
    z.literal(""),
    z.string().regex(/^storage:\/\/[a-zA-Z0-9/_\-.]+$/),
    z
      .url()
      .refine(
        (v) => v.startsWith("https://"),
        "ใช้ HTTPS หรือ storage:// เท่านั้น",
      ),
  ]);
const base = { title: short.min(1) };
const dt = z.iso.datetime({ offset: true });
const page = z
  .object({
    hero_title: short,
    subtitle: z.string().max(1000),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    glow: z.number().min(0).max(1),
    sections: z
      .array(z.enum(["today", "upcoming", "memories", "note"]))
      .max(4)
      .refine((v) => new Set(v).size === v.length),
    hidden: z.array(z.enum(["today", "upcoming", "memories", "note"])).max(4),
    font_scale: z.number().min(0.8).max(1.3),
    motion: z.enum(["full", "gentle", "none"]),
    alignment: z.enum(["left", "center"]),
    layout: z.enum(["editorial", "compact"]),
  })
  .strict();
export const schemas = {
  events: z
    .object({
      ...base,
      description: text,
      start_at: dt,
      end_at: dt.nullable(),
      timezone: z.literal("Asia/Bangkok"),
      type: z.enum([
        "relationship",
        "birthday",
        "trip",
        "memory",
        "plan",
        "letter",
        "capsule",
        "special",
        "custom",
      ]),
      status: z.enum([
        "idea",
        "planned",
        "confirmed",
        "happening",
        "completed",
        "cancelled",
      ]),
      recurrence: z.enum(["none", "yearly"]),
      location: short,
      cover_url: url,
    })
    .strict()
    .refine(
      (v) => !v.end_at || new Date(v.end_at) >= new Date(v.start_at),
      "วันสิ้นสุดต้องอยู่หลังวันเริ่ม",
    ),
  memories: z
    .object({
      ...base,
      story: text,
      date: z.iso.date(),
      location: short,
      tags: z.array(short).max(20),
      event_id: z.uuid().nullable(),
      album_id: z.uuid().nullable(),
      cover_url: url,
    })
    .strict(),
  albums: z.object({ ...base, description: text, cover_url: url }).strict(),
  media: z
    .object({
      ...base,
      url,
      storage_path: short,
      kind: z.enum(["image", "video", "audio"]),
      alt: short,
    })
    .strict(),
  letters: z
    .object({
      ...base,
      content: text,
      kind: z.enum(["letter", "capsule"]),
      unlock_at: dt.nullable(),
    })
    .strict()
    .refine(
      (v) => v.kind !== "capsule" || v.unlock_at !== null,
      "แคปซูลต้องมีวันเปิด",
    ),
  quick_notes: z.object({ ...base, content: text }).strict(),
  wishlist: z
    .object({
      ...base,
      category: z.enum([
        "อยากกิน",
        "อยากเที่ยว",
        "อยากซื้อ",
        "อยากลอง",
        "อยากทำด้วยกัน",
      ]),
      description: text,
      status: z.enum(["active", "planned", "completed", "archived"]),
      event_id: z.uuid().nullable(),
    })
    .strict(),
  pages: z
    .object({
      ...base,
      slug: z.enum(["home", "journey", "memories", "time", "letters", "lumi"]),
      config: page,
    })
    .strict(),
  themes: z
    .object({
      ...base,
      accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      glow: z.number().min(0).max(1),
    })
    .strict(),
  music: z
    .object({
      ...base,
      url,
      scene: z.enum([
        "all",
        "home",
        "journey",
        "memories",
        "time",
        "letters",
        "lumi",
      ]),
      volume: z.number().min(0).max(1),
    })
    .strict(),
  surprises: z
    .object({
      ...base,
      message: text,
      start_at: dt,
      end_at: dt,
      enabled: z.boolean(),
      accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    })
    .strict()
    .refine(
      (v) => new Date(v.end_at) > new Date(v.start_at),
      "วันสิ้นสุดต้องอยู่หลังวันเริ่ม",
    ),
  facts: z
    .object({
      ...base,
      key: z.enum([
        "relationship_start",
        "first_confession",
        "phat_birthday",
        "tawan_birthday",
        "phat_name",
        "tawan_name",
      ]),
      value: short,
    })
    .strict()
    .refine(
      (v) => v.key.endsWith("_name") || z.iso.date().safeParse(v.value).success,
      "วันที่ต้องเป็น YYYY-MM-DD ที่ถูกต้อง",
    ),
  knowledge: z
    .object({
      ...base,
      content: text,
      category: z.enum([
        "สิ่งที่ชอบ",
        "สิ่งที่ไม่ชอบ",
        "เรื่องสำคัญ",
        "นิสัยและความชอบ",
        "ขอบเขต",
        "อื่น ๆ",
      ]),
      source: short,
      tags: z.array(short).max(20),
    })
    .strict(),
};
export const changeSchema = z
  .object({
    resource: z.enum(resources),
    id: z.uuid().nullable(),
    expected_revision: z.number().int().positive().nullable(),
    patch: z.record(z.string(), z.unknown()),
    action: z.enum(["save", "delete"]),
  })
  .strict()
  .superRefine((v, ctx) => {
    if ((v.id === null) !== (v.expected_revision === null))
      ctx.addIssue({ code: "custom", message: "Missing revision" });
    if (v.action === "delete" && !v.id)
      ctx.addIssue({ code: "custom", message: "Missing id" });
    if (v.action === "save") {
      const r = schemas[v.resource].safeParse(v.patch);
      if (!r.success)
        ctx.addIssue({
          code: "custom",
          message: r.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        });
    }
  });
