import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, verifySession } from "./src/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/app")) {
    const cookie = req.cookies.get(getSessionCookieName())?.value;
    if (!cookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("gated", "1");
      return NextResponse.redirect(url);
    }

    try {
      await verifySession(cookie);
      return NextResponse.next();
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("gated", "1");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*"] };
