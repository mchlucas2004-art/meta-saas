import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "mc_session";

export function getSessionCookieName() {
  return COOKIE_NAME;
}

function getKey() {
  const secret = process.env.SESSION_SECRET || "";
  if (!secret) throw new Error("SESSION_SECRET is missing");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: { leadId: string; email: string; verified: boolean }) {
  const key = getKey();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifySession(token: string): Promise<{ leadId: string; email: string; verified: boolean }> {
  const key = getKey();
  const { payload } = await jwtVerify(token, key);

  const leadId = String(payload.leadId || "");
  const email = String(payload.email || "");
  const verified = Boolean(payload.verified);

  if (!leadId || !email) throw new Error("Invalid session payload");

  return { leadId, email, verified };
}
