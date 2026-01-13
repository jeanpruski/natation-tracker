// App.js
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { CalendarDays, Calculator, Waves, PersonStanding } from "lucide-react";
import { ThemeToggle } from "./components/ThemeToggle";
import { KpiChip } from "./components/KpiChip";
import { AddSessionForm } from "./components/AddSessionForm";
import { SwimChart } from "./components/SwimChart";
import { MonthlyBarChart } from "./components/MonthlyBarChart";
import { History } from "./components/History";
import { useEditAuth } from "./hooks/useEditAuth";
import { apiGet, apiJson } from "./utils/api";
import { downloadCSV } from "./utils/downloadCSV";
import { capFirst } from "./utils/strings";

dayjs.locale("fr");

/* =========================
   Utils
   ========================= */
const normType = (t) => ((t || "swim").toLowerCase() === "run" ? "run" : "swim");
const pluralize = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;

/* =========================
   Mini segmented control
   ========================= */
function TypeSwitch({ value, onChange }) {
  const items = [
    { key: "all", label: "Tout" },
    { key: "swim", label: "Natation" },
    { key: "run", label: "Running" },
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

/* =========================
   Petit badge icône (vague / running)
   ========================= */
function TypePill({ type, children }) {
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

/* =========================
   Modal édition (auth + editor) — FULLSCREEN
   ========================= */
function EditModal({
  open,
  onClose,
  isAuth,
  verifyAndLogin,
  logout,
  sessions,
  onAdd,
  onEdit,
  onDelete,
  onExport,
}) {
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("options"); // options | history

  useEffect(() => {
    if (!open) {
      setToken("");
      setErr("");
      setTab("options");
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await verifyAndLogin(token);
    } catch {
      setErr("Mot de passe invalide");
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/35" onClick={onClose} aria-hidden="true" />

      {/* fullscreen */}
      <div className="absolute inset-0">
        <div className="h-full w-full bg-white dark:bg-slate-900">
          {/* top bar */}
          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                {isAuth ? "Mode édition" : "Déverrouiller l’édition"}
              </h2>

              {isAuth && (
                <div className="ml-2 inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
                  <button
                    onClick={() => setTab("options")}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      tab === "options"
                        ? "bg-white shadow text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    Options
                  </button>
                  <button
                    onClick={() => setTab("history")}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      tab === "history"
                        ? "bg-white shadow text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    Historique
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isAuth && (
                <button
                  onClick={logout}
                  className="rounded-xl bg-rose-600 px-3 py-2 text-sm text-white hover:bg-rose-500"
                  title="Repasser en lecture seule"
                >
                  🔒 Verrouiller
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-xl bg-slate-200 px-3 py-2 text-sm text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* content fullscreen */}
          <div className="h-[calc(100%-52px)] overflow-auto p-4 sm:p-6">
            {!isAuth ? (
              <form onSubmit={submit} className="mx-auto max-w-md space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Entre ton mot de passe (EDIT_TOKEN) pour activer l’édition.
                </p>
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Mot de passe"
                  type="password"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                {err && (
                  <div className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                    {err}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-500"
                >
                  Déverrouiller
                </button>
              </form>
            ) : (
              <div className="mx-auto w-full max-w-5xl">
                {tab === "options" ? (
                  <AddSessionForm onAdd={onAdd} onExport={onExport} readOnly={false} />
                ) : (
                  <History sessions={sessions} onDelete={onDelete} onEdit={onEdit} readOnly={false} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   App principale
   ========================= */
export default function App() {
  const { token: editToken, isAuth, checking, verifyAndLogin, logout: editLogout } = useEditAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [mode, setMode] = useState("all"); // all | swim | run
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const modeLabel = mode === "swim" ? "Natation" : mode === "run" ? "Running" : null;

  // ✅ source unique pour KPI + graphes
  const shownSessions = useMemo(() => {
    if (mode === "all") return sessions;
    return sessions.filter((s) => normType(s.type) === mode);
  }, [sessions, mode]);

  /* ===== Total du mois (mètres) ===== */
  const monthTotals = useMemo(() => {
    let swim = 0, run = 0;
    shownSessions.forEach((s) => {
      if (dayjs(s.date).format("YYYY-MM") !== monthKey) return;
      const d = Number(s.distance) || 0;
      if (normType(s.type) === "run") run += d;
      else swim += d;
    });
    return { all: swim + run, swim, run };
  }, [shownSessions, monthKey]);

  /* ===== Stats globales (moyennes + counts) ===== */
  const stats = useMemo(() => {
    let swimSum = 0, swimN = 0, runSum = 0, runN = 0;

    shownSessions.forEach((s) => {
      const d = Number(s.distance) || 0;
      const t = normType(s.type);
      if (t === "run") { runSum += d; runN += 1; }
      else { swimSum += d; swimN += 1; }
    });

    const swimAvg = swimN ? Math.round(swimSum / swimN) : 0;
    const runAvg = runN ? Math.round(runSum / runN) : 0;
    const totalN = swimN + runN;

    return { swimAvg, runAvg, swimN, runN, totalN };
  }, [shownSessions]);

  /* ===== Séances ce mois-ci (counts) ===== */
  const monthCounts = useMemo(() => {
    let swimN = 0, runN = 0;
    shownSessions.forEach((s) => {
      if (dayjs(s.date).format("YYYY-MM") !== monthKey) return;
      if (normType(s.type) === "run") runN += 1;
      else swimN += 1;
    });
    return { swimN, runN, totalN: swimN + runN };
  }, [shownSessions, monthKey]);

  /* ===== Dernière séance + sport (dans le mode) ===== */
  const lastSession = useMemo(() => {
    if (!shownSessions.length) return null;
    return shownSessions.reduce((best, s) => {
      if (!best) return s;
      return dayjs(s.date).isAfter(best.date) ? s : best;
    }, null);
  }, [shownSessions]);

  const lastSessionDay = useMemo(() => (lastSession ? dayjs(lastSession.date) : null), [lastSession]);
  const daysSinceLast = useMemo(() => (lastSessionDay ? dayjs().diff(lastSessionDay, "day") : null), [lastSessionDay]);
  const lastLabel = lastSessionDay ? capFirst(lastSessionDay.format("dddd DD MMM YYYY")) : "Aucune";
  const lastType = lastSession ? normType(lastSession.type) : null;

  /* ===== CRUD (protégés par auth) ===== */
  const guard = (fn) => async (...args) => {
    if (checking) return;
    if (!isAuth) { setShowEditModal(true); return; }
    return fn(...args);
  };

  const addSession = guard(async (payload) => {
    const body = { id: payload.id, distance: payload.distance, date: payload.date, type: payload.type };
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

  const exportCSV = () => downloadCSV("sessions.csv", sessions);

  /* ===== Loading ===== */
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
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-white px-4 xl:px-8 py-4 xl:py-8 text-[13.5px] sm:text-[14px] dark:from-[#0b1020] dark:via-[#0a1028] dark:to-[#0b1228]">
      <header className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <img src="/apple-touch-icon.png" alt="Logo" className="w-8 h-8" />
            NaTrack
          </h1>
          <ThemeToggle />

          <button
            onClick={() => setShowEditModal(true)}
            className={`ml-2 rounded-xl px-3 py-2 text-sm ${
              isAuth ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-amber-500 text-white hover:bg-amber-400"
            }`}
            title={isAuth ? "Ouvrir l’éditeur" : "Déverrouiller l’édition"}
          >
            {isAuth ? "✏️ Éditeur" : "🔓 Éditer"}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-300"> </span>
          <TypeSwitch value={mode} onChange={setMode} />
        </div>
      </header>

      {error && (
        <p className="mb-3 rounded-xl bg-rose-100 px-3 py-2 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_3fr] gap-4 items-start">
        {/* GAUCHE : KPI empilés */}
        <aside className="self-start">
          <div className="grid grid-cols-1 gap-4">
            {/* 1) Dernière séance */}
            <KpiChip
              title="Dernière séance"
              subtitle={mode === "all" ? lastLabel : `${modeLabel} · ${lastLabel}`}
              subtitleClassName="capitalize"
              value={
                <div className="text-right">
                  {daysSinceLast !== null ? (
                    <div className="mt-1 flex justify-end gap-2 flex-wrap items-center">
                      <div className="font-bold leading-none flex items-baseline">
                        {nf.format(daysSinceLast)}{" "}
                        <span className="text-xs opacity-70 leading-none">j</span>
                      </div>
                      {mode === "all" && lastType && (
                        <TypePill type={lastType}>{lastType === "run" ? "Running" : "Natation"}</TypePill>
                      )}
                    </div>
                  ) : (
                    <div className="font-bold">—</div>
                  )}
                </div>
              }
              icon={<CalendarDays />}
              tone={daysSinceLast > 4 ? "danger" : "default"}
            />

            {/* 2) Total du mois (mètres) */}
            <KpiChip
              title="Total du mois"
              subtitle={mode === "all" ? monthLabel : modeLabel}
              subtitleClassName="capitalize"
              value={
                <div className="text-right">
                  <div className="font-bold">
                    {nf.format(monthTotals.all)} <span className="text-xs opacity-70">m</span>
                  </div>
                  {mode === "all" && (
                    <div className="mt-1 flex justify-end gap-2 flex-wrap">
                      <TypePill type="swim">{nf.format(monthTotals.swim)}m</TypePill>
                      <TypePill type="run">{nf.format(monthTotals.run)}m</TypePill>
                    </div>
                  )}
                </div>
              }
              icon={<CalendarDays />}
            />

            {/* 3) Moyenne / séance */}
            <KpiChip
              title="Moyenne / séance"
              subtitle={mode === "all" ? "Par sport" : modeLabel}
              value={
                mode === "all" ? (
                  <div className="mt-1 flex justify-end gap-2 flex-wrap">
                    <TypePill type="swim">{nf.format(stats.swimAvg)} <span className="opacity-80">m</span></TypePill>
                    <TypePill type="run">{nf.format(stats.runAvg)} <span className="opacity-80">m</span></TypePill>
                  </div>
                ) : (
                  <div className="text-right font-bold">
                    {nf.format(mode === "swim" ? stats.swimAvg : stats.runAvg)}{" "}
                    <span className="text-xs opacity-70">m</span>
                  </div>
                )
              }
              icon={<Calculator />}
            />

            {/* 4) Séances ce mois-ci */}
            <KpiChip
              title="Séances ce mois-ci"
              subtitle={mode === "all" ? monthLabel : modeLabel}
              subtitleClassName="capitalize"
              value={
                <div className="text-right">
                  <div className="font-bold">{pluralize(monthCounts.totalN, "Séance")}</div>
                  {mode === "all" && (
                    <div className="mt-1 flex justify-end gap-2 flex-wrap">
                      <TypePill type="swim">{pluralize(monthCounts.swimN, "Séance")}</TypePill>
                      <TypePill type="run">{pluralize(monthCounts.runN, "Séance")}</TypePill>
                    </div>
                  )}
                </div>
              }
              icon={<CalendarDays />}
            />

            {/* 5) Séances (total) */}
            <KpiChip
              title="Séances"
              subtitle={mode === "all" ? "Total" : modeLabel}
              value={
                <div className="text-right">
                  <div className="font-bold">{pluralize(stats.totalN, "Séance")}</div>
                  {mode === "all" && (
                    <div className="mt-1 flex justify-end gap-2 flex-wrap">
                      <TypePill type="swim">{pluralize(stats.swimN, "Séance")}</TypePill>
                      <TypePill type="run">{pluralize(stats.runN, "Séance")}</TypePill>
                    </div>
                  )}
                </div>
              }
              icon={<CalendarDays />}
            />
          </div>
        </aside>

        {/* DROITE : graphes */}
        <section className="flex flex-col gap-4 self-start">
          {/* Chart séances */}
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/80 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">📈 Séances</h2>
            </div>
            <div className="p-4">
              <SwimChart sessions={shownSessions} mode={mode} />
            </div>
          </div>

          {/* Chart mensuel */}
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/80 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">📊 Cumulatif par mois</h2>
            </div>
            <div className="p-4">
              <MonthlyBarChart sessions={shownSessions} />
            </div>
          </div>
        </section>
      </div>

      <EditModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        isAuth={isAuth}
        verifyAndLogin={verifyAndLogin}
        logout={editLogout}
        sessions={sessions}
        onAdd={addSession}
        onEdit={editSession}
        onDelete={deleteSession}
        onExport={exportCSV}
      />
    </div>
  );
}