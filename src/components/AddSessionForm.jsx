import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import { CalendarDays, Download, Plus } from "lucide-react";

export function AddSessionForm({ onAdd, onExport, readOnly }) {
  const [distance, setDistance] = useState("");
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));

  const submit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!distance || isNaN(distance)) return;
    const finalDate = useCustomDate ? date : dayjs().format("YYYY-MM-DD");
    await onAdd({ id: uuidv4(), distance: Number(distance), date: finalDate });
    setDistance(""); setUseCustomDate(false);
  };

  const disabledCls = "opacity-60 cursor-not-allowed";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <label className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-inner dark:border-slate-700 dark:bg-slate-800/80">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-600 group-hover:text-slate-800 dark:text-slate-300 dark:group-hover:text-slate-100">Métrage (m)</span>
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="ex: 1000"
            disabled={readOnly}
            className={`mt-1 w-full rounded-xl bg-transparent p-1.5 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 dark:placeholder:text-slate-400 ${readOnly ? disabledCls : ""}`}
          />
        </label>
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-inner dark:border-slate-700 dark:bg-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">Date personnalisée</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">Utilise aujourd’hui si désactivé</span>
            </div>
            <button
              type="button"
              onClick={() => !readOnly && setUseCustomDate((v) => !v)}
              disabled={readOnly}
              className={`relative inline-flex h-6 w-10 items-center rounded-full transition ${useCustomDate ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"} ${readOnly ? disabledCls : ""}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${useCustomDate ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          {useCustomDate && (
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={readOnly}
                className={`mt-1 w-full rounded-xl bg-transparent p-1.5 pr-9 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 ${readOnly ? disabledCls : ""}`}
              />
              <CalendarDays size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300 pointer-events-none" />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={readOnly}
          className={`inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 ${readOnly ? disabledCls : ""}`}
        >
          <Plus size={14} /> Ajouter la séance
        </button>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          <Download size={16} /> Exporter en CSV
        </button>
      </div>
    </form>
  );
}

