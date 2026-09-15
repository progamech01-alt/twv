import type { Resource } from "@/lib/model";
import { defaultPage } from "@/lib/model";
import { dateKey } from "@/lib/time";
export type Field = {
  key: string;
  label: string;
  type?:
    | "textarea"
    | "date"
    | "datetime"
    | "number"
    | "url"
    | "tags"
    | "checkbox"
    | "select"
    | "relation";
  options?: string[];
  resource?: Resource;
};
const title: Field = { key: "title", label: "ชื่อ / หัวข้อ" };
export const fields: Record<Resource, Field[]> = {
  events: [
    title,
    { key: "description", label: "เรื่องราว", type: "textarea" },
    { key: "start_at", label: "วันเริ่ม (เวลาไทย)", type: "datetime" },
    { key: "end_at", label: "วันสิ้นสุด (ไม่บังคับ)", type: "datetime" },
    {
      key: "type",
      label: "ประเภท",
      type: "select",
      options: [
        "relationship",
        "birthday",
        "trip",
        "memory",
        "plan",
        "letter",
        "capsule",
        "special",
        "custom",
      ],
    },
    {
      key: "status",
      label: "สถานะ",
      type: "select",
      options: [
        "idea",
        "planned",
        "confirmed",
        "happening",
        "completed",
        "cancelled",
      ],
    },
    {
      key: "recurrence",
      label: "ทำซ้ำ",
      type: "select",
      options: ["none", "yearly"],
    },
    { key: "location", label: "สถานที่" },
    { key: "cover_url", label: "URL ภาพปก (HTTPS)", type: "url" },
  ],
  memories: [
    title,
    { key: "story", label: "เรื่องราว", type: "textarea" },
    { key: "date", label: "วันที่", type: "date" },
    { key: "location", label: "สถานที่" },
    { key: "tags", label: "แท็ก (คั่นด้วยจุลภาค)", type: "tags" },
    {
      key: "event_id",
      label: "เหตุการณ์ที่เกี่ยวข้อง",
      type: "relation",
      resource: "events",
    },
    { key: "album_id", label: "อัลบั้ม", type: "relation", resource: "albums" },
    { key: "cover_url", label: "URL ภาพปก", type: "url" },
  ],
  albums: [
    title,
    { key: "description", label: "คำอธิบาย", type: "textarea" },
    { key: "cover_url", label: "URL ภาพปก", type: "url" },
  ],
  media: [
    title,
    { key: "url", label: "URL สื่อ (ถ้าไม่อัปโหลด)", type: "url" },
    { key: "storage_path", label: "Storage path (จากการอัปโหลด)" },
    {
      key: "kind",
      label: "ชนิด",
      type: "select",
      options: ["image", "video", "audio"],
    },
    { key: "alt", label: "ข้อความอธิบายภาพ" },
  ],
  letters: [
    title,
    { key: "content", label: "ข้อความ", type: "textarea" },
    {
      key: "kind",
      label: "ชนิด",
      type: "select",
      options: ["letter", "capsule"],
    },
    { key: "unlock_at", label: "เปิดเมื่อ (แคปซูลต้องระบุ)", type: "datetime" },
  ],
  quick_notes: [title, { key: "content", label: "โน้ต", type: "textarea" }],
  wishlist: [
    title,
    { key: "description", label: "รายละเอียด", type: "textarea" },
    {
      key: "category",
      label: "หมวด",
      type: "select",
      options: [
        "อยากกิน",
        "อยากเที่ยว",
        "อยากซื้อ",
        "อยากลอง",
        "อยากทำด้วยกัน",
      ],
    },
    {
      key: "status",
      label: "สถานะ",
      type: "select",
      options: ["active", "planned", "completed", "archived"],
    },
    {
      key: "event_id",
      label: "เหตุการณ์ที่เชื่อม",
      type: "relation",
      resource: "events",
    },
  ],
  pages: [
    title,
    {
      key: "slug",
      label: "หน้า",
      type: "select",
      options: ["home", "journey", "memories", "time", "letters", "lumi"],
    },
  ],
  themes: [
    title,
    { key: "accent", label: "สีหลัก เช่น #70DAFF" },
    { key: "glow", label: "ความสว่าง (0–1)", type: "number" },
  ],
  music: [
    title,
    { key: "url", label: "URL ไฟล์เสียง HTTPS", type: "url" },
    {
      key: "scene",
      label: "เล่นในหน้า",
      type: "select",
      options: [
        "all",
        "home",
        "journey",
        "memories",
        "time",
        "letters",
        "lumi",
      ],
    },
    { key: "volume", label: "ระดับเสียงเริ่มต้น (0–1)", type: "number" },
  ],
  surprises: [
    title,
    { key: "message", label: "ข้อความ", type: "textarea" },
    { key: "start_at", label: "เริ่ม (เวลาไทย)", type: "datetime" },
    { key: "end_at", label: "สิ้นสุด (เวลาไทย)", type: "datetime" },
    { key: "accent", label: "สีหลัก #hex" },
    { key: "enabled", label: "เปิดใช้งานหลังตรวจพรีวิว", type: "checkbox" },
  ],
  facts: [
    title,
    {
      key: "key",
      label: "ชนิดข้อมูล",
      type: "select",
      options: [
        "relationship_start",
        "first_confession",
        "phat_birthday",
        "tawan_birthday",
        "phat_name",
        "tawan_name",
      ],
    },
    { key: "value", label: "ค่า (วันที่ใช้ YYYY-MM-DD)" },
  ],
  knowledge: [
    title,
    { key: "content", label: "สิ่งที่อยากให้ LUMI รู้", type: "textarea" },
    {
      key: "category",
      label: "หมวด",
      type: "select",
      options: [
        "สิ่งที่ชอบ",
        "สิ่งที่ไม่ชอบ",
        "เรื่องสำคัญ",
        "นิสัยและความชอบ",
        "ขอบเขต",
        "อื่น ๆ",
      ],
    },
    { key: "source", label: "ที่มาของข้อมูล เช่น ตะวันบอกเอง" },
    { key: "tags", label: "คำค้น (คั่นด้วยจุลภาค)", type: "tags" },
  ],
};
export function defaults(resource: Resource): Record<string, unknown> {
  const today = dateKey(),
    now = `${today}T18:00:00+07:00`;
  const data: Record<Resource, Record<string, unknown>> = {
    events: {
      title: "",
      description: "",
      start_at: now,
      end_at: null,
      timezone: "Asia/Bangkok",
      type: "plan",
      status: "planned",
      recurrence: "none",
      location: "",
      cover_url: "",
    },
    memories: {
      title: "",
      story: "",
      date: today,
      location: "",
      tags: [],
      event_id: null,
      album_id: null,
      cover_url: "",
    },
    albums: { title: "", description: "", cover_url: "" },
    media: { title: "", url: "", storage_path: "", kind: "image", alt: "" },
    letters: { title: "", content: "", kind: "letter", unlock_at: null },
    quick_notes: { title: "", content: "" },
    wishlist: {
      title: "",
      description: "",
      category: "อยากทำด้วยกัน",
      status: "active",
      event_id: null,
    },
    pages: { title: "Home", slug: "home", config: defaultPage },
    themes: { title: "", accent: "#70DAFF", glow: 0.6 },
    music: { title: "", url: "", scene: "all", volume: 0.3 },
    surprises: {
      title: "",
      message: "",
      start_at: now,
      end_at: `${today}T23:59:00+07:00`,
      accent: "#70DAFF",
      enabled: false,
    },
    facts: { title: "", key: "relationship_start", value: "" },
    knowledge: {
      title: "",
      content: "",
      category: "เรื่องสำคัญ",
      source: "เจ้าของเว็บไซต์",
      tags: [],
    },
  };
  return data[resource];
}
