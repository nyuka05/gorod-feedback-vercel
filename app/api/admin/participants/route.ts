import { getD1 } from "@/db";
import { requireAdmin } from "@/lib/admin-auth";
import { cleanText, ensureDatabase, normalizeId } from "@/lib/database";

export async function POST(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  await ensureDatabase();
  const body = await request.json<Record<string, unknown>>();
  const id = normalizeId(body.id, "participant");
  const fullName = cleanText(body.fullName, 120);
  const project = cleanText(body.project, 180);
  const sortOrder = Number(body.sortOrder) || 0;
  if (!fullName || !project) return Response.json({ error: "Укажите ФИ и проект" }, { status: 400 });
  await getD1().prepare("INSERT INTO participants (id, full_name, project, sort_order, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)")
    .bind(id, fullName, project, sortOrder, new Date().toISOString()).run();
  return Response.json({ ok: true, id });
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  await ensureDatabase();
  const body = await request.json<Record<string, unknown>>();
  const id = cleanText(body.id, 48);
  const fullName = cleanText(body.fullName, 120);
  const project = cleanText(body.project, 180);
  const sortOrder = Number(body.sortOrder) || 0;
  const isActive = body.isActive ? 1 : 0;
  if (!id || !fullName || !project) return Response.json({ error: "Некорректные данные" }, { status: 400 });
  await getD1().prepare("UPDATE participants SET full_name = ?, project = ?, sort_order = ?, is_active = ? WHERE id = ?")
    .bind(fullName, project, sortOrder, isActive, id).run();
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  await ensureDatabase();
  const id = cleanText(new URL(request.url).searchParams.get("id"), 48);
  const count = await getD1().prepare("SELECT COUNT(*) AS count FROM feedback WHERE recipient_id = ? OR (sender_type = 'participant' AND sender_id = ?)").bind(id, id).first<{ count: number }>();
  if ((count?.count ?? 0) > 0) {
    await getD1().prepare("UPDATE participants SET is_active = 0 WHERE id = ?").bind(id).run();
    return Response.json({ ok: true, deactivated: true });
  }
  await getD1().prepare("DELETE FROM participants WHERE id = ?").bind(id).run();
  return Response.json({ ok: true, deactivated: false });
}
