"use client";

import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

export function EmailGateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consentMarketing: consent }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed");
      setSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      {!sent ? (
        <div className="space-y-3">
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Débloquer la suite</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Entre ton email pour continuer. On l’utilise aussi pour éviter les abus et garder une expérience clean.
          </div>

          <Input placeholder="ton@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            J’accepte de recevoir des emails (optionnel)
          </label>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex gap-2 pt-2">
            <Button onClick={submit} disabled={loading || !email}>
              {loading ? "Envoi..." : "Recevoir le lien de confirmation"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Email envoyé ✅</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Clique sur le lien dans ton email pour confirmer. Ensuite tu seras redirigé automatiquement vers l’app.
          </div>
          <Button onClick={onClose}>Ok</Button>
        </div>
      )}
    </Modal>
  );
}
