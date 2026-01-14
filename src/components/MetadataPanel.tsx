"use client";

import { useMemo, useState } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

function IconButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`grid place-items-center rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/80">
      <path
        d="M9 3h6m-8 4h10m-9 0 1 16h6l1-16M10 11v8m4-8v8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/80">
      <path
        d="M12 3v10m0 0 4-4m-4 4-4-4M4 17v3h16v-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/80">
      <path
        d="M9 18 3 12l6-6M15 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProgressBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="mt-3">
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/3 animate-[slide_1.1s_ease-in-out_infinite] rounded-full bg-white/70" />
      </div>
      <style jsx>{`
        @keyframes slide {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(320%);
          }
        }
      `}</style>
      <div className="mt-2 text-xs text-white/60">Traitement en cours…</div>
    </div>
  );
}

export function MetadataPanel({
  kind,
  scan,
  verified,
  email,
  onNeedEmail,
  onBecameVerified,
  onReset,
}: {
  kind: "image" | "video";
  scan: { jobId: string; ext: string; meta: any; originalName?: string } | null;
  verified: boolean;
  email: string | null;
  onNeedEmail: () => void;
  onBecameVerified: () => void;
  onReset: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const [showRaw, setShowRaw] = useState(false);
  const [lastFields, setLastFields] = useState<{ author: string; title: string; comment: string } | null>(null);

  const rawDisplayed = useMemo(() => {
    if (!scan) return null;
    if (!downloadUrl) return scan.meta;
    return {
      ...scan.meta,
      _applied: lastFields,
      _note: "Metadata affichée: scan initial + champs appliqués (MVP).",
    };
  }, [scan, downloadUrl, lastFields]);

  async function validateAndGenerate() {
    if (!scan) return;

    if (!verified) {
      onNeedEmail();
      return;
    }

    setError(null);
    setLoading(true);
    setDownloadUrl(null);

    const fields = { author, title, comment };
    setLastFields(fields);

    try {
      const fd = new FormData();
      fd.append("jobId", scan.jobId);
      fd.append("ext", scan.ext);
      fd.append("kind", kind);
      fd.append("mode", "edit");
      fd.append("fields", JSON.stringify(fields));

      const res = await fetch("/api/jobs/process", { method: "POST", body: fd });
      const json = await res.json();

      if (res.status === 401 && json?.error === "EMAIL_REQUIRED") {
        onNeedEmail();
        const st = await fetch("/api/auth/status");
        const stj = await st.json();
        if (stj?.verified) onBecameVerified();
        return;
      }

      if (!json.ok) throw new Error(json.error || "Process failed");
      setDownloadUrl(json.downloadUrl);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadNow() {
    if (!downloadUrl) return;
    window.location.href = downloadUrl;
  }

  if (!scan) return null;

  return (
    <Card className="space-y-4">
      {/* ✅ Top: who is connected (email) */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-white/50">Compte</div>
          <div className="text-lg font-semibold text-white">{email || "Connecté"}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          {kind === "image" ? "Image" : "Vidéo"}
        </div>
      </div>

      {/* File card + icons */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-white/50">Fichier</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {scan.originalName || `input.${scan.ext}`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IconButton
              title={downloadUrl ? "Voir metadata (après modif)" : "Voir metadata (raw)"}
              onClick={() => setShowRaw((v) => !v)}
              disabled={loading}
            >
              <CodeIcon />
            </IconButton>

            {!downloadUrl ? (
              <IconButton title="Supprimer ce fichier" onClick={onReset} disabled={loading}>
                <TrashIcon />
              </IconButton>
            ) : (
              <IconButton title="Télécharger" onClick={downloadNow} disabled={loading}>
                <DownloadIcon />
              </IconButton>
            )}
          </div>
        </div>
      </div>

      {/* Fields only before generation */}
      {!downloadUrl && (
        <div className="grid grid-cols-1 gap-2">
          <Input placeholder="Auteur / Artist" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Commentaire" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
      )}

      {/* Primary CTA */}
      <div className="flex flex-wrap items-center gap-2">
        {!downloadUrl ? (
          <Button onClick={validateAndGenerate} disabled={loading || !verified}>
            {loading ? "Traitement..." : "Valider"}
          </Button>
        ) : (
          <Button variant="ghost" onClick={onReset} disabled={loading}>
            Modifier d&apos;autre fichier
          </Button>
        )}
      </div>

      <ProgressBar active={loading} />

      {error && <div className="text-sm text-red-400">{error}</div>}

      {showRaw && (
        <pre className="max-h-64 overflow-auto rounded-xl bg-black/60 p-3 text-xs text-white/80 border border-white/10">
          {JSON.stringify(rawDisplayed, null, 2)}
        </pre>
      )}
    </Card>
  );
}
