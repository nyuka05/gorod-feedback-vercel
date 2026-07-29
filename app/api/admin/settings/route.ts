import { getDatabase } from "@/db";
import { requireAdmin } from "@/lib/admin-auth";
import { ensureDatabase } from "@/lib/database";

export async function PATCH(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  await ensureDatabase();
  const body = await request.json() as { acceptingFeedback?: boolean };
  await getDatabase().prepare("INSERT INTO settings (key, value) VALUES ('accepting_feedback', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(body.acceptingFeedback ? "true" : "false").run();
  return Response.json({ ok: true });
}
