"use client";

import { useEffect, useMemo, useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import type { ScanResult } from "@/components/Dropzone";
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

  // ✅ session status
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

  // ✅ restore scan after /verified -> /?resume=1
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

        // clean URL
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

    // si pas vérifié, modal email
    if (!verified) openGate();
  };

  const resetFlow = () => {
    setScan(null);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  };

  // ✅ règle UI :
  // - si pas verified => page ultra simple (upload)
  // - si verified => si scan => interface profil+édition, sinon upload (sans bouton email)
  const showEditor = verified && !!scan;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white text-black grid place-items-center font-black">
              M
            </div>
            <div>
              <div className="text-lg font-semibold">MetaCleaner</div>
              <div className="text-xs text-white/60">Images & vidéos • Privacy-first</div>
            </div>
          </div>

          <div className="text-xs text-white/60">
            {verified ? `✅ ${email || "Connecté"}` : "Email requis"}
          </div>
        </div>

        {/* HERO */}
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

          {/* Upload */}
          {!showEditor && (
            <div className="mt-8">
              <Dropzone
                kind={kind}
                onScanned={onScanned}
                onNeedEmail={openGate}
                verified={verified}
              />
            </div>
          )}

          {/* Editor */}
          {showEditor && (
            <div className="mt-8">
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
        </div>

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
