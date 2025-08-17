// App.js – Suivi Natation (React + Tailwind v3 + Recharts) + Login overlay
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
  ReferenceLine,
} from "recharts";
import { Download, Moon, Sun, Plus, CalendarDays, Calculator } from "lucide-react";

dayjs.locale("fr");

// --- Login Card ---
function LoginCard({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Demo: à remplacer par ton vrai backend
    if (email === "admin@test.com" && password === "password123") {
      onLogin();
    } else {
      setError("Identifiants invalides");
    }
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900/90">
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
        🔑 Connexion requise
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-500"
        >
          Se connecter
        </button>
      </form>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Astuce démo · Email: <code>admin@test.com</code> · Mot de passe: <code>password123</code>
      </p>
    </div>
  );
}

function LockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
      🔒 Mode lecture seule
    </span>
  );
}

// --- Local Storage Hook ---
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

// --- Export CSV ---
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

// --- Dark mode ---
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
      aria-label={isDark ? "Passer en clair" : "Passer en sombre"}
      className="inline-flex items-center justify-center rounded-xl bg-slate-200 p-2 text-slate-900 shadow hover:bg-slate-300 dark:bg-slate-700/70 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

// --- KPI ---
function KpiChip({ title, subtitle, icon, value }) {
  return (
    <div className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <div className="hidden sm:flex">{icon}</div>
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-wide text-slate-600 dark:text-slate-300">{title}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{subtitle}</p>
      </div>
      <div className="ml-2 text-lg font-bold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

// --- Hook dark mode state ---
function useIsDark() {
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark"))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

// =========================
// Formulaire ajout
// =========================
function AddSessionForm({ onAdd, onExport }) {
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
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <label className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-inner dark:border-slate-700 dark:bg-slate-800/80">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-600 group-hover:text-slate-800 dark:text-slate-300 dark:group-hover:text-slate-100">
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
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-inner dark:border-slate-700 dark:bg-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Date personnalisée
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Utilise aujourd’hui si désactivé
              </span>
            </div>
            <button
              type="button"
              onClick={() => setUseCustomDate((v) => !v)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${useCustomDate ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${useCustomDate ? "translate-x-6" : "translate-x-1"
                  }`}
              />
            </button>
          </div>
          {useCustomDate && (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl bg-transparent p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
            />
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500">
          <Plus size={16} /> Ajouter la séance
        </button>
        <button type="button" onClick={onExport} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-500">
          <Download size={16} /> Exporter en CSV
        </button>
      </div>
    </form>
  );
}

// =========================
// Graphiques
// =========================
function SwimChart({ sessions }) {
  const isDark = useIsDark();

  const avgAll = useMemo(() => {
    if (!sessions.length) return 0;
    const sum = sessions.reduce((acc, s) => acc + (Number(s.distance) || 0), 0);
    return Math.round(sum / sessions.length);
  }, [sessions]);

  const data = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((s) => ({
          ...s,
          dateLabel: dayjs(s.date).format("DD/MM"),
        })),
    [sessions]
  );

  if (!data.length) return <p className="text-sm text-slate-600 dark:text-slate-300">Aucune donnée encore.</p>;

  return (
    <div className="h-72 w-full text-slate-900 dark:text-slate-100">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeOpacity={0.12} strokeDasharray="3 3" />

          <XAxis
            dataKey="dateLabel"
            interval={0}
            tickMargin={10}
            padding={{ right: 20 }}
            tick={{ fill: "currentColor" }}
            tickFormatter={(_value, index) => {
              const d = dayjs(data[index].date);
              if (index === 0) {
                const label = d.format("MMM YY");
                return label.charAt(0).toUpperCase() + label.slice(1);
              }
              const prev = dayjs(data[index - 1].date);
              if (d.isSame(prev, "month")) return "";
              const label = d.format("MMM YY");
              return label.charAt(0).toUpperCase() + label.slice(1);
            }}
          />

          <YAxis tick={{ fill: "currentColor" }} />

          <ReferenceLine
            y={1000}
            stroke="rgb(16 185 129)"
            strokeDasharray="1"
            label={{ value: "1000 m", position: "right", fill: "currentColor", fontSize: 12 }}
          />
          <ReferenceLine
            y={avgAll}
            stroke="rgb(59 130 246)"
            strokeDasharray="4 4"
            label={{ value: `${avgAll} m (moy.)`, position: "right", fill: "currentColor", fontSize: 12 }}
          />

          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.1)",
              background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
              color: isDark ? "#e5e7eb" : "#0f172a",
            }}
            labelClassName="text-xs"
            itemStyle={{ color: isDark ? "#e5e7eb" : "#0f172a" }}
            labelFormatter={() => ""}
            formatter={(v, _n, p) => [v + " m", dayjs(p.payload.date).format("DD/MM/YYYY")]}
          />

          <Line type="monotone" dataKey="distance" stroke="rgb(99 102 241)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MonthlyBarChart({ sessions }) {
  const isDark = useIsDark();
  const monthly = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      const key = dayjs(s.date).format("YYYY-MM");
      const rawLabel = dayjs(s.date).format("MMMM YYYY");
      const prettyLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
      const prev = map.get(key) || { key, label: prettyLabel, total: 0, count: 0 };
      prev.total += Number(s.distance) || 0;
      prev.count += 1;
      map.set(key, prev);
    });
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [sessions]);

  if (!monthly.length) return <p className="text-sm text-slate-600 dark:text-slate-300">Aucune donnée mensuelle encore.</p>;

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
            labelFormatter={() => ""}
            formatter={(v, _name, props) => {
              const count = props.payload.count;
              return [`${v} m (${count} séance${count > 1 ? "s" : ""})`, "Total du mois"];
            }}
          />
          <Bar dataKey="total" fill="rgb(99 102 241)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// =========================
// Historique
// =========================
function History({ sessions, onDelete, onEdit }) {
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editDistance, setEditDistance] = useState("");
  const perPage = 5;

  if (!sessions.length) return <p className="text-sm text-slate-600 dark:text-slate-300">Aucune séance enregistrée.</p>;

  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
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
    <div className="overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-white/80 backdrop-blur dark:ring-slate-700 dark:bg-slate-900/60">
      <div className="p-5">
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
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                  {editId === s.id ? (
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white p-1 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
                      className="w-24 rounded-lg border border-slate-300 bg-white p-1 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  ) : (
                    s.distance
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editId === s.id ? (
                    <div className="inline-flex gap-2">
                      <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white" onClick={saveEdit}>
                        Sauver
                      </button>
                      <button className="rounded-lg bg-slate-500 px-3 py-1.5 text-sm font-medium text-white" onClick={() => setEditId(null)}>
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex gap-2">
                      <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white" onClick={() => startEdit(s)}>
                        Modifier
                      </button>
                      <button className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white" onClick={() => onDelete(s.id)}>
                        Supprimer
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
          <button
            onClick={goPrev}
            disabled={page === 1}
            className="rounded-lg px-3 py-1 font-medium hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-slate-700/60"
          >
            ◀ Précédent
          </button>
          <span className="text-sm">
            Page <span className="font-semibold">{page}</span> sur <span className="font-semibold">{totalPages}</span>
          </span>
          <button
            onClick={goNext}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1 font-medium hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-slate-700/60"
          >
            Suivant ▶
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================
// App principale
// =========================
// --- App principale ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [sessions, setSessions] = useLocalStorage("swim_sessions", []);
  const nf = useMemo(() => new Intl.NumberFormat("fr-FR"), []);
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

  const totalSessions = sessions.length;

  const addSession = (payload) => setSessions((prev) => [...prev, payload]);
  const deleteSession = (id) =>
    setSessions((prev) => prev.filter((s) => s.id !== id));
  const editSession = (id, updated) =>
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  const exportCSV = () =>
    downloadCSV("natation_sessions.csv", sessions);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-white px-4 xl:px-12 py-8 dark:from-[#0b1020] dark:via-[#0a1028] dark:to-[#0b1228]">
      <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 dark:text-slate-100">
            🏊‍♂️ Suivi Natation
          </h1>
          <ThemeToggle />
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
          <KpiChip
            title="Total du mois"
            subtitle={monthLabel}
            value={
              <>
                {nf.format(totalMonth)}{" "}
                <span className="text-xs opacity-70">m</span>
              </>
            }
            icon={<CalendarDays size={18} />}
          />
          <KpiChip
            title="Moyenne / séance"
            subtitle="Toutes séances"
            value={
              <>
                {nf.format(avgPerSession)}{" "}
                <span className="text-xs opacity-70">m</span>
              </>
            }
            icon={<Calculator size={18} />}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_3fr] gap-x-6 gap-y-2 items-start">
        {/* Bloc gauche Options + Historique */}
        <section className="relative self-start order-1 overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-white/80 backdrop-blur dark:ring-slate-700 dark:bg-slate-900/60">
          {/* Contenu visuel désaturé quand déconnecté */}
          <div className={isLoggedIn ? "" : "pointer-events-none select-none opacity-60 grayscale"}>
            <div className="flex items-center justify-between border-b px-5 py-4 dark:border-slate-700 dark:bg-slate-800/70">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                📘 Options
              </h2>
            </div>
            <div className="p-5">
              <AddSessionForm onAdd={addSession} onExport={exportCSV} />
            </div>
            <div className="hidden xl:block border-t dark:border-slate-700" />
            <div className="hidden xl:block px-5 pt-5 pb-5">
              <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                📋 Historique
              </h3>
              <History
                sessions={sessions}
                onDelete={deleteSession}
                onEdit={editSession}
              />
            </div>
          </div>

          {/* Calque + overlay + popup */}
          {!isLoggedIn && (
            <>
              {/* Overlay semi-transparent qui couvre uniquement le bloc gauche */}
              <div className="absolute inset-0 z-10 bg-white/70 dark:bg-slate-900/70" aria-hidden="true" />

              {/* Badge "Verrouillé" */}
              <div className="absolute left-5 top-4 z-20">
                <LockedBadge />
              </div>

              {/* Popup centrée */}
              <div className="absolute inset-0 z-30 flex items-center justify-center px-4 sm:px-8 py-6">
                <LoginCard onLogin={() => setIsLoggedIn(true)} />
              </div>
            </>
          )}
        </section>

        {/* Colonne droite (graphiques toujours visibles en lecture seule) */}
        <section className="flex flex-col gap-6 self-start order-2">
          <div className="overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-white/80 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-5 py-4 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                📈 Séances
                <span className="ml-2 text-sm font-normal text-slate-600 dark:text-slate-300">
                  ({totalSessions})
                </span>
              </h2>
            </div>
            <div className="p-5">
              <SwimChart sessions={sessions} />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-white/80 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-5 py-4 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                📊 Cumulatif par mois
              </h2>
            </div>
            <div className="p-5">
              <MonthlyBarChart sessions={sessions} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
