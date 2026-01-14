// src/lib/storage.ts
import path from "path";
import fs from "fs";

const BASE_DIR =
  process.env.VERCEL
    ? "/tmp/meta-saas" // ✅ seul endroit writable sur Vercel
    : path.join(process.cwd(), ".tmp-meta-saas");

function ensureBaseDir() {
  if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });
}

export function jobInputPath(jobId: string, ext: string) {
  ensureBaseDir();
  return path.join(BASE_DIR, `${jobId}.${ext}`);
}

export function jobOutputPath(jobId: string, ext: string) {
  ensureBaseDir();
  return path.join(BASE_DIR, `${jobId}.out.${ext}`);
}
