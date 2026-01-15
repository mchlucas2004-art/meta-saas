import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/server";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  let body: HandleUploadBody;

  // Vercel Blob client calls this route with JSON
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  // Require verified session to upload
  const session = await verifySession(request).catch(() => null);
  if (!session?.verified) {
    return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 401 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (pathname: string) => {
        // ✅ allow only common image/video formats
        const lower = pathname.toLowerCase();
        const allowed =
          lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".png") ||
          lower.endsWith(".webp") ||
          lower.endsWith(".heic") ||
          lower.endsWith(".mp4") ||
          lower.endsWith(".mov") ||
          lower.endsWith(".m4v");

        if (!allowed) {
          throw new Error("FILE_TYPE_NOT_ALLOWED");
        }

        // ✅ keep it PUBLIC for now to remove all “private fetch” complexity.
        // You can harden later once everything works.
        return {
          access: "public",
          tokenPayload: JSON.stringify({
            leadId: session.leadId,
            email: session.email,
          }),
        };
      },

      onUploadCompleted: async () => {
        // optional
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
