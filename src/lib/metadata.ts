import { spawn } from "child_process";
import fs from "fs";

function run(cmd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const p = spawn(cmd, args);
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += d.toString()));
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("close", (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
}

export async function scanImage(filePath: string) {
  const res = await run("exiftool", ["-json", "-G", "-a", "-s", filePath]);
  if (res.code !== 0) throw new Error(res.stderr || "exiftool failed");
  const json = JSON.parse(res.stdout);
  return json?.[0] ?? {};
}

export async function stripImageMetadata(input: string, output: string) {
  const res = await run("exiftool", ["-all=", "-o", output, input]);
  if (res.code !== 0) throw new Error(res.stderr || "exiftool strip failed");
  if (!fs.existsSync(output)) throw new Error("Output not created");
}

export async function editImageMetadata(input: string, output: string, fields: any) {
  const args = ["-o", output];
  if (fields?.author) args.push(`-Artist=${fields.author}`);
  if (fields?.title) args.push(`-Title=${fields.title}`);
  if (fields?.comment) args.push(`-Comment=${fields.comment}`);
  if (fields?.dateTimeOriginal) args.push(`-DateTimeOriginal=${fields.dateTimeOriginal}`);
  args.push(input);

  const res = await run("exiftool", args);
  if (res.code !== 0) throw new Error(res.stderr || "exiftool edit failed");
  if (!fs.existsSync(output)) throw new Error("Output not created");
}

export async function scanVideo(filePath: string) {
  const res = await run("ffprobe", [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);
  if (res.code !== 0) throw new Error(res.stderr || "ffprobe failed");
  return JSON.parse(res.stdout);
}

export async function stripVideoMetadata(input: string, output: string) {
  const res = await run("ffmpeg", ["-y", "-i", input, "-map_metadata", "-1", "-c", "copy", output]);
  if (res.code !== 0) throw new Error(res.stderr || "ffmpeg strip failed");
  if (!fs.existsSync(output)) throw new Error("Output not created");
}

export async function editVideoMetadata(input: string, output: string, fields: any) {
  const args = ["-y", "-i", input, "-c", "copy"];
  if (fields?.title) args.push("-metadata", `title=${fields.title}`);
  if (fields?.comment) args.push("-metadata", `comment=${fields.comment}`);
  if (fields?.author) args.push("-metadata", `artist=${fields.author}`);
  args.push(output);

  const res = await run("ffmpeg", args);
  if (res.code !== 0) throw new Error(res.stderr || "ffmpeg edit failed");
  if (!fs.existsSync(output)) throw new Error("Output not created");
}
