import { Suspense } from "react";
import AppClient from "./AppClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white grid place-items-center">
          <div className="text-white/60 text-sm">Chargement…</div>
        </div>
      }
    >
      <AppClient />
    </Suspense>
  );
}
