"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export type ScanResult = {
  jobId: string;
  ext: string;
  meta: any;
  originalName?: string;
};

export function Dropzone({
  kind,
  onScanned,
  onNeedEmail,
  verified,
}: {
  kind: "image" | "video";
  onScanned: (r: ScanResult) => void;
  onNeedEmail: () => void;
  verified: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  function extFromName(name: string) {
    // protège si jamais le nom contient des params (rare mais bon)
    const clean = name.split("?")[0] || name;
    const parts = clean.split(".");
    return (parts[parts.length - 1] || "bin").toLowerCase();
  }

  async function safeText(res: Response) {
    try {
      return await res.text();
    } catch {
      return "";
    }
  }

  async function scanFile(file: File) {
    setErr(null);

    if (!verified) {
      onNeedEmail();
      return;
    }

    setBusy(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);

    try {
      // 1) Demande une URL signée (presigned PUT) + l'URL publique/serving
      const sigRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!sigRes.ok) {
        const t = await safeText(sigRes);
        throw new Error(t || `UPLOAD_URL_FAILED (${sigRes.status})`);
      }

      const data = (await sigRes.json()) as Partial<{
        uploadUrl: string;
        fileUrl: string;
      }>;

      if (!data.uploadUrl || !data.fileUrl) {
        throw new Error("UPLOAD_URL_BAD_RESPONSE (missing uploadUrl/fileUrl)");
      }

      const uploadUrl = data.uploadUrl;
      const fileUrl = data.fileUrl;

      // 2) Upload direct vers R2 (IMPORTANT: signal + timeout)
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
        signal: controller.signal,
      });

      if (!putRes.ok) {
        const t = await safeText(putRes);
        throw new Error(t || `UPLOAD_FAILED (${putRes.status})`);
      }

      // 3) Lance le scan via URL (pas de gros body -> pas de 413)
      const scanRes = await fetch("/api/jobs/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          kind,
          fileUrl,
          originalName: file.name,
          ext: extFromName(file.name),
        }),
      });

      if (!scanRes.ok) {
        const t = await safeText(scanRes);
        throw new Error(t || `SCAN_FAILED (${scanRes.status})`);
      }

      const json = (await scanRes.json()) as Partial<ScanResult>;
      if (!json.jobId) throw new Error("SCAN_BAD_RESPONSE (missing jobId)");

      onScanned({
        jobId: json.jobId,
        ext: json.ext || extFromName(file.name),
        meta: json.meta ?? {},
        originalName: json.originalName || file.name,
      });
    } catch (e: any) {
      console.error(e);

      if (e?.name === "AbortError") {
        setErr("⏳ Timeout : upload ou scan trop long. (Regarde logs Vercel)");
      } else {
        setErr(
          `Impossible d’analyser le fichier. ${e?.message ? `(${e.message})` : ""}`
        );
      }
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="border border-dashed border-white/10 rounded-3xl p-10 text-center">
        <div className="text-2xl font-semibold">
          Dépose ton {kind === "image" ? "image" : "vidéo"} ici
        </div>

        <div className="mt-2 text-white/60">
          On analyse les métadonnées (GPS, date, appareil, tags…).
          <br />
          Suppression auto des fichiers après traitement.
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={pick} disabled={busy} variant="primary">
            {busy ? "Analyse..." : "Choisir un fichier"}
          </Button>

          {!verified && (
            <Button onClick={onNeedEmail} disabled={busy} variant="ghost">
              Débloquer (email)
            </Button>
          )}
        </div>

        {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

        <input
          ref={inputRef}
          type="file"
          accept={kind === "image" ? "image/*" : "video/*"}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            scanFile(f);
            e.currentTarget.value = "";
          }}
        />
      </div>
    </div>
  );
}
