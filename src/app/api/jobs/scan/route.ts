import { NextResponse } from "next/server";
import { randomToken } from "@/lib/crypto";
import { ScanSchema } from "@/lib/validate";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function extFromName(name: string) {
  const parts = name.split(".");
  return (parts[parts.length - 1] || "bin").toLowerCase();
}

export async function POST(req: Request) {
  try {
    const session = await verifySession(req);
    if (!session?.verified) {
      return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 401 });
    }

    // ✅ maintenant on reçoit JSON (PAS FormData)
    const body = await req.json();

    const kind = ScanSchema.parse({ kind: body.kind }).kind as "image" | "video";
    const blobUrl = String(body.blobUrl || "");
    const originalName = String(body.originalName || "");

    if (!blobUrl) {
      return NextResponse.json({ ok: false, error: "Missing blobUrl" }, { status: 400 });
    }

    const jobId = randomToken(12);
    const ext = originalName ? extFromName(originalName) : "bin";

    // ✅ Scan “rapide” (évite timeouts)
    // - On ne télécharge pas tout le fichier ici
    // - On fait un HEAD pour récupérer taille/type
    let size = 0;
    let contentType = "";

    try {
      const head = await fetch(blobUrl, { method: "HEAD" });
      if (head.ok) {
        size = Number(head.headers.get("content-length") || "0");
        contentType = head.headers.get("content-type") || "";
      }
    } catch {
      // ignore
    }

    // ⚠️ Pour un scan EXIF complet, il faut télécharger le fichier (et pour la vidéo, ça peut dépasser 60s)
    // On renvoie quand même un meta minimal + l’URL Blob (le reste devra être fait dans /process).
    const meta = {
      blobUrl,
      size,
      contentType,
      note:
        kind === "video"
          ? "Video scan minimal (anti-timeout). Pour un scan complet, il faut un traitement plus long (background/worker)."
          : "Image scan minimal (anti-timeout).",
    };

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
