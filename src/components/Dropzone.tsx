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

  async function scanFile(file: File) {
    setErr(null);
    setBusy(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);

      const res = await fetch("/api/jobs/scan", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Scan failed (${res.status})`);
      }

      const json = (await res.json()) as any;

      // ✅ normalize to always match ScanResult shape (avoids TS + runtime issues)
      const normalized: ScanResult = {
        jobId: String(json.jobId ?? ""),
        ext: String(json.ext ?? ""),
        meta: json.meta ?? {},
        originalName: file?.name,
      };

      if (!normalized.jobId) {
        throw new Error("Réponse API invalide: jobId manquant.");
      }

      onScanned(normalized);
    } catch (e: any) {
      console.error(e);
      setErr("Impossible d’analyser le fichier. Réessaie (ou regarde les logs Vercel).");
    } finally {
      // ✅ CRITICAL: always unlock UI
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
            // allow re-selecting same file
            e.currentTarget.value = "";
          }}
        />
      </div>
    </div>
  );
}
