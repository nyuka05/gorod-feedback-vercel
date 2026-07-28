import { adminCookie, createAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = await request.json<{ password?: string }>().catch(() => ({}));
  const token = await createAdminSession(request, body.password ?? "");
  if (!token) return Response.json({ error: "Неверный пароль" }, { status: 401 });
  return Response.json({ ok: true }, { headers: { "set-cookie": adminCookie(token, request) } });
}
