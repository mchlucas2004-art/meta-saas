import { NextResponse } from "next/server";
import { jobOutputPath, cleanupOldJobs } from "@/lib/storage";
import fs from "fs";
import { getSessionCookieName, verifySession } from "@/lib/auth";

export const runtime = "nodejs";

function getCookie(req: Request, name: string) {
  const cookieHeader = (req.headers.get("cookie") || "").toString();
  const match = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .find((c) => c.startsWith(name + "="));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] || "");
}

export async function GET(req: Request) {
  // ✅ HARD GATE: must be verified
  const sessionToken = getCookie(req, getSessionCookieName());
  if (!sessionToken) {
    return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 401 });
  }
  try {
    await verifySession(sessionToken);
  } catch {
    return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 401 });
  }

  cleanupOldJobs(Number(process.env.FILE_TTL_MINUTES || "60"));

  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId") || "";
  const ext = url.searchParams.get("ext") || "bin";

  const outputPath = jobOutputPath(jobId, ext);
  if (!fs.existsSync(outputPath)) {
    return NextResponse.json({ ok: false, error: "File expired or missing" }, { status: 404 });
  }

  const data = fs.readFileSync(outputPath);

  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="cleaned.${ext}"`,
      "Cache-Control": "no-store",
    },
  });
}
