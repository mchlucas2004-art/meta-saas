import { NextResponse, type NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session?.verified) {
      return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 401 });
    }

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // ✅ Sécurité + limites (tu peux ajuster)
        const maxMb = Number(process.env.MAX_FILE_MB || "200");
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
          maximumSizeInBytes: maxMb * 1024 * 1024,
          tokenPayload: JSON.stringify({ pathname }),
          // ⚠️ NE PAS mettre `access:` ici → ça dépend des versions, et ça te casse le type
        };
      },
      onUploadCompleted: async () => {
        // Optionnel: logs, analytics, etc.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "upload_error" },
      { status: 400 }
    );
  }
}
