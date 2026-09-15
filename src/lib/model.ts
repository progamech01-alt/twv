export type Row = {
  id: string;
  title: string;
  revision: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
};
export const resources = [
  "events",
  "memories",
  "albums",
  "media",
  "letters",
  "quick_notes",
  "wishlist",
  "pages",
  "themes",
  "music",
  "surprises",
  "facts",
  "knowledge",
] as const;
export type Resource = (typeof resources)[number];
export type Event = Row & {
  start_at: string;
  end_at: string | null;
  timezone: string;
  type: string;
  status: string;
  recurrence: string;
  description: string;
  location: string;
  cover_url: string;
};
export type Occurrence = Event & { occurs_at: string };
export type PageConfig = {
  subtitle: string;
  hero_title: string;
  accent: string;
  glow: number;
  sections: string[];
  hidden: string[];
  font_scale: number;
  motion: "full" | "gentle" | "none";
  alignment: "left" | "center";
  layout: "editorial" | "compact";
};
export type State = Record<Resource, Row[]> & {
  versions: Row[];
  changes: Row[];
  role: "admin" | "viewer";
  serverTime: string;
};
export type Change = {
  resource: Resource;
  id: string | null;
  expected_revision: number | null;
  patch: Record<string, unknown>;
  action: "save" | "delete";
};
export const defaultPage: PageConfig = {
  hero_title: "ทุกวันของเรา\nคือจักรวาลที่พิเศษ",
  subtitle:
    "เก็บทุกช่วงเวลาไว้ในแสงสีฟ้า แล้วค่อย ๆ เขียนเรื่องราวของเราไปด้วยกัน",
  accent: "#70DAFF",
  glow: 0.6,
  sections: ["today", "upcoming", "memories", "note"],
  hidden: [],
  font_scale: 1,
  motion: "gentle",
  alignment: "left",
  layout: "editorial",
};
export function pageConfig(row?: Row): PageConfig {
  return { ...defaultPage, ...((row?.config as Partial<PageConfig>) || {}) };
}
export const resourceLabels: Record<Resource, string> = {
  events: "Journey / เหตุการณ์",
  memories: "ความทรงจำ",
  albums: "อัลบั้ม",
  media: "คลังสื่อ",
  letters: "จดหมาย / แคปซูล",
  quick_notes: "โน้ตสั้น",
  wishlist: "สิ่งที่อยากทำ",
  pages: "หน้าเว็บ",
  themes: "ธีม",
  music: "เพลง",
  surprises: "เซอร์ไพรส์",
  facts: "ข้อมูลสำคัญ",
  knowledge: "ข้อมูลของตะวัน",
};
