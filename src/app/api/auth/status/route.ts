import { NextResponse } from "next/server";
import { getSessionCookieName, verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Option A: just verify from request cookies
    const session = await verifySession(req);
    return NextResponse.json({ verified: !!session.verified, email: session.email });
  } catch {
    return NextResponse.json({ verified: false, email: null });
  }
}
