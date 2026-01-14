import crypto from "crypto";

export type Session = {
  leadId: string;
  email: string;
  verified: boolean;
};

export function getSessionCookieName() {
  return process.env.SESSION_COOKIE_NAME || "meta_saas_session";
}

function base64urlEncode(buf: Buffer) {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64urlDecode(str: string) {
  const pad = 4 - (str.length % 4 || 4);
  const base64 = (str + "=".repeat(pad))
    .replaceAll("-", "+")
    .replaceAll("_", "/");
  return Buffer.from(base64, "base64");
}

function hmacSha256(data: string, secret: string) {
  return base64urlEncode(crypto.createHmac("sha256", secret).update(data).digest());
}

function getCookieFromHeader(cookieHeader: string, name: string) {
  // parsing simple mais fiable
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(name + "=")) return part.slice(name.length + 1);
  }
  return null;
}

/**
 * ✅ Signe une session dans un cookie (format: payload.signature)
 */
export async function signSession(payload: Session) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");

  const json = JSON.stringify(payload);
  const data = base64urlEncode(Buffer.from(json, "utf8"));
  const sig = hmacSha256(data, secret);
  return `${data}.${sig}`;
}

/**
 * ✅ Vérifie la session à partir d'un cookie.
 * IMPORTANT: accepte n'importe quel objet qui a `headers.get()`
 * donc Request, NextRequest, etc.
 */
export async function verifySession(req: { headers: { get(name: string): string | null } }) {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) return null;

    const cookieName = getSessionCookieName();
    const cookieHeader = req.headers.get("cookie") || "";
    const token = getCookieFromHeader(cookieHeader, cookieName);
    if (!token) return null;

    const [data, sig] = token.split(".");
    if (!data || !sig) return null;

    const expected = hmacSha256(data, secret);
    // timing safe compare
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;

    const decoded = base64urlDecode(data).toString("utf8");
    const session = JSON.parse(decoded) as Session;

    if (!session?.leadId || !session?.email) return null;
    return session;
  } catch {
    return null;
  }
}
