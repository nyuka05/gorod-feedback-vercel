import { getDatabase } from "@/db";
import { ensureDatabase } from "@/lib/database";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureDatabase();
  const { id } = await context.params;
  const row = await getDatabase()
    .prepare("SELECT photo_key AS photoKey FROM participants WHERE id = ?")
    .bind(id)
    .first<{ photoKey: string | null }>();
  if (!row?.photoKey?.startsWith("https://")) return new Response(null, { status: 404 });
  return Response.redirect(row.photoKey, 302);
}
