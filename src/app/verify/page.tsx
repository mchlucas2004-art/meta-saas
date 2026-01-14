"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";

export default function VerifiedPage() {
  useEffect(() => {
    const t = setTimeout(() => {
      // ✅ on retourne sur la home et on force l’ouverture de l’éditeur si un fichier est en attente
      window.location.href = "/?resume=1";
    }, 1200);

    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-zinc-50 dark:bg-black p-6">
      <Card className="max-w-md w-full space-y-2 text-center">
        <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Email validé ✅</div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Parfait. Redirection vers l’accueil…
        </div>
      </Card>
    </div>
  );
}
