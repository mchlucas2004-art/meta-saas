"use client";

import { useEffect } from "react";

export default function VerifiedPage() {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = "/?resume=1";
    }, 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-black text-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <div className="text-2xl font-semibold">Email validé ✅</div>
        <div className="mt-2 text-sm text-white/70">Redirection vers ton fichier…</div>
      </div>
    </div>
  );
}
