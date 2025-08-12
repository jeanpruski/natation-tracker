// App.js – Suivi Natation (React + Tailwind v3 + Recharts)
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Calendar,
  Download,
  Moon,
  Sun,
  Trash2,
  RefreshCcw,
  Plus,
} from "lucide-react";

// Clés localStorage
const LOCAL_STORAGE_KEY = "swim_sessions";
const THEME_KEY = "theme";

// -------------------------
// Hook LocalStorage
// -------------------------
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (e) {
      console.error("localStorage read error", e);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("localStorage write error", e);
    }
  }, [key, value]);

  return [value, setValue];
}

// -------------------------
// Export CSV
// -------------------------
function downloadCSV(filename, rows) {
  const headers = ["Date", "Métrage (m)"];
  const csv = [headers, ...rows.map((r) => [r.date, r.distance])]
    .map((r) =>
      r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// -------------------------
// Dark mode
// -------------------------
function useTheme() {
  const [mode, setMode] = useLocalStorage(THEME_KEY, "system");

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark = mode === "dark" || (mode === "system" && prefersDark);
    root.classList.toggle("dark", isDark);
  }, [mode]);

  return { mode, setMode };
}

function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const options = [
    { key: "light", icon: <Sun size={16} />, label: "Clair" },
    { key: "system", icon: <Calendar size={16} />, label: "Système" },
    { key: "dark", icon: <Moon size={16} />, label: "Sombre" },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-white/60 px-1 py-1 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-white/5 dark:ring-white/10">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => setMode(o.key)}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition ${
            mode === o.key
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// -------------------------
// Formulaire ajout séance
// -------------------------
function AddSessionForm({ onAdd }) {
  const [distance, setDistance] = useState("");
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));

  const submit = (e) => {
    e.preventDefault();
    if (!distance || isNaN(distance)) return;
    const finalDate = useCustomDate ? date : dayjs().format("YYYY-MM-DD");
    onAdd({ id: uuidv4(), distance: Number(distance), date: finalDate });
    setDistance("");
    setUseCustomDate(false);
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <label className="flex flex-col">
        <span className="text-sm text-slate-600 dark:text-slate-300">
          Métrage (m)
        </span>
        <input
          type="number"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          placeholder="ex: 1000"
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white/80 p-2 text-slate-900 shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-50"
        />
      </label>

      {useCustomDate && (
        <label className="flex flex-col">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white/80 p-2 text-slate-900 shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-50"
          />
        </label>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={useCustomDate}
          onChange={(e) => setUseCustomDate(e.target.checked)}
        />
        <span>Choisir une date personnalisée</span>
      </div>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white shadow transition hover:bg-indigo-500"
      >
        <Plus size={16} /> Ajouter
      </button>
    </form>
  );
}

// -------------------------
// Graphique
// -------------------------
function SwimChart({ sessions }) {
  const data = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((s) => ({ ...s, dateLabel: dayjs(s.date).format("DD/MM") }));
  }, [sessions]);

  if (!data.length)
    return <p className="text-sm text-slate-500">Aucune donnée encore.</p>;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeOpacity={0.15} strokeDasharray="3 3" />
          <XAxis dataKey="dateLabel" />
          <YAxis />
          <Tooltip
            labelFormatter={() => "Séance"}
            formatter={(v, _n, p) => [v + " m", p.payload.date]}
          />
          <Line
            type="monotone"
            dataKey="distance"
            stroke="rgb(99 102 241)"
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// -------------------------
// Historique
// -------------------------
function History({ sessions, onDelete }) {
  if (!sessions.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
      <table className="w-full text-left">
        <thead className="bg-slate-50/70 text-slate-500 dark:bg-white/5 dark:text-slate-300">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Métrage (m)</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
          {sessions.map((s) => (
            <tr
              key={s.id}
              className="hover:bg-slate-50/60 dark:hover:bg-white/5"
            >
              <td className="px-4 py-3">{s.date}</td>
              <td className="px-4 py-3 font-semibold">{s.distance}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onDelete(s.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-rose-500"
                >
                  <Trash2 size={16} /> Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// -------------------------
// App principale
// -------------------------
export default function App() {
  const [sessions, setSessions] = useLocalStorage(LOCAL_STORAGE_KEY, []);
  const [filterDate, setFilterDate] = useState("");

  const filteredSessions = filterDate
    ? sessions.filter((s) => s.date === filterDate)
    : sessions;

  const addSession = (payload) => setSessions((prev) => [...prev, payload]);
  const deleteSession = (id) =>
    setSessions((prev) => prev.filter((s) => s.id !== id));
  const resetFilter = () => setFilterDate("");
  const exportCSV = () => downloadCSV("natation_sessions.csv", sessions);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-white px-4 py-8 dark:from-[#0b1020] dark:via-[#0a1028] dark:to-[#0b1228]">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            📘 Suivi Natation
          </h1>
          <ThemeToggle />
        </header>

        {/* Form & Filters */}
        <section className="rounded-3xl bg-white/70 p-5 shadow-lg ring-1 ring-black/5 backdrop-blur dark:bg-white/5 dark:ring-white/10">
          <AddSessionForm onAdd={addSession} />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <label>Filtrer par date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white/80 px-3 py-2 shadow-inner dark:border-white/10 dark:bg-white/10"
              />
              <button
                onClick={resetFilter}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-200/80 px-3 py-2 text-sm font-medium dark:bg-white/10"
              >
                <RefreshCcw size={16} /> Réinitialiser
              </button>
            </div>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500"
            >
              <Download size={16} /> Exporter CSV
            </button>
          </div>
        </section>

        {/* Chart */}
        <section className="rounded-3xl bg-white/70 p-5 shadow-lg ring-1 ring-black/5 backdrop-blur dark:bg-white/5 dark:ring-white/10">
          <SwimChart sessions={filteredSessions} />
        </section>

        {/* History */}
        <section className="rounded-3xl bg-white/70 p-5 shadow-lg ring-1 ring-black/5 backdrop-blur dark:bg-white/5 dark:ring-white/10">
          <h2 className="mb-3 text-xl font-semibold">📋 Historique</h2>
          <History sessions={filteredSessions} onDelete={deleteSession} />
        </section>
      </div>
    </div>
  );
}
