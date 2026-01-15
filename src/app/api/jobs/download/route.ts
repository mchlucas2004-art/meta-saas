import { NextResponse } from "next/server";
import fs from "fs";
import { jobOutputPath } from "@/lib/storage";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  // Require session
  const session = await verifySession(req).catch(() => null);
  if (!session?.verified) {
    return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");
  const ext = url.searchParams.get("ext") || "bin";

  if (!jobId) {
    return NextResponse.json({ ok: false, error: "Missing jobId" }, { status: 400 });
  }

  const outPath = jobOutputPath(jobId, ext);
  if (!fs.existsSync(outPath)) {
    return NextResponse.json({ ok: false, error: "File not found" }, { status: 404 });
  }

  const data = fs.readFileSync(outPath);
  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${jobId}.${ext}"`,
    },
  });
}
