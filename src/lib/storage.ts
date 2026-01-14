cleanupOldJobs();
// src/lib/storage.ts
import fs from "fs";
import path from "path";

const BASE_DIR = process.env.JOBS_DIR || "/tmp/meta-saas";

// Ensure base dir exists
function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export function jobDir(jobId: string) {
  const dir = path.join(BASE_DIR, jobId);
  ensureDir(dir);
  return dir;
}

export function jobInputPath(jobId: string, ext: string) {
  const dir = jobDir(jobId);
  return path.join(dir, `input.${ext}`);
}

export function jobOutputPath(jobId: string, ext: string) {
  const dir = jobDir(jobId);
  return path.join(dir, `output.${ext}`);
}

/**
 * Delete old job folders/files in /tmp to avoid filling ephemeral storage.
 * default: 6 hours
 */
export function cleanupOldJobs(maxAgeMs: number = 1000 * 60 * 60 * 6) {
  try {
    ensureDir(BASE_DIR);

    const now = Date.now();
    const entries = fs.readdirSync(BASE_DIR, { withFileTypes: true });

    for (const ent of entries) {
      const full = path.join(BASE_DIR, ent.name);

      let stat: fs.Stats;
      try {
        stat = fs.statSync(full);
      } catch {
        continue;
      }

      const age = now - stat.mtimeMs;
      if (age < maxAgeMs) continue;

      // remove old dir/file
      try {
        if (stat.isDirectory()) fs.rmSync(full, { recursive: true, force: true });
        else fs.rmSync(full, { force: true });
      } catch {
        // ignore cleanup errors
      }
    }
  } catch {
    // ignore cleanup errors
  }
}
