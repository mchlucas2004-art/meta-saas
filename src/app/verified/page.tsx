"use client";

import { useEffect } from "react";

export default function VerifiedPage() {
  useEffect(() => {
    // go back to home and restore the saved scan
    const t = setTimeout(() => {
      window.location.href = "/?resume=1";
    }, 900);

    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white grid place-items-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        <div className="text-2xl font-semibold">✅ Email confirmé</div>
        <div className="mt-2 text-white/60 text-sm">
          Redirection vers l’app…
        </div>
      </div>
    </div>
  );
}
