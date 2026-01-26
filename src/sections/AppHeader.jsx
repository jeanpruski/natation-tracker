import React from "react";
import { ThemeToggle } from "../components/ThemeToggle";
import { ArrowLeft } from "lucide-react";
import { HEADER_SURFACE_CLASS, HEADER_TOP_PADDING_STYLE } from "../constants/layout";

function TypeSwitch({ value, onChange }) {
  const items = [
    { key: "run", label: "Running" },
    { key: "all", label: "Mixte" },
    { key: "swim", label: "Natation" },
  ];

  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200 dark:bg-slate-800/70 dark:ring-slate-700">
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition
              ${
                active
                  ? "bg-white text-slate-900 shadow ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function RangeSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        appearance-none
        rounded-xl border border-slate-300
        bg-white px-3 py-2 text-sm
        text-slate-900
        dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100
        outline-none focus:ring-2 focus:ring-indigo-500
      "
    >
      <option value="all">Historique complet</option>
      <option value="month">Mois en cours</option>
      <option value="3m">3 Derniers mois</option>
      <option value="6m">6 Derniers mois</option>
      <option value="2026">Année 2026</option>
      <option value="2025">Année 2025</option>
    </select>
  );
}

export function AppHeader({
  range,
  mode,
  isAuth,
  showEditor = true,
  showFilters = true,
  title,
  editorTargetName,
  loggedUserName,
  onOpenEditor,
  onModeChange,
  onRangeChange,
  onBack,
}) {
  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-40
        flex flex-col gap-3
        xl:flex-row xl:items-center xl:justify-between
        ${HEADER_SURFACE_CLASS}
        border-b border-slate-200 dark:border-slate-700
        px-4 xl:px-8 pb-3
      `}
      style={HEADER_TOP_PADDING_STYLE}
    >
      <div className="flex items-center gap-2 w-full xl:w-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="rounded-xl bg-slate-200 px-2.5 py-2 text-sm text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-label="Retour"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
        )}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-slate-900 dark:text-slate-100 flex items-center gap-2 whitespace-nowrap">
          <img src="/big-logo.png" alt="Logo" className="h-9" />
          {/* {title && <span className="text-base sm:text-lg font-semibold">{title}</span>} */}
        </h1>

        <ThemeToggle />

        {showEditor && (
          <button
            onClick={onOpenEditor}
            className={`ml-auto xl:ml-2 rounded-xl px-3 py-2 text-sm transition ${
              isAuth ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-amber-500 text-white hover:bg-amber-400"
            }`}
            title={isAuth ? "Ouvrir l’éditeur" : "Déverrouiller l’édition"}
          >
            <span className="inline-flex items-center gap-1.5">
              {isAuth ? "✏️" : "🔓"}

              <span className="sm:inline">
                {editorTargetName ? ` ${editorTargetName}` : ""}
              </span>
            </span>
          </button>
        )}
      </div>

      {showFilters && (
        <div className="flex items-center justify-between gap-3 xl:hidden">
          <RangeSelect value={range} onChange={onRangeChange} />
          <TypeSwitch value={mode} onChange={onModeChange} />
        </div>
      )}

      {showFilters && (
        <div className="hidden xl:flex items-center justify-end gap-3">
          <RangeSelect value={range} onChange={onRangeChange} />
          <TypeSwitch value={mode} onChange={onModeChange} />
        </div>
      )}
    </header>
  );
}
