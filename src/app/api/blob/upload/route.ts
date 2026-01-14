import { NextResponse, type NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Le body est envoyé par @vercel/blob/client (upload(...))
  const body = (await request.json()) as HandleUploadBody;

  try {
    // ✅ on check la session (si ton verifySession attend NextRequest)
    const session = await verifySession(request);
    if (!session?.verified) {
      return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 401 });
    }

    const jsonResponse = await handleUpload({
      body,
      request,

      // ✅ contrôle sécurité: taille + types
      onBeforeGenerateToken: async (pathname: string) => {
        // pathname = nom de fichier
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
          // adapte si tu veux (en bytes)
          maximumSizeInBytes: Number(process.env.MAX_FILE_BYTES || 1024 * 1024 * 1024), // 1GB par défaut
          tokenPayload: JSON.stringify({ pathname }),
        };
      },

      onUploadCompleted: async () => {
        // optionnel: log, etc.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "UPLOAD_FAILED" },
      { status: 400 }
    );
  }
}
