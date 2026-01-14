import { NextResponse } from "next/server";
import { getSessionCookieName, verifySession } from "@/lib/auth";

export const runtime = "nodejs";

function getCookie(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .find((c) => c.startsWith(name + "="));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] || "");
}

export async function GET(req: Request) {
  try {
    const token = getCookie(req, getSessionCookieName());
    if (!token) return NextResponse.json({ verified: false, email: null });

    const session = await verifySession(token);
    return NextResponse.json({ verified: true, email: session.email });
  } catch {
    return NextResponse.json({ verified: false, email: null });
  }
}
