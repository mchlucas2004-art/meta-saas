"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function scan(file: File) {
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", file);

      const res = await fetch("/api/jobs/scan", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Scan failed");

      onScanned({
        jobId: json.jobId,
        ext: json.ext,
        meta: json.meta,
        originalName: json.originalName || file.name,
      });

      // ✅ si pas vérifié, on demande l’email direct
      if (!verified) onNeedEmail();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

      <motion.div
        onDragEnter={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) scan(f);
        }}
        className={`rounded-2xl border border-dashed p-7 text-center transition ${
          drag ? "border-white/40 bg-white/5" : "border-white/15"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={kind === "image" ? "image/*" : "video/*"}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) scan(f);
          }}
        />

        <div className="mx-auto max-w-sm space-y-2">
          <div className="text-xl font-semibold text-white">
            Dépose ton {kind === "image" ? "image" : "vidéo"} ici
          </div>
          <div className="text-sm text-white/60">
            On analyse les métadonnées (GPS, date, appareil, tags…). Suppression auto des fichiers après traitement.
          </div>

          <div className="pt-4 flex justify-center gap-2">
            <Button onClick={() => inputRef.current?.click()} disabled={loading}>
              {loading ? "Analyse..." : "Choisir un fichier"}
            </Button>

            {/* ✅ bouton email seulement si pas vérifié */}
            {!verified && (
              <Button variant="ghost" onClick={onNeedEmail}>
                Débloquer (email)
              </Button>
            )}
          </div>

          {error && <div className="pt-2 text-sm text-red-400">{error}</div>}
        </div>
      </motion.div>
    </Card>
  );
}
