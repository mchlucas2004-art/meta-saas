import { NextResponse } from "next/server";
import { ScanSchema } from "@/lib/validate";
import { randomToken } from "@/lib/crypto";
import { jobInputPath } from "@/lib/storage";
import { scanImage, scanVideo } from "@/lib/metadata";
import { verifySession } from "@/lib/auth";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function extFromName(name: string) {
  const parts = name.split(".");
  return (parts[parts.length - 1] || "bin").toLowerCase();
}

export async function POST(req: Request) {
  try {
    const session = await verifySession(req).catch(() => null);
    if (!session?.verified) {
      return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 401 });
    }

    const body = await req.json();
    const kind = ScanSchema.parse({ kind: body.kind }).kind;
    const blobUrl = String(body.blobUrl || "");
    const originalName = String(body.originalName || "");
    const ext = String(body.ext || extFromName(originalName || "file.bin"));

    if (!blobUrl) {
      return NextResponse.json({ ok: false, error: "Missing blobUrl" }, { status: 400 });
    }

    const jobId = randomToken(12);
    const inputPath = jobInputPath(jobId, ext);

    // Download blob to local temp file
    const r = await fetch(blobUrl);
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Failed to fetch blob (${r.status}) ${t}` },
        { status: 400 }
      );
    }

    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(inputPath, buf);

    const meta = kind === "image" ? await scanImage(inputPath) : await scanVideo(inputPath);

    return NextResponse.json({
      ok: true,
      jobId,
      ext,
      meta,
      originalName: originalName || undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 400 });
  }
}
