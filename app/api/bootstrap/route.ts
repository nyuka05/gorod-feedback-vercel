import { getD1 } from "@/db";
import { ensureDatabase, isAcceptingFeedback } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDatabase();
  const db = getD1();
  const participants = await db.prepare(`
    SELECT p.id, p.full_name AS fullName, p.project, p.photo_key AS photoKey,
           p.sort_order AS sortOrder, p.is_active AS isActive,
           COALESCE(SUM(f.likes), 0) AS totalLikes
    FROM participants p
    LEFT JOIN feedback f ON f.recipient_id = p.id
    WHERE p.is_active = 1
    GROUP BY p.id
    ORDER BY p.sort_order, p.full_name
  `).all();
  const participantSenders = await db.prepare(
    "SELECT id, full_name AS fullName FROM participants WHERE is_active = 1 ORDER BY full_name",
  ).all();
  const organizerSenders = await db.prepare(
    "SELECT id, full_name AS fullName FROM organizers WHERE is_active = 1 ORDER BY full_name",
  ).all();

  return Response.json({
    acceptingFeedback: await isAcceptingFeedback(),
    participants: participants.results.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      project: row.project,
      photoUrl: row.photoKey ? `/api/photos/${row.id}` : null,
      sortOrder: Number(row.sortOrder),
      isActive: Boolean(row.isActive),
      totalLikes: Number(row.totalLikes),
    })),
    senders: [
      ...participantSenders.results.map((row) => ({
        id: row.id,
        fullName: row.fullName,
        type: "participant",
        label: row.fullName,
      })),
      ...organizerSenders.results.map((row) => ({
        id: row.id,
        fullName: row.fullName,
        type: "organizer",
        label: `${row.fullName} · Команда Школы`,
      })),
    ],
  });
}
