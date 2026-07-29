import { getDatabase } from "@/db";
import { requireAdmin } from "@/lib/admin-auth";
import { ensureDatabase } from "@/lib/database";

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  await ensureDatabase();
  await getDatabase().prepare("DELETE FROM feedback").run();
  return Response.json({ ok: true });
}
