import { browserDB } from "@/lib/supabase";
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const db = browserDB();
  if (!db) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const {
    data: { session },
  } = await db.auth.getSession();
  if (!session) throw new Error("กรุณาเข้าสู่ระบบ");
  const response = await fetch(`/api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "เชื่อมต่อไม่สำเร็จ");
  return data as T;
}
