import { NextResponse } from "next/server";
import { ProcessSchema } from "@/lib/validate";
import { jobInputPath, jobOutputPath, cleanupOldJobs } from "@/lib/storage";
import { editImageMetadata, editVideoMetadata, stripImageMetadata, stripVideoMetadata } from "@/lib/metadata";
import fs from "fs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    cleanupOldJobs(Number(process.env.FILE_TTL_MINUTES || "60"));

    const form = await req.formData();
    const jobId = String(form.get("jobId") || "");
    const ext = String(form.get("ext") || "");
    const kind = String(form.get("kind") || "");
    const mode = String(form.get("mode") || "");
    const fieldsRaw = String(form.get("fields") || "{}");

    const parsed = ProcessSchema.parse({ kind, mode, fields: JSON.parse(fieldsRaw) });

    if (!jobId || !ext) {
      return NextResponse.json({ ok: false, error: "Missing jobId/ext" }, { status: 400 });
    }

    const inputPath = jobInputPath(jobId, ext);
    if (!fs.existsSync(inputPath)) {
      return NextResponse.json({ ok: false, error: "Input expired or missing. Re-upload." }, { status: 400 });
    }

    const outExt = ext;
    const outputPath = jobOutputPath(jobId, outExt);

    if (parsed.kind === "image") {
      if (parsed.mode === "strip") await stripImageMetadata(inputPath, outputPath);
      else await editImageMetadata(inputPath, outputPath, parsed.fields || {});
    } else {
      if (parsed.mode === "strip") await stripVideoMetadata(inputPath, outputPath);
      else await editVideoMetadata(inputPath, outputPath, parsed.fields || {});
    }

    return NextResponse.json({
      ok: true,
      downloadUrl: `/api/jobs/download?jobId=${encodeURIComponent(jobId)}&ext=${encodeURIComponent(outExt)}`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 400 });
  }
}
