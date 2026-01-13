import React from "react";

export function KpiChip({ title, subtitle, icon, value, tone = "default", subtitleClassName = "" }) {
  const isDanger = tone === "danger";
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl px-4 py-3 shadow-sm border w-full min-w-[260px]",
        isDanger
          ? "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-900/40"
          : "border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/60",
      ].join(" ")}
    >
      <div className="hidden sm:flex text-slate-900 dark:text-slate-100">
        {React.cloneElement(icon, { className: "w-5 h-5" })}
      </div>
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-wide text-slate-600 dark:text-slate-300 whitespace-nowrap">{title}</p>
        <p className={["text-[14px] font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap", subtitleClassName].filter(Boolean).join(" ")}>{subtitle}</p>
      </div>
      <div className={["ml-auto text-lg font-bold", isDanger ? "text-rose-700 dark:text-rose-300" : "text-slate-900 dark:text-slate-100"].join(" ")}>
        {value}
      </div>
    </div>
  );
}
