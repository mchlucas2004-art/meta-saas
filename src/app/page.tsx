"use client";

import { useEffect, useMemo, useState } from "react";
import { Dropzone, ScanResult } from "@/components/Dropzone";
import { EmailGateModal } from "@/components/EmailGateModal";
import { MetadataPanel } from "@/components/MetadataPanel";

type SavedScan = {
  kind: "image" | "video";
  scan: ScanResult;
};

const LS_KEY = "meta_saas_last_scan";

export default function Home() {
  const [kind, setKind] = useState<"image" | "video">("image");
  const [scan, setScan] = useState<ScanResult | null>(null);

  const [gateOpen, setGateOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const resume = useMemo(() => {
    if (typeof window === "undefined") return false;
    const url = new URL(window.location.href);
    return url.searchParams.get("resume") === "1";
  }, []);

  const openGate = () => setGateOpen(true);

  async function refreshStatus() {
    try {
      const res = await fetch("/api/auth/status");
      const json = await res.json();
      setVerified(!!json.verified);
      setEmail(json.email || null);
    } catch {
      setVerified(false);
      setEmail(null);
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!resume) return;

    (async () => {
      await refreshStatus();

      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;

        const saved = JSON.parse(raw) as SavedScan;
        setKind(saved.kind);
        setScan(saved.scan);

        const url = new URL(window.location.href);
        url.searchParams.delete("resume");
        window.history.replaceState({}, "", url.pathname);
      } catch {
        // ignore
      }
    })();
  }, [resume]);

  const onScanned = (r: ScanResult) => {
    setScan(r);
    try {
      const payload: SavedScan = { kind, scan: r };
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {}

    if (!verified) openGate();
  };

  const resetFlow = () => {
    setScan(null);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  };

  const showEditor = verified && !!scan;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* ✅ Header: logo only */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white text-black grid place-items-center font-black text-lg">
              M
            </div>
          </div>

          <div className="text-xs text-white/60">
            {verified ? "✅ Connecté" : "Email requis"}
          </div>
        </div>

        {/* ✅ BEFORE VERIFIED or BEFORE FILE: landing marketing */}
        {!showEditor && (
          <div className="mt-10">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              Privacy-first • Auto-suppression • Images & vidéos
            </div>

            <h1 className="mt-5 text-5xl font-semibold leading-tight">
              Nettoie ou modifie les <br />
              métadonnées en 1 clic.
            </h1>

            <p className="mt-4 text-lg text-white/60 max-w-2xl">
              EXIF, GPS, dates, tags… Upload → analyse → nettoyage. Les fichiers sont stockés seulement le temps du
              traitement, puis supprimés automatiquement.
            </p>

            <div className="mt-8 flex gap-3">
              <button
                className={`rounded-2xl px-6 py-3 text-sm font-semibold border transition ${
                  kind === "image"
                    ? "border-white/20 bg-white/10"
                    : "border-white/10 bg-transparent hover:bg-white/5"
                }`}
                onClick={() => setKind("image")}
              >
                Image
              </button>

              <button
                className={`rounded-2xl px-6 py-3 text-sm font-semibold border transition ${
                  kind === "video"
                    ? "border-white/20 bg-white/10"
                    : "border-white/10 bg-transparent hover:bg-white/5"
                }`}
                onClick={() => setKind("video")}
              >
                Vidéo
              </button>
            </div>

            <div className="mt-8">
              <Dropzone kind={kind} onScanned={onScanned} onNeedEmail={openGate} verified={verified} />
            </div>
          </div>
        )}

        {/* ✅ AFTER VERIFIED + FILE: dashboard mode (visually different) */}
        {showEditor && (
          <div className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-white/50">Dashboard</div>
                <div className="text-2xl font-semibold">Modifier les métadonnées</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                {email || "Connecté"}
              </div>
            </div>

            <MetadataPanel
              kind={kind}
              scan={scan}
              verified={verified}
              email={email}
              onNeedEmail={openGate}
              onBecameVerified={() => setVerified(true)}
              onReset={resetFlow}
            />
          </div>
        )}

        <EmailGateModal
          open={gateOpen}
          onClose={async () => {
            setGateOpen(false);
            await refreshStatus();
          }}
        />
      </div>
    </div>
  );
}
