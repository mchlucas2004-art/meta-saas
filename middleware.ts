import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  // Si tu ne protèges aucune route, tu peux carrément supprimer ce middleware.
  // Mais si tu veux protéger /admin par exemple, on le fait proprement.

  const { pathname } = req.nextUrl;

  // ✅ Exemple: protège seulement /admin (adapte si tu veux)
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const session = await verifySession(req);

  if (!session?.verified) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("login", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// ✅ IMPORTANT: matcher seulement les routes qu'on veut protéger
export const config = {
  matcher: ["/admin/:path*"],
};
