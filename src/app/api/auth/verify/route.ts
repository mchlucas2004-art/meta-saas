import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sha256 } from "@/lib/crypto";
import { getSessionCookieName, signSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/verify?status=missing", req.url));
  }

  const tokenHash = sha256(token);

  const found = await prisma.emailToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { lead: true },
  });

  if (!found) {
    return NextResponse.redirect(new URL("/verify?status=invalid", req.url));
  }

  await prisma.emailToken.update({
    where: { id: found.id },
    data: { usedAt: new Date() },
  });

  await prisma.lead.update({
    where: { id: found.leadId },
    data: { verifiedAt: found.lead.verifiedAt ?? new Date() },
  });

  const session = await signSession({
    leadId: found.leadId,
    email: found.lead.email,
    verified: true,
  });

  // ✅ redirect local basé sur req.url (évite les bugs APP_URL / domains)
  const res = NextResponse.redirect(new URL("/verified?resume=1", req.url));

  res.cookies.set(getSessionCookieName(), session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
