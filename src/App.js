// App.js – Suivi Natation (React + Tailwind v3 + Recharts)
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { v4 as uuidv4 } from "uuid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  Download,
  Moon,
  Sun,
  Plus,
  CalendarDays,
  Calculator,
} from "lucide-react";

dayjs.locale("fr");

// =========================
// LocalStorage helper
// =========================
const LOCAL_STORAGE_KEY = "swim_sessions";

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
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

// =========================
/* CSV Export */
// =========================
function downloadCSV(filename, rows) {
  const headers = ["Date", "Métrage (m)"];
  const csv = [headers, ...rows.map((r) => [r.date, r.distance])]
    .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// =========================
/* Dark mode (switch manuel) */
// =========================
function useTheme() {
  const [isDark, setIsDark] = useLocalStorage("theme_dark", false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);
  return { isDark, toggleTheme: () => setIsDark((v) => !v) };
}

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-xl bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900 shadow hover:bg-slate-300 dark:bg-slate-700/70 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {isDark ? "Clair" : "Sombre"}
    </button>
  );
}

// =========================
/* Formulaire (Options) */
// =========================
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
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Distance */}
        <label className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-inner transition hover:bg-white dark:border-slate-700 dark:bg-slate-800/80">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-600 group-hover:text-slate-800 dark:text-slate-300">
            Métrage (m)
          </span>
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="ex: 1000"
            className="mt-1 w-full rounded-xl bg-transparent p-2 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 dark:placeholder:text-slate-400"
          />
        </label>

        {/* Date perso */}
        {useCustomDate && (
          <label className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-inner transition hover:bg-white dark:border-slate-700 dark:bg-slate-800/80">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-600 group-hover:text-slate-800 dark:text-slate-300">
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl bg-transparent p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
            />
          </label>
        )}

        {/* Toggle date perso */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 p-3 dark:border-slate-700 dark:bg-slate-800/80">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Date personnalisée
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300">
              Utilise aujourd’hui si désactivé
            </span>
          </div>
          <button
            type="button"
            onClick={() => setUseCustomDate((v) => !v)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
              useCustomDate ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
            }`}
            aria-pressed={useCustomDate}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                useCustomDate ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow transition hover:bg-indigo-500 sm:w-auto"
        >
          <Plus size={16} />
          Ajouter la séance
        </button>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Astuce : ajoute plusieurs séances d’affilée, elles sont enregistrées automatiquement.
        </p>
      </div>
    </form>
  );
}

// =========================
/* Chart helpers */
// =========================
function useIsDark() {
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(
        document.documentElement.classList.contains("dark")
      )
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

// =========================
/* Graphique : courbe des séances */
// =========================
function SwimChart({ sessions }) {
  const isDark = useIsDark();
  const data = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((s) => ({ ...s, dateLabel: dayjs(s.date).format("DD/MM") })),
    [sessions]
  );

  if (!data.length)
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Aucune donnée encore.
      </p>
    );

  return (
    <div className="h-72 w-full text-slate-900 dark:text-slate-100">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeOpacity={0.12} strokeDasharray="3 3" />
          <XAxis dataKey="dateLabel" tick={{ fill: "currentColor" }} />
          <YAxis tick={{ fill: "currentColor" }} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.1)",
              background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
              color: isDark ? "#e5e7eb" : "#0f172a",
            }}
            labelClassName="text-xs"
            itemStyle={{ color: isDark ? "#e5e7eb" : "#0f172a" }}
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

// =========================
/* Graphique : cumul mensuel (barres) */
// =========================
function MonthlyBarChart({ sessions }) {
  const isDark = useIsDark();
  const monthly = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      const key = dayjs(s.date).format("YYYY-MM"); // triable
      const label = dayjs(s.date).format("MMMM YYYY"); // FR
      const prev = map.get(key) || { key, label, total: 0 };
      prev.total += Number(s.distance) || 0;
      map.set(key, prev);
    });
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [sessions]);

  if (!monthly.length)
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Aucune donnée mensuelle encore.
      </p>
    );

  return (
    <div className="h-72 w-full text-slate-900 dark:text-slate-100">
      <ResponsiveContainer>
        <BarChart data={monthly}>
          <CartesianGrid strokeOpacity={0.12} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "currentColor" }} />
          <YAxis tick={{ fill: "currentColor" }} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.1)",
              background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
              color: isDark ? "#e5e7eb" : "#0f172a",
            }}
            itemStyle={{ color: isDark ? "#e5e7eb" : "#0f172a" }}
            formatter={(v) => [`${v} m`, "Total du mois"]}
          />
          <Bar dataKey="total" fill="rgb(99 102 241)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// =========================
/* Historique (tri, pagination, édition) */
// =========================
function History({ sessions, onDelete, onEdit }) {
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editDistance, setEditDistance] = useState("");
  const perPage = 5;

  if (!sessions.length)
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Aucune séance enregistrée.
      </p>
    );

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const totalPages = Math.ceil(sorted.length / perPage);
  const currentData = sorted.slice((page - 1) * perPage, page * perPage);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const startEdit = (s) => {
    setEditId(s.id);
    setEditDate(s.date);
    setEditDistance(s.distance);
  };

  const saveEdit = () => {
    onEdit(editId, { date: editDate, distance: Number(editDistance) });
    setEditId(null);
  };

  return (
    <div className="overflow-hidden rounded-3xl ring-1 ring-slate-200 dark:ring-slate-700">
      <table className="w-full text-left">
        <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Métrage (m)</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {currentData.map((s) => (
            <tr
              key={s.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                {editId === s.id ? (
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white p-1 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
                    className="w-24 rounded-lg border border-slate-300 bg-white p-1 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                ) : (
                  s.distance
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {editId === s.id ? (
                  <div className="inline-flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
                    >
                      Sauver
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="rounded-lg bg-slate-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-400"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex gap-2">
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
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-slate-100 px-4 py-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <button
          onClick={goPrev}
          disabled={page === 1}
          className="rounded-lg px-3 py-1 disabled:opacity-50"
        >
          ◀ Précédent
        </button>
        <span className="text-sm">
          Page {page} sur {totalPages}
        </span>
        <button
          onClick={goNext}
          disabled={page === totalPages}
          className="rounded-lg px-3 py-1 disabled:opacity-50"
        >
          Suivant ▶
        </button>
      </div>
    </div>
  );
}

// =========================
/* App principale */
// =========================
export default function App() {
  const [sessions, setSessions] = useLocalStorage(LOCAL_STORAGE_KEY, []);
  const nf = useMemo(() => new Intl.NumberFormat("fr-FR"), []);

  // KPIs
  const monthKey = dayjs().format("YYYY-MM");
  const monthLabel = dayjs().format("MMMM YYYY");
  const totalMonth = useMemo(
    () =>
      sessions.reduce(
        (sum, s) =>
          dayjs(s.date).format("YYYY-MM") === monthKey
            ? sum + (Number(s.distance) || 0)
            : sum,
        0
      ),
    [sessions, monthKey]
  );
  const totalAll = useMemo(
    () => sessions.reduce((sum, s) => sum + (Number(s.distance) || 0), 0),
    [sessions]
  );
  const avgPerSession = useMemo(
    () => (sessions.length ? Math.round(totalAll / sessions.length) : 0),
    [sessions.length, totalAll]
  );

  // CRUD
  const addSession = (payload) => setSessions((prev) => [...prev, payload]);
  const deleteSession = (id) =>
    setSessions((prev) => prev.filter((s) => s.id !== id));
  const editSession = (id, updated) =>
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );

  const exportCSV = () => downloadCSV("natation_sessions.csv", sessions);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-white px-4 lg:px-12 py-8 dark:from-[#0b1020] dark:via-[#0a1028] dark:to-[#0b1228]">
      {/* Header */}
      <header className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 dark:text-slate-100">
          🏊‍♂️ Suivi Natation
        </h1>
        <ThemeToggle />
      </header>

      {/* Layout: mobile stack / desktop 2 colonnes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[35%_1fr]">
        {/* Colonne gauche : Options + Historique */}
        <div className="space-y-6">
          {/* Options */}
          <section className="overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-white/80 backdrop-blur shadow-lg dark:ring-slate-700 dark:bg-slate-900/60">
            {/* Header décoratif */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/70 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  📘 Options
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Ajoute une séance et gère tes données
                </p>
              </div>
              <div className="hidden sm:block">
                <span className="rounded-full bg-indigo-600/10 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200">
                  LocalStorage actif
                </span>
              </div>
            </div>

            {/* Contenu Options */}
            <div className="space-y-4 p-5">
              {/* KPIs */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      Total du mois
                    </p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {monthLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <CalendarDays size={18} />
                    <span className="text-2xl font-bold">
                      {nf.format(totalMonth)}{" "}
                      <span className="text-sm font-medium opacity-70">m</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      Moyenne / séance
                    </p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Toutes séances
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Calculator size={18} />
                    <span className="text-2xl font-bold">
                      {nf.format(avgPerSession)}{" "}
                      <span className="text-sm font-medium opacity-70">m</span>
                    </span>
                  </div>
                </div>
              </div>

              <AddSessionForm onAdd={addSession} />

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Tes données restent sur cet appareil. Tu peux les exporter à
                  tout moment.
                </span>
                <button
                  onClick={exportCSV}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-500"
                >
                  <Download size={16} />
                  Exporter en CSV
                </button>
              </div>
            </div>
          </section>

          {/* Historique */}
          <section className="rounded-3xl ring-1 ring-slate-200 bg-white/80 p-5 shadow-lg backdrop-blur dark:ring-slate-700 dark:bg-slate-900/60">
            <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
              📋 Historique
            </h2>
            <History
              sessions={sessions}
              onDelete={deleteSession}
              onEdit={editSession}
            />
          </section>
        </div>

        {/* Colonne droite : Graphiques */}
        <div className="space-y-6">
          <section className="rounded-3xl ring-1 ring-slate-200 bg-white/80 p-5 shadow-lg backdrop-blur dark:ring-slate-700 dark:bg-slate-900/60">
            <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
              📈 Graphique (séances)
            </h2>
            <SwimChart sessions={sessions} />
          </section>

          <section className="rounded-3xl ring-1 ring-slate-200 bg-white/80 p-5 shadow-lg backdrop-blur dark:ring-slate-700 dark:bg-slate-900/60">
            <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
              📊 Cumulatif par mois
            </h2>
            <MonthlyBarChart sessions={sessions} />
          </section>
        </div>
      </div>
    </div>
  );
}
