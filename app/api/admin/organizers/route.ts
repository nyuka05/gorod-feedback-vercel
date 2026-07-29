import { getDatabase } from "@/db";
import { requireAdmin } from "@/lib/admin-auth";
import { cleanText, ensureDatabase, normalizeId } from "@/lib/database";

export async function POST(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  await ensureDatabase();
  const body = await request.json() as Record<string, unknown>;
  const id = normalizeId(body.id, "organizer");
  const fullName = cleanText(body.fullName, 120);
  if (!fullName) return Response.json({ error: "Укажите ФИ" }, { status: 400 });
  await getDatabase().prepare("INSERT INTO organizers (id, full_name, is_active, created_at) VALUES (?, ?, 1, ?)")
    .bind(id, fullName, new Date().toISOString()).run();
  return Response.json({ ok: true, id });
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  await ensureDatabase();
  const body = await request.json() as Record<string, unknown>;
  const id = cleanText(body.id, 48);
  const fullName = cleanText(body.fullName, 120);
  await getDatabase().prepare("UPDATE organizers SET full_name = ?, is_active = ? WHERE id = ?")
    .bind(fullName, body.isActive ? 1 : 0, id).run();
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  await ensureDatabase();
  const id = cleanText(new URL(request.url).searchParams.get("id"), 48);
  const count = await getDatabase().prepare("SELECT COUNT(*) AS count FROM feedback WHERE sender_type = 'organizer' AND sender_id = ?").bind(id).first<{ count: number }>();
  if ((count?.count ?? 0) > 0) await getDatabase().prepare("UPDATE organizers SET is_active = 0 WHERE id = ?").bind(id).run();
  else await getDatabase().prepare("DELETE FROM organizers WHERE id = ?").bind(id).run();
  return Response.json({ ok: true });
}
