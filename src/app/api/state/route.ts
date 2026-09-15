import { authorize, json, failure } from "@/lib/server";
import { UniverseRepository } from "@/repositories/universe";
export async function GET(req: Request) {
  try {
    const { db, role } = await authorize(req);
    return json(await new UniverseRepository(db).state(role));
  } catch (e) {
    return failure(e);
  }
}
