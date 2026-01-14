import fs from "fs";
import path from "path";
import os from "os";

const baseDir = path.join(os.tmpdir(), "meta-saas");

export function ensureBaseDir() {
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
  return baseDir;
}

export function jobDir(jobId: string) {
  ensureBaseDir();
  const dir = path.join(baseDir, jobId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function jobInputPath(jobId: string, ext: string) {
  return path.join(jobDir(jobId), `input.${ext}`);
}

export function jobOutputPath(jobId: string, ext: string) {
  return path.join(jobDir(jobId), `output.${ext}`);
}

export function cleanupOldJobs(ttlMinutes: number) {
  ensureBaseDir();
  const now = Date.now();
  for (const name of fs.readdirSync(baseDir)) {
    const dir = path.join(baseDir, name);
    try {
      const stat = fs.statSync(dir);
      const ageMin = (now - stat.mtimeMs) / 1000 / 60;
      if (ageMin > ttlMinutes) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch {
      // ignore
    }
  }
}
