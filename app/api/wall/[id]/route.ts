import { getDatabase } from "@/db";
import { ensureDatabase } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureDatabase();
  const { id } = await context.params;
  const db = getDatabase();
  const participant = await db.prepare(`
    SELECT p.id, p.full_name AS fullName, p.project, p.photo_key AS photoKey,
           COALESCE(SUM(f.likes), 0) AS totalLikes
    FROM participants p
    LEFT JOIN feedback f ON f.recipient_id = p.id
    WHERE p.id = ? AND p.is_active = 1
    GROUP BY p.id
  `).bind(id).first<Record<string, unknown>>();
  if (!participant) return Response.json({ error: "Участник не найден" }, { status: 404 });

  const messages = await db.prepare(`
    SELECT f.id, f.sender_type AS senderType, f.message, f.created_at AS createdAt,
           f.updated_at AS updatedAt,
           CASE WHEN f.sender_type = 'organizer' THEN o.full_name ELSE p.full_name END AS senderName
    FROM feedback f
    LEFT JOIN participants p ON f.sender_type = 'participant' AND p.id = f.sender_id
    LEFT JOIN organizers o ON f.sender_type = 'organizer' AND o.id = f.sender_id
    WHERE f.recipient_id = ? AND LENGTH(TRIM(f.message)) > 0
    ORDER BY f.created_at ASC
  `).bind(id).all();

  return Response.json({
    participant: {
      id: participant.id,
      fullName: participant.fullName,
      project: participant.project,
      photoUrl: participant.photoKey ? `/api/photos/${participant.id}` : null,
      totalLikes: Number(participant.totalLikes),
    },
    messages: messages.results,
  });
}
