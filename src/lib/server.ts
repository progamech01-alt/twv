import "server-only";
import { createClient } from "@supabase/supabase-js";
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function authorize(request: Request, admin = false) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new AppError("กรุณาเข้าสู่ระบบ", 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new AppError("ยังไม่ได้ตั้งค่า Supabase", 503);
  const db = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error,
  } = await db.auth.getUser(token);
  if (error || !user)
    throw new AppError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง", 401);
  const { data: member } = await db
    .from("tv_members")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (!member || (admin && member.role !== "admin"))
    throw new AppError("บัญชีนี้ยังไม่มีสิทธิ์เข้าใช้งาน", 403);
  return { db, user, role: member.role as "admin" | "viewer" };
}
export async function readBody(request: Request) {
  const body = await request.text();
  if (body.length > 32768) throw new AppError("ข้อมูลยาวเกินไป", 413);
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new AppError("รูปแบบข้อมูลไม่ถูกต้อง");
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store, private", Vary: "Authorization" },
  });
}
export function failure(error: unknown) {
  if (error instanceof AppError)
    return json({ error: error.message }, error.status);
  const m = error instanceof Error ? error.message : "";
  if (/CONFLICT|duplicate key/.test(m))
    return json({ error: "ข้อมูลเปลี่ยนไปแล้ว กรุณาโหลดใหม่ก่อนแก้ไข" }, 409);
  return json(
    { error: "ทำรายการไม่สำเร็จ กรุณาลองอีกครั้งหรือตรวจการตั้งค่าฐานข้อมูล" },
    500,
  );
}
