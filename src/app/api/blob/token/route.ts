import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Route désactivée : on n'utilise plus Vercel Blob tokens.
// Upload passe désormais par /api/upload-url (R2 presigned URL).
export async function GET() {
  return NextResponse.json(
    { error: "BLOB_TOKEN_DISABLED_USE_UPLOAD_URL" },
    { status: 410 }
  );
}
