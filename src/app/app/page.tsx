"use client";

import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";

export default function AppHome() {
  const sp = useSearchParams();
  const welcome = sp.get("welcome") === "1";

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 space-y-4">
      {welcome && (
        <Card>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Email confirmé ✅</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Tu as maintenant accès à l’app. Retourne à l’accueil pour uploader et traiter tes fichiers.
          </div>
        </Card>
      )}

      <Card>
        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">App</div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          MVP : l’app est “débloquée”. Dans la V2 on déplacera le flow complet ici si tu veux.
        </div>
      </Card>
    </div>
  );
}
