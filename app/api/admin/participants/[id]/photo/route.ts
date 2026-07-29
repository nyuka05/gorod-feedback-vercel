import { del, put } from "@vercel/blob";
import { getDatabase } from "@/db";
import { requireAdmin } from "@/lib/admin-auth";
import { cleanText, ensureDatabase } from "@/lib/database";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  await ensureDatabase();

  const { id: rawId } = await context.params;
  const id = cleanText(rawId, 48);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Файл не выбран" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_PHOTO_BYTES) {
    return Response.json({ error: "Нужен JPG, PNG или WebP до 4 МБ" }, { status: 400 });
  }

  const db = getDatabase();
  const participant = await db
    .prepare("SELECT photo_key AS photoKey FROM participants WHERE id = ?")
    .bind(id)
    .first<{ photoKey: string | null }>();
  if (!participant) {
    return Response.json({ error: "Участник не найден" }, { status: 404 });
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`participants/${id}.${extension}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });

  try {
    await db.prepare("UPDATE participants SET photo_key = ? WHERE id = ?").bind(blob.url, id).run();
  } catch (error) {
    await del(blob.url).catch(() => undefined);
    throw error;
  }

  if (participant.photoKey?.startsWith("https://")) {
    await del(participant.photoKey).catch(() => undefined);
  }

  return Response.json({ ok: true, photoUrl: `/api/photos/${id}?v=${Date.now()}` });
}
