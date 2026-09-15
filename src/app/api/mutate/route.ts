import { z } from "zod";
import { authorize, readBody, json, failure, AppError } from "@/lib/server";
import { changeSchema } from "@/lib/validation";
import { UniverseRepository } from "@/repositories/universe";
export async function POST(req: Request) {
  try {
    const { db } = await authorize(req, true);
    const parsed = z
      .object({
        change: changeSchema,
        draft: z.boolean().default(false),
        title: z.string().max(240).default("Studio edit"),
      })
      .safeParse(await readBody(req));
    if (!parsed.success)
      throw new AppError(parsed.error.issues.map((i) => i.message).join("; "));
    const repo = new UniverseRepository(db);
    return json(
      parsed.data.draft
        ? await repo.draft(parsed.data.change, parsed.data.title)
        : await repo.mutate(parsed.data.change),
    );
  } catch (e) {
    return failure(e);
  }
}
