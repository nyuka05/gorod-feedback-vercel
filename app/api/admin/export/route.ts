import { getD1 } from "@/db";
import { requireAdmin } from "@/lib/admin-auth";
import { ensureDatabase } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  await ensureDatabase();
  const db = getD1();
  const [results, messages] = await Promise.all([
    db.prepare(`
      SELECT p.id, p.full_name AS participant, p.project,
             COALESCE(SUM(f.likes), 0) AS likes,
             COUNT(DISTINCT f.sender_type || ':' || f.sender_id) AS senderCount
      FROM participants p LEFT JOIN feedback f ON f.recipient_id = p.id
      GROUP BY p.id ORDER BY likes DESC, participant
    `).all(),
    db.prepare(`
      SELECT f.id, f.sender_type AS senderType,
        CASE WHEN f.sender_type = 'organizer' THEN o.full_name ELSE sp.full_name END AS sender,
        rp.full_name AS recipient, rp.project, f.likes, f.message,
        f.created_at AS createdAt, f.updated_at AS updatedAt
      FROM feedback f
      LEFT JOIN participants sp ON f.sender_type = 'participant' AND sp.id = f.sender_id
      LEFT JOIN organizers o ON f.sender_type = 'organizer' AND o.id = f.sender_id
      JOIN participants rp ON rp.id = f.recipient_id
      ORDER BY f.created_at
    `).all(),
  ]);
  return Response.json({ results: results.results, messages: messages.results });
}
