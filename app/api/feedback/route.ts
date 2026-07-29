import { getDatabase } from "@/db";
import { cleanText, ensureDatabase, isAcceptingFeedback } from "@/lib/database";

export async function PUT(request: Request) {
  await ensureDatabase();
  if (!(await isAcceptingFeedback())) {
    return Response.json({ error: "Приём сообщений завершён" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const senderType = body.senderType === "organizer" ? "organizer" : body.senderType === "participant" ? "participant" : null;
  const senderId = cleanText(body.senderId, 48);
  const recipientId = cleanText(body.recipientId, 48);
  const likes = Number(body.likes);
  const message = cleanText(body.message, 500);
  if (!senderType || !senderId || !recipientId || !Number.isInteger(likes) || likes < 1 || likes > 10) {
    return Response.json({ error: "Проверьте отправителя и количество лайков" }, { status: 400 });
  }

  const db = getDatabase();
  const senderTable = senderType === "organizer" ? "organizers" : "participants";
  const [sender, recipient] = await Promise.all([
    db.prepare(`SELECT id FROM ${senderTable} WHERE id = ? AND is_active = 1`).bind(senderId).first(),
    db.prepare("SELECT id FROM participants WHERE id = ? AND is_active = 1").bind(recipientId).first(),
  ]);
  if (!sender || !recipient) return Response.json({ error: "Отправитель или получатель не найден" }, { status: 404 });

  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO feedback (id, sender_type, sender_id, recipient_id, likes, message, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(sender_type, sender_id, recipient_id)
    DO UPDATE SET likes = excluded.likes, message = excluded.message, updated_at = excluded.updated_at
  `).bind(crypto.randomUUID(), senderType, senderId, recipientId, likes, message, now, now).run();

  return Response.json({ ok: true });
}
