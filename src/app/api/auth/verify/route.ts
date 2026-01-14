import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sha256 } from "@/lib/crypto";
import { getSessionCookieName, signSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (!token) return NextResponse.redirect(`${appUrl}/verify?status=missing`);

  const tokenHash = sha256(token);

  const found = await prisma.emailToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    include: { lead: true },
  });

  if (!found) return NextResponse.redirect(`${appUrl}/verify?status=invalid`);

  await prisma.emailToken.update({ where: { id: found.id }, data: { usedAt: new Date() } });

  await prisma.lead.update({
    where: { id: found.leadId },
    data: { verifiedAt: found.lead.verifiedAt ?? new Date() },
  });

  const session = await signSession({ leadId: found.leadId, email: found.lead.email, verified: true });

  // ✅ redirect to /verified
  const res = NextResponse.redirect(`${appUrl}/verified`);
  res.cookies.set(getSessionCookieName(), session, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
