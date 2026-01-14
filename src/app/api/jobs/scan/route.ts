import { NextResponse } from "next/server";
import { ScanSchema } from "@/lib/validate";
import { randomToken } from "@/lib/crypto";
import { jobInputPath } from "@/lib/storage";
import { scanImage, scanVideo } from "@/lib/metadata";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function extFromFilename(name: string) {
  const parts = name.split(".");
  return (parts[parts.length - 1] || "bin").toLowerCase();
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`TIMEOUT_${label}`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const kind = ScanSchema.parse({ kind: form.get("kind") }).kind;
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
    }

    const maxMb = Number(process.env.MAX_FILE_MB || "50"); // ✅ mets 50 par défaut, 200 c'est trop risqué
    if (file.size > maxMb * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: `File too large (max ${maxMb}MB)` },
        { status: 400 }
      );
    }

    const jobId = randomToken(12);
    const ext = extFromFilename(file.name);
    const inputPath = jobInputPath(jobId, ext);

    // ✅ Assure le dossier (utile si jobInputPath change)
    await fs.mkdir(path.dirname(inputPath), { recursive: true });

    // ✅ write file async (évite blocage)
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buf);

    // ✅ timeout scan (sinon ça tourne en boucle côté client)
    const meta =
      kind === "image"
        ? await withTimeout(scanImage(inputPath), 20_000, "SCAN_IMAGE")
        : await withTimeout(scanVideo(inputPath), 20_000, "SCAN_VIDEO");

    return NextResponse.json({
      ok: true,
      jobId,
      ext,
      meta,
      originalName: file.name,
    });
  } catch (e: any) {
    console.error("[/api/jobs/scan] error:", e);

    const msg =
      typeof e?.message === "string" && e.message.startsWith("TIMEOUT_")
        ? "Scan timeout (fichier lourd ou scan trop long)."
        : e?.message || "error";

    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
