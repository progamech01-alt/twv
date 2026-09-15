import { browserDB } from "@/lib/supabase";
import { api } from "./client";
export async function uploadMedia(file: File) {
  const db = browserDB();
  if (!db) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const ext: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "audio/mpeg": "mp3",
    "video/mp4": "mp4",
  };
  if (file.size > 20971520 || !ext[file.type])
    throw new Error("รองรับ JPG, PNG, WebP, MP3, MP4 ขนาดไม่เกิน 20 MB");
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error("กรุณาเข้าสู่ระบบ");
  const path = `${user.id}/${crypto.randomUUID()}.${ext[file.type]}`;
  // Direct-to-storage upload avoids Vercel function body limits. Storage RLS authorizes the user's JWT.
  const { error } = await db.storage
    .from("tawanverse")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("อัปโหลดไม่ได้ ตรวจ bucket และสิทธิ์ผู้ใช้");
  try {
    return await api("mutate", {
      change: {
        resource: "media",
        id: null,
        expected_revision: null,
        action: "save",
        patch: {
          title: file.name.slice(0, 240),
          url: "",
          storage_path: path,
          kind: file.type.split("/")[0],
          alt: file.name.slice(0, 240),
        },
      },
    });
  } catch (e) {
    await db.storage.from("tawanverse").remove([path]);
    throw e;
  }
}
