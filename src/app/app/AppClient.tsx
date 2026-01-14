"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    // exemple: /app?welcome=1
    const w = sp.get("welcome") === "1";
    setWelcome(w);

    // optionnel : nettoyer l'URL après affichage
    // si tu veux supprimer ?welcome=1 automatiquement
    if (w) {
      const t = setTimeout(() => router.replace("/app"), 1500);
      return () => clearTimeout(t);
    }
  }, [sp, router]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {welcome && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            ✅ Email confirmé. Redirection...
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-xl font-semibold">App</div>
          <div className="mt-2 text-white/60 text-sm">
            MVP : l’app est “débloquée”.
          </div>
        </div>
      </div>
    </div>
  );
}
