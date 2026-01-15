import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const payload = await verifySession(req);
    return NextResponse.json({ verified: true, email: payload.email });
  } catch {
    return NextResponse.json({ verified: false, email: null });
  }
}
