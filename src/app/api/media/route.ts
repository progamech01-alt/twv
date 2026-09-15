import { authorize, json, failure, AppError } from "@/lib/server";
export async function GET(req: Request) {
  try {
    const { db } = await authorize(req);
    const path = new URL(req.url).searchParams.get("path");
    if (!path || path.includes(".."))
      throw new AppError("เส้นทางไฟล์ไม่ถูกต้อง");
    const { data, error } = await db.storage
      .from("tawanverse")
      .createSignedUrl(path, 600);
    if (error) throw error;
    return json(data);
  } catch (e) {
    return failure(e);
  }
}
