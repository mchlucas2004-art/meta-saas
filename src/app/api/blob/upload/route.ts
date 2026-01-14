import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const session = await verifySession(request);

    // ✅ Tu peux assouplir si tu veux autoriser upload sans email
    if (!session?.verified) {
      return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 401 });
    }

    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (pathname: string) => {
        // ⚠️ sécurité: limiter types + taille
        // (La vraie limite dépend aussi de ton Blob store / plan)
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
          tokenPayload: JSON.stringify({
            pathname,
            email: session.email,
            leadId: session.leadId,
          }),
        };
      },

      onUploadCompleted: async ({ blob }) => {
        // Ici tu peux log / sauvegarder en DB si tu veux.
        console.log("✅ Blob upload completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Upload token error" },
      { status: 400 }
    );
  }
}
