import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await verifySession(req);
    return NextResponse.json({
      verified: !!session?.verified,
      email: session?.email ?? null,
    });
  } catch {
    return NextResponse.json({ verified: false, email: null });
  }
}
