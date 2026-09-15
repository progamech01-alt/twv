import { resources, defaultPage, type State, type Row } from "./model";
export function demoState(): State {
  const stamp = "2030-01-01T00:00:00+07:00";
  const row = (
    id: string,
    title: string,
    extra: Record<string, unknown>,
  ): Row => ({
    id,
    title,
    revision: 1,
    created_at: stamp,
    updated_at: stamp,
    ...extra,
  });
  const data = Object.fromEntries(
    resources.map((r) => [r, [] as Row[]]),
  ) as Record<(typeof resources)[number], Row[]>;
  const config = {
    ...defaultPage,
    hero_title: "โลกเล็ก ๆ\nที่มีเราอยู่ด้วยกัน",
    subtitle:
      "พื้นที่เก็บแสงของวันธรรมดา ให้กลายเป็นเรื่องราวที่อยากย้อนกลับมาอ่าน",
  };
  data.pages = ["home", "journey", "memories", "time", "letters", "lumi"].map(
    (slug, i) => row(`demo-page-${i}`, slug, { slug, config }),
  );
  data.events = [
    row("demo-event", "ตัวอย่าง: คืนที่อยากไปดูดาว", {
      description: "แผนตัวอย่างสำหรับทดลองหน้าตา ไม่ใช่เหตุการณ์จริง",
      start_at: new Date(Date.now() + 3 * 86400000).toISOString(),
      end_at: null,
      timezone: "Asia/Bangkok",
      type: "plan",
      status: "planned",
      recurrence: "none",
      location: "ยังไม่ได้เลือกสถานที่",
      cover_url: "",
    }),
  ];
  data.quick_notes = [
    row("demo-note", "ตัวอย่างโน้ต", {
      content: "บางวันไม่ต้องพิเศษ แค่ได้อยู่ข้างกันก็พอแล้ว — ข้อความตัวอย่าง",
    }),
  ];
  data.letters = [
    row("demo-letter", "ตัวอย่าง: ถึงคนที่ทำให้วันธรรมดาพิเศษ", {
      kind: "letter",
      unlock_at: null,
      content:
        "ตรงนี้จะเป็นพื้นที่สำหรับจดหมายของคุณ ข้อมูลในโหมดนี้เป็นตัวอย่างเท่านั้น",
    }),
  ];
  return {
    ...data,
    versions: [],
    changes: [],
    role: "admin",
    serverTime: new Date().toISOString(),
  };
}
