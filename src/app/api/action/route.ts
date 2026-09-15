import { z } from "zod";
import { authorize, readBody, json, failure, AppError } from "@/lib/server";
import { UniverseRepository } from "@/repositories/universe";
export async function POST(req: Request) {
  try {
    const { db } = await authorize(req, true);
    const p = z
      .object({
        action: z.enum(["apply", "cancel", "undo", "plan"]),
        id: z.uuid(),
        start: z.iso.datetime({ offset: true }).optional(),
      })
      .safeParse(await readBody(req));
    if (!p.success) throw new AppError("ข้อมูลไม่ถูกต้อง");
    const { action, id, start } = p.data,
      repo = new UniverseRepository(db);
    if (action === "cancel") {
      const { error } = await db
        .from("tv_changes")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("status", "draft");
      if (error) throw error;
      return json({ ok: true });
    }
    if (action === "plan" && !start)
      throw new AppError("เลือกวันสำหรับแผนก่อน");
    return json(
      await repo.rpc(
        action === "apply"
          ? "tv_apply_change"
          : action === "undo"
            ? "tv_restore_version"
            : "tv_plan_wish",
        action === "apply"
          ? { p_id: id }
          : action === "undo"
            ? { p_version: id }
            : { p_id: id, p_start: start },
      ),
    );
  } catch (e) {
    return failure(e);
  }
}
