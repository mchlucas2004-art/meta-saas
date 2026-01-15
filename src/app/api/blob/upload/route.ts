import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // ✅ protège l’upload (optionnel mais conseillé)
    const session = await verifySession(request);
    if (!session?.verified) {
      return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 401 });
    }

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      request,
      body,

      onBeforeGenerateToken: async (pathname) => {
        // ⚠️ sécurité + taille max autorisée côté token Blob
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif",
            "video/mp4",
            "video/quicktime",
            "video/webm",
          ],
          // Mets une limite haute si tu veux supporter des gros fichiers
          // (le vrai plafond dépend aussi de ton plan Vercel Blob)
          maximumSizeInBytes: 1024 * 1024 * 1024, // 1GB
          tokenPayload: JSON.stringify({
            // tu peux mettre des infos si tu veux
            verified: true,
          }),
        };
      },

      onUploadCompleted: async ({ blob }) => {
        // Juste un log serveur utile
        console.log("✅ Upload completed:", blob.url);
      },
    });

    return NextResponse.json({ ok: true, ...jsonResponse });
  } catch (e: any) {
    console.error("❌ /api/blob/upload error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "UPLOAD_FAILED" },
      { status: 400 }
    );
  }
}
