import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const session = await verifySession(req);

    if (!session?.verified) {
      return NextResponse.json({ verified: false, email: null });
    }

    return NextResponse.json({
      verified: true,
      email: session.email ?? null,
    });
  } catch {
    return NextResponse.json({ verified: false, email: null });
  }
}
