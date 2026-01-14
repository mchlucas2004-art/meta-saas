import { NextResponse, type NextRequest } from "next/server";
import { ScanSchema } from "@/lib/validate";
import { randomToken } from "@/lib/crypto";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function extFromName(name: string) {
  const parts = name.split(".");
  return (parts[parts.length - 1] || "bin").toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session?.verified) {
      return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 401 });
    }

    // ✅ JSON only
    const body = await req.json();

    const kind = ScanSchema.parse({ kind: body.kind }).kind;
    const blobUrl = String(body.blobUrl || "");
    const originalName = String(body.originalName || "");

    if (!blobUrl || !blobUrl.startsWith("http")) {
      return NextResponse.json({ ok: false, error: "Missing blobUrl" }, { status: 400 });
    }

    // ✅ jobId sans upload serveur
    const jobId = randomToken(12);
    const ext = extFromName(originalName || (kind === "image" ? "image.jpg" : "video.mp4"));

    /**
     * ✅ IMPORTANT:
     * Sur Vercel Serverless, télécharger/ffprobe un gros fichier peut dépasser 60s.
     * Donc on fait un "scan rapide" ici: HEAD + infos de base.
     * Les métadonnées profondes (EXIF complet / vidéo) doivent être faites dans un job plus long
     * (Vercel Pro maxDuration > 60, ou worker externe).
     */
    const head = await fetch(blobUrl, { method: "HEAD" });

    if (!head.ok) {
      return NextResponse.json({ ok: false, error: `Blob HEAD failed (${head.status})` }, { status: 400 });
    }

    const contentType = head.headers.get("content-type") || null;
    const contentLength = head.headers.get("content-length");
    const size = contentLength ? Number(contentLength) : null;

    // ✅ meta minimale, rapide, zéro timeout
    const meta = {
      kind,
      blobUrl,
      originalName: originalName || null,
      contentType,
      size,
      note:
        "Scan rapide (HEAD). Pour metadata complète sur gros fichiers: utiliser un traitement long (Pro/worker).",
    };

    return NextResponse.json({
      ok: true,
      jobId,
      ext,
      meta,
      originalName: originalName || undefined,
      blobUrl,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 400 });
  }
}
