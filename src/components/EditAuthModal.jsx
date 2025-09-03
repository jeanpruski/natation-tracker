import React, { useState } from "react";

export function EditAuthModal({ open, onClose, onValid }) {
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const tryUnlock = async () => {
    setErr("");
    if (!value) { setErr("Veuillez entrer une clé."); return; }
    setBusy(true);
    try {
      await onValid(value);
      onClose();
    } catch {
      setErr("Clé invalide.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">🔒 Déverrouiller l’édition</h3>
        <p className="mb-3 text-[13px] text-slate-600 dark:text-slate-300">
          Entrez la clé d’édition pour activer l’ajout, la modification et la suppression.
        </p>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Clé d’édition"
          disabled={busy}
          className="mb-2 w-full rounded-lg border border-slate-300 bg-white p-1.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
        {err && <p className="mb-2 text-sm text-rose-600 dark:text-rose-400">{err}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-300 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={tryUnlock}
            disabled={busy}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? "Vérification..." : "Déverrouiller"}
          </button>
        </div>
      </div>
    </div>
  );
}

