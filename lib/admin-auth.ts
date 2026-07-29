const COOKIE_NAME = "school_admin";
const WEEK = 60 * 60 * 24 * 7;

type Secrets = {
  password: string | null;
  sessionSecret: string | null;
};

function getSecrets(request: Request): Secrets {
  const hostname = new URL(request.url).hostname;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const allowLocalDefaults = process.env.NODE_ENV !== "production" && isLocal;
  return {
    password: process.env.ADMIN_PASSWORD || (allowLocalDefaults ? "admin" : null),
    sessionSecret: process.env.ADMIN_SESSION_SECRET || (allowLocalDefaults ? "local-development-secret" : null),
  };
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(signature));
}

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export async function createAdminSession(request: Request, password: string) {
  const secrets = getSecrets(request);
  if (!secrets.password || !secrets.sessionSecret || password !== secrets.password) return null;
  const expires = Math.floor(Date.now() / 1000) + WEEK;
  const payload = `admin.${expires}`;
  const signature = await sign(payload, secrets.sessionSecret);
  return `${payload}.${signature}`;
}

export async function isAdmin(request: Request) {
  const token = readCookie(request, COOKIE_NAME);
  const secrets = getSecrets(request);
  if (!token || !secrets.sessionSecret) return false;
  const [role, expiresText, signature] = token.split(".");
  const expires = Number(expiresText);
  if (role !== "admin" || !signature || !Number.isFinite(expires) || expires < Date.now() / 1000) return false;
  const expected = await sign(`${role}.${expiresText}`, secrets.sessionSecret);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return mismatch === 0;
}

export async function requireAdmin(request: Request) {
  if (await isAdmin(request)) return null;
  return Response.json({ error: "Требуется вход в административную часть" }, { status: 401 });
}

export function adminCookie(token: string, request?: Request) {
  const secure = !request || new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${WEEK}${secure}`;
}

export function clearAdminCookie(request?: Request) {
  const secure = !request || new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}
