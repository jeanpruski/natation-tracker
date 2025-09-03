import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { CalendarDays, Calculator, Lock } from "lucide-react";
import { ThemeToggle } from "./components/ThemeToggle";
import { KpiChip } from "./components/KpiChip";
import { EditAuthModal } from "./components/EditAuthModal";
import { AddSessionForm } from "./components/AddSessionForm";
import { SwimChart } from "./components/SwimChart";
import { MonthlyBarChart } from "./components/MonthlyBarChart";
import { History } from "./components/History";
import { useEditAuth } from "./hooks/useEditAuth";
import { apiGet, apiJson } from "./utils/api";
import { downloadCSV } from "./utils/downloadCSV";
import { capFirst } from "./utils/strings";

dayjs.locale("fr");

// components and hooks moved to separate files above

/* =========================
   App principale
   ========================= */
export default function App() {
  const { token: editToken, isAuth, checking, verifyAndLogin, logout: editLogout } = useEditAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");            // << manquait
  const totalSessions = sessions.length;             // << manquait

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiGet("/sessions");
        if (alive) setSessions(data);
      } catch (e) {
        if (alive) setError("Chargement impossible : " + (e?.message || "erreur inconnue"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const nf = useMemo(() => new Intl.NumberFormat("fr-FR"), []);
  const monthKey = dayjs().format("YYYY-MM");
  const monthLabel = capFirst(dayjs().format("MMMM YYYY"));

  const totalMonth = useMemo(
    () => sessions.reduce((s, x) => (dayjs(x.date).format("YYYY-MM") === monthKey ? s + (+x.distance || 0) : s), 0),
    [sessions, monthKey]
  );
  const totalAll = useMemo(() => sessions.reduce((s, x) => s + (+x.distance || 0), 0), [sessions]);
  const avgPerSession = useMemo(() => (sessions.length ? Math.round(totalAll / sessions.length) : 0), [sessions.length, totalAll]);

  const lastSessionDay = useMemo(() => {
    if (!sessions.length) return null;
    const max = sessions.reduce((m, s) => (m && dayjs(m).isAfter(s.date) ? m : s.date), null);
    return max ? dayjs(max) : null;
  }, [sessions]);
  const daysSinceLast = useMemo(() => (lastSessionDay ? dayjs().diff(lastSessionDay, "day") : null), [lastSessionDay]);
  const lastLabel = lastSessionDay ? capFirst(lastSessionDay.format("dddd DD MMM YYYY")) : "Aucune";

  // Guard réseau + actions CRUD (<< manquaient)
  const guard = (fn) => (...args) => {
    if (checking) return;
    if (!isAuth) { setShowEditModal(true); return; }
    return fn(...args);
  };

  const addSession = guard(async (payload) => {
    const body = { id: payload.id, distance: payload.distance, date: payload.date };
    const created = await apiJson("POST", "/sessions", body, editToken);
    setSessions((prev) => [...prev, created]);
  });
  const deleteSession = guard(async (id) => {
    await apiJson("DELETE", `/sessions/${id}`, undefined, editToken);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  });
  const editSession = guard(async (id, updated) => {
    await apiJson("PUT", `/sessions/${id}`, updated, editToken);
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  });
  const exportCSV = () => downloadCSV("natation_sessions.csv", sessions);

  const lockedMask = !isAuth ? "pointer-events-none select-none blur-[1.5px] grayscale-[.3] opacity-75" : ""; // << manquait

  // Plein écran: logo + spinner pendant le chargement (mobile & desktop)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-white dark:from-[#0b1020] dark:via-[#0a1028] dark:to-[#0b1228] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/apple-touch-icon.png" alt="NaTrack" className="w-16 h-16" />
          <div className="h-10 w-10 rounded-full border-4 border-slate-300 border-t-indigo-500 dark:border-slate-700 dark:border-t-indigo-400 animate-spin" aria-label="Chargement" />
          <span className="sr-only">Chargement…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-white px-4 xl:px-12 py-8 text-[13.5px] sm:text-[14px] dark:from-[#0b1020] dark:via-[#0a1028] dark:to-[#0b1228]">
      <header className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <img
              src="/apple-touch-icon.png"
              alt="Logo natation"
              className="w-8 h-8"
            />
            NaTrack</h1>
          <ThemeToggle />
          <button
            onClick={() => (isAuth ? editLogout() : setShowEditModal(true))}
            className={`ml-2 rounded-xl px-3 py-2 text-sm ${isAuth ? "bg-rose-600 text-white hover:bg-rose-500" : "bg-amber-500 text-white hover:bg-amber-400"}`}
            title={isAuth ? "Repasser en lecture seule" : "Déverrouiller l’édition"}
          >
            {isAuth ? "🔒 Verrouiller" : "🔓 Éditer"}
          </button>
        </div>
        {/* KPI plus larges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 w-full max-w-4xl">
          <KpiChip
            title="Total du mois"
            subtitle={monthLabel}
            subtitleClassName="capitalize"
            value={<>{nf.format(totalMonth)} <span className="text-xs opacity-70">m</span></>}
            icon={<CalendarDays />}
          />
          <KpiChip
            title="Moyenne / séance"
            subtitle="Toutes séances"
            value={<>{nf.format(avgPerSession)} <span className="text-xs opacity-70">m</span></>}
            icon={<Calculator />}
          />
          <KpiChip
            title="Dernière séance"
            subtitle={lastLabel}
            value={daysSinceLast !== null ? <>{nf.format(daysSinceLast)} <span className="text-xs opacity-70">j</span></> : "—"}
            icon={<CalendarDays />}
            tone={daysSinceLast > 4 ? "danger" : "default"}
          />
        </div>
      </header>

      {error && <p className="mb-3 rounded-xl bg-rose-100 px-3 py-2 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">{error}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_3fr] gap-x-4 gap-y-3 items-start">
        {/* Panneau Options + Historique */}
        <section className="relative self-start order-2 xl:order-1 overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/80 backdrop-blur dark:ring-slate-700 dark:bg-slate-900/60">
          {!isAuth && (
            <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
              <Lock size={14} /> Mode lecture seule — cliquez “Éditer” pour déverrouiller
            </div>
          )}

          <div className={lockedMask}>
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">📘 Options</h2>
            </div>
            <div className="p-4">
              <AddSessionForm onAdd={addSession} onExport={exportCSV} readOnly={!isAuth} />
            </div>

            <div className="border-t dark:border-slate-700" />
            <div className="px-4 pt-4 pb-4">
              <h3 className="mb-2.5 text-lg font-semibold text-slate-900 dark:text-slate-100">📋 Historique</h3>
              <History sessions={sessions} onDelete={deleteSession} onEdit={editSession} readOnly={!isAuth} />
            </div>
          </div>
        </section>

        {/* Colonne droite (graphiques) */}
        <section className="flex flex-col gap-4 self-start order-1 xl:order-2">
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/80 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                📈 Séances <span className="ml-2 text-sm font-normal text-slate-600 dark:text-slate-300">({totalSessions})</span>
              </h2>
            </div>
            <div className="p-4">
              <SwimChart sessions={sessions} />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/80 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">📊 Cumulatif par mois</h2>
            </div>
            <div className="p-4">
              <MonthlyBarChart sessions={sessions} />
            </div>
          </div>
        </section>
      </div>

      <EditAuthModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onValid={verifyAndLogin}
      />
    </div>
  );
}
