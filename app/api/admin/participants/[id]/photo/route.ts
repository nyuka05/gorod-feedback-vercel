import { env } from "cloudflare:workers";
import { getD1 } from "@/db";
import { requireAdmin } from "@/lib/admin-auth";
import { cleanText, ensureDatabase } from "@/lib/database";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request); if (denied) return denied;
  await ensureDatabase();
  const { id: rawId } = await context.params;
  const id = cleanText(rawId, 48);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Файл не выбран" }, { status: 400 });
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
    return Response.json({ error: "Нужен JPG/PNG до 5 МБ" }, { status: 400 });
  }
  const extension = file.type === "image/png" ? "png" : "jpg";
  const key = `participants/${id}-${Date.now()}.${extension}`;
  const bucket = (env as unknown as { UPLOADS: R2Bucket }).UPLOADS;
  await bucket.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  await getD1().prepare("UPDATE participants SET photo_key = ? WHERE id = ?").bind(key, id).run();
  return Response.json({ ok: true, photoUrl: `/api/photos/${id}?v=${Date.now()}` });
}
