import { NextResponse } from "next/server";
import { ScanSchema } from "@/lib/validate";
import { randomToken } from "@/lib/crypto";
import { jobInputPath } from "@/lib/storage";
import { scanImage, scanVideo } from "@/lib/metadata";
import fs from "fs";

export const runtime = "nodejs";

function extFromFilename(name: string) {
  const parts = name.split(".");
  return (parts[parts.length - 1] || "bin").toLowerCase();
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const kind = ScanSchema.parse({ kind: form.get("kind") }).kind;
    const file = form.get("file") as File | null;

    if (!file) return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });

    const maxMb = Number(process.env.MAX_FILE_MB || "200");
    if (file.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: `File too large (max ${maxMb}MB)` }, { status: 400 });
    }

    const jobId = randomToken(12);
    const ext = extFromFilename(file.name);
    const inputPath = jobInputPath(jobId, ext);

    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(inputPath, buf);

    const meta = kind === "image" ? await scanImage(inputPath) : await scanVideo(inputPath);

    return NextResponse.json({
      ok: true,
      jobId,
      ext,
      meta,
      originalName: file.name, // ✅
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 400 });
  }
}
