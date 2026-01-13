import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { CalendarDays, Calculator } from "lucide-react";
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
              ${active
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
   Modal édition (auth + editor)
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
      // si ok => isAuth passera true via hook
    } catch (e2) {
      setErr("Mot de passe invalide");
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
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

          <div className="p-4">
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
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-4">
                <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white dark:ring-slate-700 dark:bg-slate-900">
                  {/* Header stylé */}
                  <div className="flex items-center gap-3 border-b bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                      {tab === "options" ? "✏️" : "📋"}
                    </div>
                    <div className="leading-tight">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {tab === "options" ? "Options" : "Historique"}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {tab === "options"
                          ? "Ajouter ou exporter des séances"
                          : "Modifier ou supprimer des séances"}
                      </p>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-4">
                    {tab === "options" ? (
                      <AddSessionForm
                        onAdd={onAdd}
                        onExport={onExport}
                        readOnly={false}
                      />
                    ) : (
                      <History
                        sessions={sessions}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        readOnly={false}
                      />
                    )}
                  </div>
                </div>
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

  // Helpers type
  const normType = (t) => ((t || "swim").toLowerCase() === "run" ? "run" : "swim");

  const filteredSessions = useMemo(() => {
    if (mode === "all") return sessions;
    return sessions.filter((s) => normType(s.type) === mode);
  }, [sessions, mode]);

  // Totaux mois (all + split)
  const monthTotals = useMemo(() => {
    let swim = 0, run = 0, all = 0;
    sessions.forEach((s) => {
      if (dayjs(s.date).format("YYYY-MM") !== monthKey) return;
      const d = Number(s.distance) || 0;
      const t = normType(s.type);
      all += d;
      if (t === "run") run += d;
      else swim += d;
    });
    return { all, swim, run };
  }, [sessions, monthKey]);

  // Moyennes globales (all + split)
  const avgs = useMemo(() => {
    let swimSum = 0, swimN = 0, runSum = 0, runN = 0;
    sessions.forEach((s) => {
      const d = Number(s.distance) || 0;
      const t = normType(s.type);
      if (t === "run") { runSum += d; runN += 1; }
      else { swimSum += d; swimN += 1; }
    });
    const allN = swimN + runN;
    const allAvg = allN ? Math.round((swimSum + runSum) / allN) : 0;
    const swimAvg = swimN ? Math.round(swimSum / swimN) : 0;
    const runAvg = runN ? Math.round(runSum / runN) : 0;
    return { allAvg, swimAvg, runAvg, swimN, runN };
  }, [sessions]);

  const totalSessions = sessions.length;

  const lastSessionDay = useMemo(() => {
    if (!sessions.length) return null;
    const max = sessions.reduce((m, s) => (m && dayjs(m).isAfter(s.date) ? m : s.date), null);
    return max ? dayjs(max) : null;
  }, [sessions]);
  const daysSinceLast = useMemo(() => (lastSessionDay ? dayjs().diff(lastSessionDay, "day") : null), [lastSessionDay]);
  const lastLabel = lastSessionDay ? capFirst(lastSessionDay.format("dddd DD MMM YYYY")) : "Aucune";

  // CRUD (protégés par auth)
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

        {/* switch global pour les graphes */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Affichage :
          </span>
          <TypeSwitch value={mode} onChange={setMode} />
        </div>
      </header>

      {error && (
        <p className="mb-3 rounded-xl bg-rose-100 px-3 py-2 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
          {error}
        </p>
      )}

      {/* Layout : gauche = 1/4, droite = 3/4 */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_3fr] gap-4 items-start">
        {/* GAUCHE : KPI empilés */}
        <aside className="self-start">
          <div className="grid grid-cols-1 gap-4">
            <KpiChip
              title="Total du mois"
              subtitle={monthLabel}
              subtitleClassName="capitalize"
              value={
                <div className="text-right">
                  <div>
                    {nf.format(monthTotals.all)}{" "}
                    <span className="text-xs opacity-70">m</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                    🟦 {nf.format(monthTotals.swim)}m · 🟩 {nf.format(monthTotals.run)}m
                  </div>
                </div>
              }
              icon={<CalendarDays />}
            />

            <KpiChip
              title="Moyenne / séance"
              subtitle={`Toutes (${totalSessions})`}
              value={
                <div className="text-right">
                  <div>
                    {nf.format(avgs.allAvg)}{" "}
                    <span className="text-xs opacity-70">m</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                    🟦 {nf.format(avgs.swimAvg)}m · 🟩 {nf.format(avgs.runAvg)}m
                  </div>
                </div>
              }
              icon={<Calculator />}
            />

            <KpiChip
              title="Dernière séance"
              subtitle={lastLabel}
              subtitleClassName="capitalize"
              value={
                daysSinceLast !== null ? (
                  <>
                    {nf.format(daysSinceLast)} <span className="text-xs opacity-70">j</span>
                  </>
                ) : (
                  "—"
                )
              }
              icon={<CalendarDays />}
              tone={daysSinceLast > 4 ? "danger" : "default"}
            />
          </div>
        </aside>

        {/* DROITE : graphes */}
        <section className="flex flex-col gap-4 self-start">
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/80 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                📈 Séances{" "}
                <span className="ml-2 text-sm font-normal text-slate-600 dark:text-slate-300">
                  ({filteredSessions.length})
                </span>
              </h2>
            </div>
            <div className="p-4">
              <SwimChart sessions={filteredSessions} mode={mode} />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/80 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                📊 Cumulatif par mois
              </h2>
            </div>
            <div className="p-4">
              <MonthlyBarChart sessions={filteredSessions} />
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
