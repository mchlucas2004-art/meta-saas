import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/server";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  // Client calls this with JSON
  const body = (await request.json()) as HandleUploadBody;

  // Require verified session to upload
  const session = await verifySession(request).catch(() => null);
  if (!session?.verified) {
    return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 401 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      // IMPORTANT: limit file types + size here if you want
      onBeforeGenerateToken: async (pathname) => {
        // You can enforce allowed file extensions
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

        return {
          // ✅ Use "public" for now (private complicates fetch). You can harden later.
          access: "public",
          contentType: undefined,
          tokenPayload: JSON.stringify({
            leadId: session.leadId,
            email: session.email,
          }),
        };
      },

      onUploadCompleted: async () => {
        // Optional: log / track uploads
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
