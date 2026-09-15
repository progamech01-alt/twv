import { z } from "zod";
import { authorize, readBody, json, failure, AppError } from "@/lib/server";
import { runLumi } from "@/services/ai-service";
export const maxDuration = 90;
export async function POST(req: Request) {
  try {
    const { db, role } = await authorize(req);
    const p = z
      .object({
        command: z.string().min(1).max(3000),
        mode: z.enum(["ask", "create", "edit"]),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().max(4000),
            }),
          )
          .max(8)
          .default([]),
      })
      .safeParse(await readBody(req));
    if (!p.success) throw new AppError("ข้อความยาวเกินไปหรือรูปแบบไม่ถูกต้อง");
    if (p.data.mode !== "ask" && role !== "admin")
      throw new AppError("เฉพาะแอดมินเท่านั้น", 403);
    const { data: allowed, error } = await db.rpc("tv_ai_budget");
    if (error) throw error;
    if (!allowed)
      throw new AppError("พักสักครู่ ส่งได้ไม่เกิน 6 คำสั่งต่อนาที", 429);
    return json(
      await runLumi(db, role, p.data.command, p.data.mode, p.data.history),
    );
  } catch (e) {
    return failure(e);
  }
}
