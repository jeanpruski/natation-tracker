import React from "react";

export function LoadingScreen({ loadingPhase, forceLoading }) {
  const isFading = loadingPhase === "fading" && !forceLoading;
  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50 dark:from-[#0b1020] dark:via-[#0a1028] dark:to-[#0b1228] flex items-center justify-center ${
        isFading ? "animate-[fade-out_0.5s_ease-in-out_forwards]" : ""
      }`}
    >
      <style>{`
        @keyframes orbit-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fade-out {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes opacity-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(4); }
        }
      `}</style>
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-32 w-32">
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/apple-touch-icon.png"
              alt="NaTrack"
              className={`w-24 h-24 transition-all duration-700 ease-in-out ${
                isFading ? "scale-[10] blur-sm opacity-0" : ""
              }`}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{ transform: "scaleY(0.8) rotate(-75deg)", transformOrigin: "center" }}
          >
            <div
              className="absolute inset-0"
              style={{ animation: "orbit-spin 1.4s linear infinite reverse" }}
              aria-hidden="true"
            >
              <span
                className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2 h-3 w-3 rounded-full blur-[4px] bg-gradient-to-r from-indigo-500 to-emerald-500 dark:from-indigo-300 dark:to-emerald-300"
                style={{ animation: "opacity-pulse 1.4s ease-in-out infinite" }}
              />
            </div>
          </div>
        </div>
        <span className="sr-only">Chargement…</span>
      </div>
    </div>
  );
}
