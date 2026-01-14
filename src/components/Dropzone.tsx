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

  async function uploadToBlob(file: File) {
    // 1) demande une URL d’upload à /api/blob/upload (flow Vercel Blob)
    const res = await fetch("/api/blob/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
      }),
    });

    if (res.status === 401) {
      onNeedEmail();
      throw new Error("EMAIL_REQUIRED");
    }
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Upload init failed (${res.status})`);
    }

    const json = await res.json();
    // handleUpload retourne un objet avec "url" (upload URL) + "blob" après completion selon la version
    // Dans la pratique, on s’appuie sur `json.url` pour PUT le fichier, puis `json.blob.url` OU `json.url` selon lib.
    const uploadUrl = json?.url;
    if (!uploadUrl) throw new Error("Missing upload url from /api/blob/upload");

    // 2) PUT direct vers Vercel Blob
    const put = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "content-type": file.type || "application/octet-stream",
      },
    });

    if (!put.ok) {
      const t = await put.text().catch(() => "");
      throw new Error(t || `Blob PUT failed (${put.status})`);
    }

    // 3) l’URL publique du blob est renvoyée par le header "Location" sur certaines configs,
    // sinon on retombe sur uploadUrl sans query.
    const location = put.headers.get("Location");
    const blobUrl = location || uploadUrl.split("?")[0];

    return blobUrl;
  }

  async function scanFile(file: File) {
    setErr(null);
    setBusy(true);

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 290_000); // ~4m50 (doit être < maxDuration côté serveur)

    try {
      if (!verified) {
        onNeedEmail();
        return;
      }

      // ✅ Upload direct Blob (évite 413)
      const blobUrl = await uploadToBlob(file);

      // ✅ Scan via JSON (évite gros body)
      const res = await fetch("/api/jobs/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          blobUrl,
          originalName: file.name,
        }),
        signal: controller.signal,
      });

      if (res.status === 401) {
        onNeedEmail();
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Scan failed (${res.status})`);
      }

      const json = (await res.json()) as Partial<ScanResult> & { ok?: boolean; error?: string };

      if (json?.ok === false) throw new Error(json.error || "Scan failed");
      if (!json.jobId) throw new Error("Missing jobId from API");

      const safe: ScanResult = {
        jobId: json.jobId,
        ext: json.ext || (kind === "image" ? "jpg" : "mp4"),
        meta: json.meta ?? {},
        originalName: json.originalName || file.name,
      };

      onScanned(safe);
    } catch (e: any) {
      console.error(e);
      if (e?.name === "AbortError") {
        setErr("⏳ Timeout: le scan a pris trop de temps. (vidéo lourde = besoin d’un plan qui autorise >60s)");
      } else if (String(e?.message || "").includes("EMAIL_REQUIRED")) {
        setErr("Email requis pour analyser.");
      } else {
        setErr("Impossible d’analyser le fichier. Regarde les logs Vercel (scan).");
      }
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
