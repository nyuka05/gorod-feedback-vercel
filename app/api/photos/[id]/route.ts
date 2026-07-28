import { env } from "cloudflare:workers";
import { getD1 } from "@/db";
import { ensureDatabase } from "@/lib/database";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureDatabase();
  const { id } = await context.params;
  const row = await getD1().prepare("SELECT photo_key AS photoKey FROM participants WHERE id = ?").bind(id).first<{ photoKey: string | null }>();
  if (!row?.photoKey) return new Response(null, { status: 404 });
  const bucket = (env as unknown as { UPLOADS: R2Bucket }).UPLOADS;
  const object = await bucket.get(row.photoKey);
  if (!object) return new Response(null, { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=3600");
  return new Response(object.body, { headers });
}
