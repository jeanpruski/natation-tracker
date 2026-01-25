import React from "react";

export function BusyOverlay({ open }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-center">
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
  );
}
