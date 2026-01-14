import { NextResponse } from "next/server";
import { randomToken } from "@/lib/crypto";
import { ScanSchema } from "@/lib/validate";
import { verifySession } from "@/lib/auth";
import { jobInputPath } from "@/lib/storage";
import { scanImage, scanVideo } from "@/lib/metadata";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function extFromName(name: string) {
  const parts = name.split(".");
  return (parts[parts.length - 1] || "bin").toLowerCase();
}

async function downloadToFile(url: string, outPath: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Blob download failed (${res.status})`);

  const ab = await res.arrayBuffer();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(ab));
}

export async function POST(req: Request) {
  try {
    const session = await verifySession(req);
    if (!session?.verified) {
      return NextResponse.json(
        { ok: false, error: "EMAIL_REQUIRED" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const kind = ScanSchema.parse({ kind: body.kind }).kind;
    const blobUrl = String(body.blobUrl || "");
    const originalName = String(body.originalName || "");

    if (!blobUrl) {
      return NextResponse.json({ ok: false, error: "Missing blobUrl" }, { status: 400 });
    }

    const jobId = randomToken(12);
    const ext = extFromName(originalName || (kind === "image" ? "image.jpg" : "video.mp4"));
    const inputPath = jobInputPath(jobId, ext);

    await downloadToFile(blobUrl, inputPath);

    const meta =
      kind === "image"
        ? await scanImage(inputPath)
        : await scanVideo(inputPath);

    return NextResponse.json({
      ok: true,
      jobId,
      ext,
      meta,
      originalName: originalName || `input.${ext}`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "error" },
      { status: 400 }
    );
  }
}
