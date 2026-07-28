import { getD1 } from "@/db";
import { requireAdmin } from "@/lib/admin-auth";
import { ensureDatabase } from "@/lib/database";

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  await ensureDatabase();
  await getD1().prepare("DELETE FROM feedback").run();
  return Response.json({ ok: true });
}
