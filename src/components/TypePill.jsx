import React from "react";
import { PersonStanding, Waves } from "lucide-react";

export function TypePill({ type, children }) {
  const isRun = type === "run";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-medium ring-1 whitespace-nowrap
      ${
        isRun
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20"
          : "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/20"
      }`}
    >
      {isRun ? <PersonStanding size={14} /> : <Waves size={14} />}
      {children}
    </span>
  );
}
