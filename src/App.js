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
  Download,
  Moon,
  Sun,
  Trash2,
  RefreshCcw,
  Plus,
} from "lucide-react";

// Clés localStorage
const LOCAL_STORAGE_KEY = "swim_sessions";

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
// Dark mode simple
// -------------------------
function useTheme() {
  const [isDark, setIsDark] = useLocalStorage("theme_dark", false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return { isDark, toggleTheme };
}

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-xl bg-slate-200 px-3 py-2 text-sm font-medium text-slate-800 shadow hover:bg-slate-300 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {isDark ? "Clair" : "Sombre"}
    </button>
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
        <span className="text-sm text-slate-700 dark:text-slate-300">
          Métrage (m)
        </span>
        <input
          type="number"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          placeholder="ex: 1000"
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white/80 p-2 text-slate-900 shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>

      {useCustomDate && (
        <label className="flex flex-col">
          <span className="text-sm text-slate-700 dark:text-slate-300">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white/80 p-2 text-slate-900 shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
      )}

      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
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
    return (
      <p className="text-sm text-slate-500 dark:text-slate-300">
        Aucune donnée encore.
      </p>
    );

  return (
    <div className="h-72 w-full text-slate-800 dark:text-slate-100">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeOpacity={0.15} strokeDasharray="3 3" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: "currentColor" }}
            stroke="currentColor"
          />
          <YAxis
            tick={{ fill: "currentColor" }}
            stroke="currentColor"
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,.1)",
              backgroundColor: "rgba(255,255,255,0.9)",
              color: "#000",
            }}
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
function History({ sessions, onDelete, onEdit }) {
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editDistance, setEditDistance] = useState("");
  const perPage = 5;

  if (!sessions.length) return null;

  // Tri décroissant par date
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Pagination
  const totalPages = Math.ceil(sorted.length / perPage);
  const startIndex = (page - 1) * perPage;
  const currentData = sorted.slice(startIndex, startIndex + perPage);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const startEdit = (session) => {
    setEditId(session.id);
    setEditDate(session.date);
    setEditDistance(session.distance);
  };

  const saveEdit = () => {
    onEdit(editId, { date: editDate, distance: Number(editDistance) });
    setEditId(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
      <table className="w-full text-left">
        <thead className="bg-slate-50/70 text-slate-600 dark:bg-white/5 dark:text-slate-300">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Métrage (m)</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
          {currentData.map((s) => (
            <tr
              key={s.id}
              className="hover:bg-slate-50/60 dark:hover:bg-white/5"
            >
              <td className="px-4 py-3 text-slate-700 dark:text-slate-100">
                {editId === s.id ? (
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white p-1 text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
                  />
                ) : (
                  dayjs(s.date).format("DD-MM-YYYY")
                )}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                {editId === s.id ? (
                  <input
                    type="number"
                    value={editDistance}
                    onChange={(e) => setEditDistance(e.target.value)}
                    className="w-20 rounded-lg border border-slate-300 bg-white p-1 text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
                  />
                ) : (
                  s.distance
                )}
              </td>
              <td className="px-4 py-3 text-right flex justify-end gap-2">
                {editId === s.id ? (
                  <>
                    <button
                      onClick={saveEdit}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
                    >
                      Sauver
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="rounded-lg bg-slate-400 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-500"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(s)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => onDelete(s.id)}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-500"
                    >
                      Supprimer
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800">
        <button
          onClick={goPrev}
          disabled={page === 1}
          className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 disabled:opacity-50"
        >
          ◀ Précédent
        </button>
        <span className="text-sm text-slate-600 dark:text-slate-300">
          Page {page} sur {totalPages}
        </span>
        <button
          onClick={goNext}
          disabled={page === totalPages}
          className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 disabled:opacity-50"
        >
          Suivant ▶
        </button>
      </div>
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

  const editSession = (id, updated) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-white px-4 py-8 dark:from-[#0b1020] dark:via-[#0a1028] dark:to-[#0b1228]">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 dark:text-slate-100">
            🏊‍♂️ Suivi Natation
          </h1>
          <ThemeToggle />
        </header>

        {/* Form & Filters */}
        <section className="rounded-3xl bg-white/70 p-5 shadow-lg ring-1 ring-black/5 backdrop-blur dark:bg-white/5 dark:ring-white/10">
          <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
            📘 Options
          </h2>
          <AddSessionForm onAdd={addSession} />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            {/* <div className="flex items-center gap-3">
              <label className="text-slate-700 dark:text-slate-300">Filtrer par date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white/80 px-3 py-2 shadow-inner dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                onClick={resetFilter}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-200/80 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
              >
                <RefreshCcw size={16} /> Réinitialiser
              </button>
            </div> */}

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
        <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
            📈 Graphique
          </h2>
          <SwimChart sessions={filteredSessions} />
        </section>

        {/* History */}
        <section className="rounded-3xl bg-white/70 p-5 shadow-lg ring-1 ring-black/5 backdrop-blur dark:bg-white/5 dark:ring-white/10">
          <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
            📋 Historique
          </h2>
          <History sessions={filteredSessions} onDelete={deleteSession} onEdit={editSession} />
        </section>
      </div>
    </div>
  );
}
