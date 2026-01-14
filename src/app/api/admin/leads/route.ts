import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.ADMIN_TOKEN || ""}`;

  if (!process.env.ADMIN_TOKEN || token !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, verifiedAt: true, consentMarketing: true, createdAt: true },
  });

  const csv = [
    "email,verifiedAt,consentMarketing,createdAt",
    ...leads.map((l) =>
      [
        l.email,
        l.verifiedAt ? l.verifiedAt.toISOString() : "",
        l.consentMarketing ? "true" : "false",
        l.createdAt.toISOString(),
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="leads.csv"',
      "Cache-Control": "no-store",
    },
  });
}
