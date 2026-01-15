import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET!;
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL!;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: Request) {
  try {
    const session = await verifySession(req).catch(() => null);
    if (!session?.verified) {
      return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 401 });
    }

    const body = await req.json();
    const filename = String(body?.filename || "file.bin");
    const contentType = String(body?.contentType || "application/octet-stream");

    // clé unique => pas de collision + un minimum propre
    const key = `${session.leadId}/${Date.now()}-${safeName(filename)}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    const fileUrl = `${R2_PUBLIC_BASE_URL}/${key}`;

    return NextResponse.json({ uploadUrl, fileUrl });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "UPLOAD_URL_FAILED" },
      { status: 400 }
    );
  }
}
