import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await verifySession(req).catch(() => null);
  if (!session?.verified) {
    return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const kind = String(body.kind || "");
    const fileUrl = String(body.fileUrl || "");
    const originalName = String(body.originalName || "");
    const ext = String(body.ext || "bin");

    if (!fileUrl) {
      return NextResponse.json({ ok: false, error: "MISSING_FILE_URL" }, { status: 400 });
    }

    // ✅ Fetch du fichier depuis R2 public base url
    const res = await fetch(fileUrl);
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "FILE_FETCH_FAILED" }, { status: 400 });
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 👉 ici tu gardes ton extraction meta actuelle (EXIFTOOL etc)
    // ex:
    // const meta = await extractMetadata(buffer, kind);

    const meta = {}; // placeholder si tu plug après

    // jobId fictif si tu gères jobs autrement
    const jobId = crypto.randomUUID();

    return NextResponse.json({
      ok: true,
      jobId,
      ext,
      originalName,
      meta,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "SCAN_FAILED" },
      { status: 400 }
    );
  }
}
