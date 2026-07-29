import { getDatabase } from "@/db";
import { requireAdmin } from "@/lib/admin-auth";
import { ensureDatabase, isAcceptingFeedback } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  await ensureDatabase();
  const db = getDatabase();
  const [participants, organizers, results] = await Promise.all([
    db.prepare("SELECT id, full_name AS fullName, project, sort_order AS sortOrder, is_active AS isActive FROM participants ORDER BY sort_order, full_name").all(),
    db.prepare("SELECT id, full_name AS fullName, is_active AS isActive FROM organizers ORDER BY full_name").all(),
    db.prepare(`
      SELECT p.id, p.full_name AS fullName, p.project,
             COALESCE(SUM(f.likes), 0) AS totalLikes,
             COUNT(DISTINCT f.sender_type || ':' || f.sender_id) AS senderCount
      FROM participants p LEFT JOIN feedback f ON f.recipient_id = p.id
      GROUP BY p.id ORDER BY totalLikes DESC, p.full_name
    `).all(),
  ]);
  return Response.json({
    acceptingFeedback: await isAcceptingFeedback(),
    participants: participants.results.map((row) => ({ ...row, isActive: Boolean(row.isActive) })),
    organizers: organizers.results.map((row) => ({ ...row, isActive: Boolean(row.isActive) })),
    results: results.results.map((row) => ({ ...row, totalLikes: Number(row.totalLikes), senderCount: Number(row.senderCount) })),
  });
}
