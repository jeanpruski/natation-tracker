import React, { useEffect, useState } from "react";
import { AddSessionForm } from "../components/AddSessionForm";
import { History } from "../components/History";
import { HEADER_SURFACE_CLASS, HEADER_TOP_PADDING_STYLE } from "../constants/layout";

export function EditModal({
  open,
  onClose,
  isBusy,
  isAuth,
  verifyAndLogin,
  logout,
  sessions,
  onAdd,
  onEdit,
  onDelete,
  onExport,
  onImport,
}) {
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("options"); // options | history

  useEffect(() => {
    if (!open) {
      setToken("");
      setErr("");
      setTab("options");
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await verifyAndLogin(token);
    } catch {
      setErr("Mot de passe invalide");
    }
  };

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const disabledCls = "opacity-60 cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/35" onClick={handleClose} aria-hidden="true" />

      <div className="absolute inset-0">
        <div className="h-full w-full bg-white dark:bg-slate-900">
          <div
            className={`flex items-center justify-between border-b px-4 pb-3 ${HEADER_SURFACE_CLASS} dark:border-slate-700`}
            style={HEADER_TOP_PADDING_STYLE}
          >
            <div className="flex items-center gap-2">
              {isAuth && (
                <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
                  <button
                    onClick={() => setTab("options")}
                    disabled={isBusy}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      tab === "options"
                        ? "bg-white shadow text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-300"
                    } ${isBusy ? disabledCls : ""}`}
                  >
                    Options
                  </button>
                  <button
                    onClick={() => setTab("history")}
                    disabled={isBusy}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      tab === "history"
                        ? "bg-white shadow text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-300"
                    } ${isBusy ? disabledCls : ""}`}
                  >
                    Historique
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isAuth && (
                <button
                  onClick={logout}
                  disabled={isBusy}
                  className={`rounded-xl bg-rose-600 px-3 py-2 text-sm text-white hover:bg-rose-500 ${
                    isBusy ? disabledCls : ""
                  }`}
                  title="Repasser en lecture seule"
                >
                  🔒 <span className="hidden sm:inline">Verrouiller</span>
                </button>
              )}
              <button
                onClick={handleClose}
                disabled={isBusy}
                className={`rounded-xl bg-slate-200 px-3 py-2 text-sm text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 ${
                  isBusy ? disabledCls : ""
                }`}
              >
                Fermer
              </button>
            </div>
          </div>

          <div className="h-[calc(100%-52px)] overflow-auto px-4 pb-10 pt-4 sm:px-6 sm:pb-10 sm:pt-5">
            {!isAuth ? (
              <form onSubmit={submit} className="mx-auto max-w-md space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Entre ton mot de passe pour activer l’édition.
                </p>
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Mot de passe"
                  type="password"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                {err && (
                  <div className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                    {err}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-500"
                >
                  Déverrouiller
                </button>
              </form>
            ) : (
              <div className="mx-auto w-full max-w-5xl">
                {tab === "options" ? (
                  <AddSessionForm onAdd={onAdd} onExport={onExport} onImport={onImport} readOnly={isBusy} />
                ) : (
                  <History sessions={sessions} onDelete={onDelete} onEdit={onEdit} readOnly={isBusy} />
                )}
              </div>
            )}
          </div>

          {isBusy && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <style>{`
                @keyframes orbit-spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes opacity-pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.6; }
                }
              `}</style>
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-32 w-32">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img src="/apple-touch-icon.png" alt="NaTrack" className="w-24 h-24" />
                  </div>
                  <div
                    className="absolute inset-0"
                    style={{ transform: "scaleY(0.7) rotate(-45deg)", transformOrigin: "center" }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ animation: "orbit-spin 1.4s linear infinite reverse" }}
                      aria-hidden="true"
                    >
                      <span
                        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2 h-3 w-3 rounded-full blur-[1px] bg-gradient-to-r from-indigo-500 to-emerald-500 dark:from-indigo-300 dark:to-emerald-300"
                        style={{ animation: "opacity-pulse 1.5s ease-in-out infinite" }}
                      />
                    </div>
                  </div>
                </div>
                <span className="sr-only">Chargement…</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
