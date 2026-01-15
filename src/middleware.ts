import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  // If you don't actually need middleware protection, you can remove this file entirely.
  // But if you keep it, verify from the request (NOT a cookie string).
  try {
    await verifySession(req);
    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Put protected routes here if needed.
    // Example: "/admin/:path*"
  ],
};
