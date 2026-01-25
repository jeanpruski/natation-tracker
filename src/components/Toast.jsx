import React from "react";
import { CheckCircle2 } from "lucide-react";

export function Toast({ message }) {
  if (!message) return null;
  return (
    <>
      <style>{`
        @keyframes toast-slide {
          0% { opacity: 0; transform: translate(-50%, -16px); }
          12% { opacity: 1; transform: translate(-50%, 0); }
          85% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -16px); }
        }
      `}</style>
      <div
        className="fixed left-1/2 top-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-lg"
        style={{ animation: "toast-slide 2.4s ease-in-out" }}
      >
        <CheckCircle2 size={16} />
        <span>{message}</span>
      </div>
    </>
  );
}
