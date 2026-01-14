import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { EmailSchema } from "@/lib/validate";
import { randomToken, sha256 } from "@/lib/crypto";
import { sendVerifyEmail } from "@/lib/mail";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = EmailSchema.parse(body);

    const email = parsed.email.toLowerCase().trim();
    const consentMarketing = !!parsed.consentMarketing;

    const lead = await prisma.lead.upsert({
      where: { email },
      update: { consentMarketing },
      create: { email, consentMarketing },
    });

    const token = randomToken(32);
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await prisma.emailToken.create({
      data: { leadId: lead.id, tokenHash, expiresAt },
    });

    // ✅ IMPORTANT: build a correct base URL in prod (Vercel)
    const origin = new URL(req.url).origin;

    // Option A (garde ton flow actuel): lien vers l'API verify
    const verifyUrl = `${origin}/api/auth/verify?token=${token}`;

    await sendVerifyEmail(email, verifyUrl);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "error" },
      { status: 400 }
    );
  }
}
