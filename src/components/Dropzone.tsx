"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { upload } from "@vercel/blob/client";

export type ScanResult = {
  jobId: string;
  ext: string;
  meta: any;
  originalName?: string;
};

type UploadOptionsCompat = {
  access?: "public" | "private";
  handleUploadUrl: string;
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
    const parts = name.split(".");
    return (parts[parts.length - 1] || "bin").toLowerCase();
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
      // ✅ Upload vers Vercel Blob
      const uploadOpts: UploadOptionsCompat = {
        access: "private",
        handleUploadUrl: "/api/blob/upload",
      };

      // ⚠️ cast minimal pour compat si ton @vercel/blob est pas à jour côté types
      const blob = await upload(file.name, file, uploadOpts as any);

      // ✅ Scan via JSON
      const res = await fetch("/api/jobs/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          blobUrl: blob.url,
          originalName: file.name,
          ext: extFromName(file.name),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Scan failed (${res.status})`);
      }

      const json = (await res.json()) as Partial<ScanResult>;
      if (!json.jobId) throw new Error("Missing jobId from API");

      onScanned({
        jobId: json.jobId,
        ext: json.ext || extFromName(file.name),
        meta: json.meta ?? {},
        originalName: json.originalName || file.name,
      });
    } catch (e: any) {
      console.error(e);

      if (e?.name === "AbortError") {
        setErr("⏳ Timeout: le serveur a mis trop longtemps. Regarde les logs Vercel (scan).");
      } else {
        setErr("Impossible d’analyser le fichier. Regarde les logs Vercel (upload/scan).");
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
