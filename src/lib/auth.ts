import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = {
  leadId: string;
  email: string;
  verified: boolean;
};

const COOKIE_NAME = "meta_saas_session";

export function getSessionCookieName() {
  return COOKIE_NAME;
}

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET env var");
  return new TextEncoder().encode(secret);
}

function parseCookieHeader(cookieHeader: string | null) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;

  cookieHeader.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("=") || "");
  });

  return out;
}

/**
 * ✅ sign a JWT session cookie
 */
export async function signSession(payload: SessionPayload) {
  const secret = getSecret();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/**
 * ✅ verifySession can accept:
 * - Request/NextRequest (anything that has headers.get)
 * - OR a token string directly
 *
 * Overloads are IMPORTANT so TypeScript accepts both.
 */
export function verifySession(input: string): Promise<SessionPayload>;
export function verifySession(input: { headers: { get(name: string): string | null } }): Promise<SessionPayload>;
export async function verifySession(
  input: string | { headers: { get(name: string): string | null } }
): Promise<SessionPayload> {
  const secret = getSecret();

  let token: string | null = null;

  if (typeof input === "string") {
    token = input;
  } else {
    const cookieHeader = input.headers.get("cookie");
    const cookies = parseCookieHeader(cookieHeader);
    token = cookies[COOKIE_NAME] || null;
  }

  if (!token) throw new Error("Missing session token");

  const { payload } = await jwtVerify(token, secret);

  const leadId = String((payload as any).leadId || "");
  const email = String((payload as any).email || "");
  const verified = Boolean((payload as any).verified);

  if (!leadId || !email) throw new Error("Invalid session payload");

  return { leadId, email, verified };
}
