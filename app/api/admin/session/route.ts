import { isAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  return Response.json({ authenticated: await isAdmin(request) });
}
