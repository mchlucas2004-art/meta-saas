"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { upload } from "@vercel/blob/client";

export type ScanResult = {
  jobId: string;
  ext: string;
  meta: any;
  originalName?: string;
  blobUrl?: string;
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

  async function scanFile(file: File) {
    setErr(null);
    setBusy(true);

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 55_000); // un peu < 60s

    try {
      // ✅ Si pas vérifié, on ouvre l’email gate direct
      if (!verified) {
        onNeedEmail();
        setBusy(false);
        clearTimeout(t);
        return;
      }

      // ✅ 1) Upload vers Vercel Blob (support gros fichiers)
      const blob = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/blob/upload",
      });

      // ✅ 2) Scan (rapide) via blobUrl, JSON
      const res = await fetch("/api/jobs/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          kind,
          blobUrl: blob.url,
          originalName: file.name,
        }),
      });

      if (res.status === 401) {
        onNeedEmail();
        throw new Error("EMAIL_REQUIRED");
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Scan failed (${res.status})`);
      }

      const json = (await res.json()) as any;

      if (!json?.ok) throw new Error(json?.error || "Scan failed");

      const safe: ScanResult = {
        jobId: json.jobId,
        ext: json.ext || (kind === "image" ? "jpg" : "mp4"),
        meta: json.meta ?? {},
        originalName: json.originalName || file.name,
        blobUrl: json.blobUrl || blob.url,
      };

      onScanned(safe);
    } catch (e: any) {
      console.error(e);

      if (e?.name === "AbortError") {
        setErr("⏳ Timeout: le scan a pris trop de temps. Regarde les logs Vercel.");
        return;
      }

      if (String(e?.message || "").includes("EMAIL_REQUIRED")) {
        setErr("Email requis. Ouvre la validation email puis réessaie.");
        return;
      }

      setErr("Impossible d’analyser le fichier. Regarde les logs Vercel.");
    } finally {
      clearTimeout(t);
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
