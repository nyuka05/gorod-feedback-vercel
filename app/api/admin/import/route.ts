import { getD1 } from "@/db";
import { requireAdmin } from "@/lib/admin-auth";
import { cleanText, ensureDatabase, normalizeId } from "@/lib/database";

type ImportRow = Record<string, unknown>;

export async function POST(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  await ensureDatabase();
  const body = await request.json<{ participants?: ImportRow[]; organizers?: ImportRow[] }>();
  const db = getD1();
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [];
  for (const [index, row] of (body.participants ?? []).entries()) {
    const fullName = cleanText(row.fullName ?? row.name ?? row["ФИ"], 120);
    const project = cleanText(row.project ?? row["Проект"] ?? row["Название проекта"], 180);
    if (!fullName || !project) continue;
    const id = normalizeId(row.id ?? row["ID"], "participant");
    const sortOrder = Number(row.sortOrder ?? row["Порядок"]) || index + 1;
    statements.push(db.prepare(`
      INSERT INTO participants (id, full_name, project, sort_order, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET full_name = excluded.full_name, project = excluded.project,
        sort_order = excluded.sort_order, is_active = 1
    `).bind(id, fullName, project, sortOrder, now));
  }
  for (const row of body.organizers ?? []) {
    const fullName = cleanText(row.fullName ?? row.name ?? row["ФИ"], 120);
    if (!fullName) continue;
    const id = normalizeId(row.id ?? row["ID"], "organizer");
    statements.push(db.prepare(`
      INSERT INTO organizers (id, full_name, is_active, created_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET full_name = excluded.full_name, is_active = 1
    `).bind(id, fullName, now));
  }
  if (statements.length) await db.batch(statements);
  return Response.json({ ok: true, imported: statements.length });
}
