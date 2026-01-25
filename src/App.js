// App.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/fr";
import {
  CalendarDays,
  CalendarCheck,
  Calculator,
  Waves,
  PersonStanding,
  Footprints,
  Gauge,
  CheckCircle2,
  Car,
  Train,
  Plane,
  Globe,
  Trophy,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ThemeToggle } from "./components/ThemeToggle";
import { KpiChip } from "./components/KpiChip";
import { AddSessionForm } from "./components/AddSessionForm";
import { SwimChart } from "./components/SwimChart";
import { MonthlyBarChart } from "./components/MonthlyBarChart";
import { History } from "./components/History";
import { SportSharePie } from "./components/SportSharePie";
import { CalendarHeatmap } from "./components/CalendarHeatmap";
import { AnimatedNumber } from "./components/AnimatedNumber";
import { Reveal } from "./components/Reveal";
import { motion } from "framer-motion";
import { useEditAuth } from "./hooks/useEditAuth";
import { apiGet, apiJson } from "./utils/api";
import { downloadCSV } from "./utils/downloadCSV";
import { parseCSV } from "./utils/parseCSV";
import { capFirst } from "./utils/strings";

dayjs.locale("fr");
dayjs.extend(customParseFormat);

/* =========================
   Utils
   ========================= */
const normType = (t) => ((t || "swim").toLowerCase() === "run" ? "run" : "swim");
const pluralize = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;
const formatDistance = (meters, nf) => {
  if (meters >= 1000) {
    const km = Math.round(meters / 100) / 10;
    return `${nf.format(km)} km`;
  }
  return `${nf.format(Math.round(meters))} m`;
};
const formatKmDecimal = (meters, nfDecimal) => `${nfDecimal.format(meters / 1000)} km`;
const weekOfMonthLabel = (date) => {
  const d = dayjs(date);
  const weekNum = Math.ceil(d.date() / 7);
  const ordinal = weekNum === 1 ? "1ere" : `${weekNum}eme`;
  const monthName = capFirst(d.format("MMMM"));
  const year = d.format("YYYY");
  const useApostrophe = /^[aeiouyàâäéèêëîïôöùûüœh]/i.test(monthName);
  const preposition = useApostrophe ? "d'" : "de ";
  return `${ordinal} semaine ${preposition}${monthName} ${year}`;
};
const parseDateValue = (value) => {
  if (value instanceof Date) return dayjs(value);
  if (typeof value === "number") return dayjs(value);
  const raw = String(value ?? "").trim();
  const formats = [
    "YYYY-MM-DD",
    "YYYY/MM/DD",
    "DD/MM/YYYY",
    "DD-MM-YYYY",
    "YYYY-MM-DDTHH:mm:ss.SSSZ",
    "YYYY-MM-DDTHH:mm:ssZ",
    "YYYY-MM-DD HH:mm:ss",
    "DD/MM/YYYY HH:mm",
    "DD/MM/YYYY HH:mm:ss",
    "DD-MM-YYYY HH:mm",
    "DD-MM-YYYY HH:mm:ss",
  ];
  const strictParsed = dayjs(raw, formats, true);
  if (strictParsed.isValid()) return strictParsed;
  const looseParsed = dayjs(raw, formats, false);
  return looseParsed.isValid() ? looseParsed : dayjs(raw);
};
const normalizeSessionDate = (value) => {
  const parsed = parseDateValue(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : value;
};
const normalizeSessionDistance = (value) => {
  if (typeof value === "number") return value;
  const cleaned = String(value ?? "").trim().replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};
const normalizeSession = (s) => ({
  ...s,
  date: normalizeSessionDate(s.date),
  distance: normalizeSessionDistance(s.distance),
});
const getInitialRange = () => {
  if (typeof window === "undefined") return "all";
  const w = window.innerWidth;
  if (w < 800) return "3m";
  if (w < 1280) return "6m";
  return "all";
};
const HEADER_SURFACE_CLASS = "bg-white/90 backdrop-blur dark:bg-slate-900/90";
const HEADER_TOP_PADDING_STYLE = { paddingTop: "calc(0.75rem + env(safe-area-inset-top))" };

/* =========================
   Mini segmented control
   ========================= */
function TypeSwitch({ value, onChange }) {
  const items = [
    { key: "all", label: "Mixte" },
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
   Filtre période (dropdown)
   ========================= */
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
  isBusy,
  isAuth,
  verifyAndLogin,
  logout,
  sessions,
  onAdd,
  onEdit,
  onDelete,
  onExport,
  onImport,
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

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const disabledCls = "opacity-60 cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/35" onClick={handleClose} aria-hidden="true" />

      <div className="absolute inset-0">
        <div className="h-full w-full bg-white dark:bg-slate-900">
          <div
            className={`flex items-center justify-between border-b px-4 pb-3 ${HEADER_SURFACE_CLASS} dark:border-slate-700`}
            style={HEADER_TOP_PADDING_STYLE}
          >
            <div className="flex items-center gap-2">
              {isAuth && (
                <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
                  <button
                    onClick={() => setTab("options")}
                    disabled={isBusy}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      tab === "options"
                        ? "bg-white shadow text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-300"
                    } ${isBusy ? disabledCls : ""}`}
                  >
                    Options
                  </button>
                  <button
                    onClick={() => setTab("history")}
                    disabled={isBusy}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      tab === "history"
                        ? "bg-white shadow text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-300"
                    } ${isBusy ? disabledCls : ""}`}
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
                  disabled={isBusy}
                  className={`rounded-xl bg-rose-600 px-3 py-2 text-sm text-white hover:bg-rose-500 ${
                    isBusy ? disabledCls : ""
                  }`}
                  title="Repasser en lecture seule"
                >
                  🔒 <span className="hidden sm:inline">Verrouiller</span>
                </button>
              )}
              <button
                onClick={handleClose}
                disabled={isBusy}
                className={`rounded-xl bg-slate-200 px-3 py-2 text-sm text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 ${
                  isBusy ? disabledCls : ""
                }`}
              >
                Fermer
              </button>
            </div>
          </div>

          <div className="h-[calc(100%-52px)] overflow-auto px-4 pb-10 pt-4 sm:px-6 sm:pb-10 sm:pt-5">
            {!isAuth ? (
              <form onSubmit={submit} className="mx-auto max-w-md space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Entre ton mot de passe pour activer l’édition.
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
                  <AddSessionForm onAdd={onAdd} onExport={onExport} onImport={onImport} readOnly={isBusy} />
                ) : (
                  <History sessions={sessions} onDelete={onDelete} onEdit={onEdit} readOnly={isBusy} />
                )}
              </div>
            )}
          </div>

          {isBusy && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <style>{`
                @keyframes orbit-spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes opacity-pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.6; }
                }
              `}</style>
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-32 w-32">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img src="/apple-touch-icon.png" alt="NaTrack" className="w-24 h-24" />
                  </div>
                  <div
                    className="absolute inset-0"
                    style={{ transform: "scaleY(0.7) rotate(-45deg)", transformOrigin: "center" }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ animation: "orbit-spin 1.4s linear infinite reverse" }}
                      aria-hidden="true"
                    >
                      <span
                        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2 h-3 w-3 rounded-full blur-[1px] bg-gradient-to-r from-indigo-500 to-emerald-500 dark:from-indigo-300 dark:to-emerald-300"
                        style={{ animation: "opacity-pulse 1.5s ease-in-out infinite" }}
                      />
                    </div>
                  </div>
                </div>
                <span className="sr-only">Chargement…</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   App principale
   ========================= */
export default function App() {
  const FORCE_LOADING = false;
  const { token: editToken, isAuth, checking, verifyAndLogin, logout: editLogout } = useEditAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const toastTimerRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [mode, setMode] = useState("all");   // all | swim | run
  const [range, setRange] = useState(getInitialRange); // all | month | 6m | 3m | 2026 | 2025

  const [loadingPhase, setLoadingPhase] = useState("loading"); // loading | fading | done
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    let delayTimer = null;
    let fadeTimer = null;
    const start = Date.now();
    const startFade = () => {
      if (!alive) return;
      setLoadingPhase("fading");
      fadeTimer = setTimeout(() => {
        if (alive) setLoadingPhase("done");
      }, 500);
    };
    (async () => {
      try {
        const data = await apiGet("/sessions");
        if (alive) {
          const normalized = (data || []).map((s) => normalizeSession(s));
          setSessions(normalized);
        }
      } catch (e) {
        if (alive) setError("Chargement impossible : " + (e?.message || "erreur inconnue"));
      } finally {
        const elapsed = Date.now() - start;
        const remaining = Math.max(1500 - elapsed, 0);
        if (!alive) return;
        if (remaining === 0) {
          startFade();
          return;
        }
        delayTimer = setTimeout(startFade, remaining);
      }
    })();
    return () => {
      alive = false;
      if (delayTimer) clearTimeout(delayTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const nf = useMemo(() => new Intl.NumberFormat("fr-FR"), []);
  const nfDecimal = useMemo(
    () => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    []
  );
  const monthKey = dayjs().format("YYYY-MM");
  const monthLabel = capFirst(dayjs().format("MMMM YYYY"));

  const modeLabel = mode === "swim" ? "Natation" : mode === "run" ? "Running" : null;
  const rangeLabel =
    range === "all"
      ? "tout l'historique"
      : range === "month"
        ? "ce mois-ci"
        : range === "3m"
          ? "les 3 derniers mois"
          : range === "6m"
            ? "les 6 derniers mois"
            : /^\d{4}$/.test(range)
              ? `l'annee ${range}`
              : "cette periode";
  const shoesStart = dayjs("2026-01-13");
  const shoesTargetMeters = 550 * 1000;

  /* ===== Filtre période ===== */
  const periodSessions = useMemo(() => {
    if (range === "all") return sessions;

    const now = dayjs();
    if (range === "month") {
      return sessions.filter((s) => dayjs(s.date).format("YYYY-MM") === monthKey);
    }
    if (range === "6m") {
      return sessions.filter((s) => dayjs(s.date).isAfter(now.subtract(6, "month")));
    }
    if (range === "3m") {
      return sessions.filter((s) => dayjs(s.date).isAfter(now.subtract(3, "month")));
    }

    return sessions.filter((s) => dayjs(s.date).format("YYYY") === range);
  }, [sessions, range]);

  /* ===== Filtre sport ===== */
  const shownSessions = useMemo(() => {
    if (mode === "all") return periodSessions;
    return periodSessions.filter((s) => normType(s.type) === mode);
  }, [periodSessions, mode]);

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
    const totalMeters = swimSum + runSum;

    return { swimAvg, runAvg, swimN, runN, totalN, swimSum, runSum, totalMeters };
  }, [shownSessions]);

  const sportTotals = useMemo(() => {
    let swimSum = 0, runSum = 0;
    shownSessions.forEach((s) => {
      const d = Number(s.distance) || 0;
      if (normType(s.type) === "run") runSum += d;
      else swimSum += d;
    });
    return { swimSum, runSum, total: swimSum + runSum };
  }, [shownSessions]);

  const records = useMemo(() => {
    let bestSwim = null;
    let bestRun = null;
    const weekTotals = new Map();
    const daysSet = new Set();
    const daySportCounts = new Map();

    shownSessions.forEach((s) => {
      const d = Number(s.distance) || 0;
      const t = normType(s.type);
      if (t === "run") {
        if (!bestRun || d > bestRun.distance) bestRun = { distance: d, date: s.date };
      } else {
        if (!bestSwim || d > bestSwim.distance) bestSwim = { distance: d, date: s.date };
      }

      const weekStart = dayjs(s.date).startOf("week");
      const key = weekStart.format("YYYY-MM-DD");
      const prev = weekTotals.get(key) || { total: 0, swim: 0, run: 0, weekStart: weekStart.toISOString() };
      prev.total += d;
      if (t === "run") prev.run += d;
      else prev.swim += d;
      weekTotals.set(key, prev);

      const dayKey = dayjs(s.date).format("YYYY-MM-DD");
      daysSet.add(dayKey);
      const dayPrev = daySportCounts.get(dayKey) || { swim: 0, run: 0 };
      if (t === "run") dayPrev.run += 1;
      else dayPrev.swim += 1;
      daySportCounts.set(dayKey, dayPrev);
    });

    let bestWeek = null;
    weekTotals.forEach((val) => {
      if (!bestWeek || val.total > bestWeek.total) bestWeek = val;
    });

    const days = Array.from(daysSet).sort();
    let streakBest = null;
    let streakLen = 0;
    let streakStart = null;
    let prevDay = null;
    let streakSwim = 0;
    let streakRun = 0;

    days.forEach((day) => {
      const dayCounts = daySportCounts.get(day) || { swim: 0, run: 0 };
      if (!prevDay) {
        streakLen = 1;
        streakStart = day;
        streakSwim = dayCounts.swim;
        streakRun = dayCounts.run;
      } else if (dayjs(day).diff(dayjs(prevDay), "day") === 1) {
        streakLen += 1;
        streakSwim += dayCounts.swim;
        streakRun += dayCounts.run;
      } else {
        streakLen = 1;
        streakStart = day;
        streakSwim = dayCounts.swim;
        streakRun = dayCounts.run;
      }

      if (!streakBest || streakLen > streakBest.length) {
        streakBest = {
          length: streakLen,
          start: streakStart,
          end: day,
          swim: streakSwim,
          run: streakRun,
        };
      }
      prevDay = day;
    });

    return { bestSwim, bestRun, bestWeek, streakBest };
  }, [shownSessions]);

  const progressGoals = useMemo(
    () => [
      { id: "paris-disneyland", label: "Paris → Disneyland", targetMeters: 45000, Icon: Car },
      { id: "paris-metz", label: "Paris → Metz", targetMeters: 330000, Icon: Train },
      { id: "paris-athenes", label: "Paris → Athènes", targetMeters: 2100000, Icon: Plane },
      { id: "tour-du-monde", label: "Tour du monde", targetMeters: 40075000, Icon: Globe },
    ],
    []
  );

  /* ===== Chaussures running (Nike Pegasus Premium) ===== */
  const shoesLife = useMemo(() => {
    let runMeters = 0;
    sessions.forEach((s) => {
      if (normType(s.type) !== "run") return;
      if (dayjs(s.date).isBefore(shoesStart, "day")) return;
      runMeters += Number(s.distance) || 0;
    });
    const used = Math.min(runMeters, shoesTargetMeters);
    const remaining = Math.max(shoesTargetMeters - runMeters, 0);
    const percent = shoesTargetMeters ? Math.min((runMeters / shoesTargetMeters) * 100, 100) : 0;
    return { used, remaining, percent };
  }, [sessions, shoesStart, shoesTargetMeters]);

  const shoesLifeByRange = useMemo(() => {
    const compute = (list) => {
      let runMeters = 0;
      list.forEach((s) => {
        if (normType(s.type) !== "run") return;
        if (dayjs(s.date).isBefore(shoesStart, "day")) return;
        runMeters += Number(s.distance) || 0;
      });
      const used = Math.min(runMeters, shoesTargetMeters);
      const remaining = Math.max(shoesTargetMeters - runMeters, 0);
      const percent = shoesTargetMeters ? Math.min((runMeters / shoesTargetMeters) * 100, 100) : 0;
      return { used, remaining, percent };
    };
    if (range === "6m") return compute(periodSessions);
    if (range === "3m") return compute(periodSessions);
    return shoesLife;
  }, [periodSessions, range, shoesLife, shoesStart, shoesTargetMeters]);

  /* ===== Séances ce mois-ci ===== */
  const monthCounts = useMemo(() => {
    let swimN = 0, runN = 0;
    shownSessions.forEach((s) => {
      if (dayjs(s.date).format("YYYY-MM") !== monthKey) return;
      if (normType(s.type) === "run") runN += 1;
      else swimN += 1;
    });
    return { swimN, runN, totalN: swimN + runN };
  }, [shownSessions, monthKey]);

  const monthCompare = useMemo(() => {
    const now = dayjs();
    const currentKey = now.format("YYYY-MM");
    const lastMonth = now.subtract(1, "month");
    const lastKey = lastMonth.format("YYYY-MM");
    const currentDay = now.date();
    const lastMonthDay = Math.min(currentDay, lastMonth.daysInMonth());

    let currentTotal = 0;
    let lastTotal = 0;
    let currentToDay = 0;
    let lastToDay = 0;

    shownSessions.forEach((s) => {
      const d = dayjs(s.date);
      const key = d.format("YYYY-MM");
      const dist = Number(s.distance) || 0;
      if (key === currentKey) {
        currentTotal += dist;
        if (d.date() <= currentDay) currentToDay += dist;
      } else if (key === lastKey) {
        lastTotal += dist;
        if (d.date() <= lastMonthDay) lastToDay += dist;
      }
    });

    return {
      currentTotal,
      lastTotal,
      currentToDay,
      lastToDay,
      currentDay,
      lastMonthDay,
      currentLabel: capFirst(now.format("MMMM YYYY")),
      lastLabel: capFirst(lastMonth.format("MMMM YYYY")),
    };
  }, [shownSessions]);

  const showCompareInline = range === "3m" || range === "6m";
  const showCompareAbove = range === "all";
  const compareTotalWinner =
    monthCompare.currentTotal === monthCompare.lastTotal
      ? "tie"
      : monthCompare.currentTotal > monthCompare.lastTotal
        ? "current"
        : "last";
  const compareToDayWinner =
    monthCompare.currentToDay === monthCompare.lastToDay
      ? "tie"
      : monthCompare.currentToDay > monthCompare.lastToDay
        ? "current"
        : "last";
  const comparePanel = (
    <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
      <div className="flex flex-col gap-1 border-b px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          📅 Comparatif mensuel — {mode === "all" ? "Mixte" : modeLabel}
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
          {monthCompare.currentLabel} vs {monthCompare.lastLabel}
        </span>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        {(() => {
          const totalWinner = compareTotalWinner;
          const totalDenom = monthCompare.currentTotal + monthCompare.lastTotal;
          const totalMarker = totalDenom > 0 ? (monthCompare.currentTotal / totalDenom) * 100 : 50;
          const toDayWinner = compareToDayWinner;
          const toDayDenom = monthCompare.currentToDay + monthCompare.lastToDay;
          const toDayMarker = toDayDenom > 0 ? (monthCompare.currentToDay / toDayDenom) * 100 : 50;

          return (
            <>
              <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>Total des mois</span>
                  {totalWinner !== "tie" && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                      <Trophy size={14} />
                      {totalWinner === "current" ? monthCompare.currentLabel : monthCompare.lastLabel}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>{monthCompare.currentLabel}</span>
                    <span className="font-semibold">
                      {formatKmDecimal(monthCompare.currentTotal, nfDecimal)}
                    </span>
                  </div>
                  <div
                    className={`relative h-2 w-full rounded-full overflow-hidden ${
                      totalDenom > 0 ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    {totalDenom > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                        style={{ width: `${totalMarker}%` }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>{monthCompare.lastLabel}</span>
                    <span className="font-semibold">
                      {formatKmDecimal(monthCompare.lastTotal, nfDecimal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>A date (J{monthCompare.currentDay} vs J{monthCompare.lastMonthDay})</span>
                  {toDayWinner !== "tie" && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                      <Trophy size={14} />
                      {toDayWinner === "current" ? monthCompare.currentLabel : monthCompare.lastLabel}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>{monthCompare.currentLabel}</span>
                    <span className="font-semibold">
                      {formatKmDecimal(monthCompare.currentToDay, nfDecimal)}
                    </span>
                  </div>
                  <div
                    className={`relative h-2 w-full rounded-full overflow-hidden ${
                      toDayDenom > 0 ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    {toDayDenom > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                        style={{ width: `${toDayMarker}%` }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>{monthCompare.lastLabel}</span>
                    <span className="font-semibold">
                      {formatKmDecimal(monthCompare.lastToDay, nfDecimal)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );

  /* ===== Dernière séance ===== */
  const lastSession = useMemo(() => {
    if (!shownSessions.length) return null;
    return shownSessions.reduce((best, s) => {
      if (!best) return s;
      return dayjs(s.date).isAfter(best.date) ? s : best;
    }, null);
  }, [shownSessions]);

  const firstSessionLabel = useMemo(() => {
    if (!shownSessions.length) return null;
    const first = shownSessions.reduce((best, s) => {
      if (!best) return s;
      return dayjs(s.date).isBefore(best.date) ? s : best;
    }, null);
    return first ? capFirst(dayjs(first.date).format("dddd DD MMM YYYY")) : null;
  }, [shownSessions]);

  const lastSessionDay = useMemo(() => (lastSession ? dayjs(lastSession.date) : null), [lastSession]);
  const daysSinceLast = useMemo(() => (lastSessionDay ? dayjs().diff(lastSessionDay, "day") : null), [lastSessionDay]);
  const lastLabel = lastSessionDay ? capFirst(lastSessionDay.format("dddd DD MMM YYYY")) : "Aucune";
  const lastType = lastSession ? normType(lastSession.type) : null;

  const showToast = (message) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 2400);
  };

  const withBusy = async (fn) => {
    setIsBusy(true);
    const start = Date.now();
    try {
      return await fn();
    } finally {
      const elapsed = Date.now() - start;
      const minDelay = 500;
      if (elapsed < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - elapsed));
      }
      setIsBusy(false);
    }
  };

  /* ===== CRUD ===== */
  const guard = (fn) => async (...args) => {
    if (checking) return;
    if (!isAuth) { setShowEditModal(true); return; }
    return fn(...args);
  };

  const addSession = guard(async (payload) => {
    await withBusy(async () => {
      const body = { id: payload.id, distance: payload.distance, date: payload.date, type: payload.type };
      const created = await apiJson("POST", "/sessions", body, editToken);
      setSessions((prev) => [...prev, normalizeSession(created)]);
    });
    setShowEditModal(false);
    showToast("Seance ajoutee");
  });

  const deleteSession = guard(async (id) => {
    if (!window.confirm("Confirmer la suppression de cette seance ?")) return;
    await withBusy(async () => {
      await apiJson("DELETE", `/sessions/${id}`, undefined, editToken);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    });
    setShowEditModal(false);
    showToast("Seance supprimee");
  });

  const editSession = guard(async (id, updated) => {
    await withBusy(async () => {
      await apiJson("PUT", `/sessions/${id}`, updated, editToken);
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? normalizeSession({ ...s, ...updated }) : s))
      );
    });
    setShowEditModal(false);
    showToast("Seance modifiee");
  });

  const importCSV = guard(async (file) => {
    if (!file) return;
    if (!window.confirm("Confirmer l'import du fichier CSV ?")) return;
    const imported = await withBusy(async () => {
      const text = await file.text();
      const rows = parseCSV(text);
      const normalized = [];

      rows.forEach((row) => {
        if (!row || row.length < 2) return;
        const date = String(row[0] ?? "").trim();
        if (!date || date.toLowerCase() === "date") return;
        const parsedDate = parseDateValue(date);
        if (!parsedDate.isValid()) return;
        const distance = Number(String(row[1] ?? "").trim().replace(",", "."));
        if (!Number.isFinite(distance)) return;
        const typeRaw = String(row[2] ?? "").trim();
        const type = typeRaw ? normType(typeRaw) : "swim";
        normalized.push({ date: parsedDate.format("YYYY-MM-DD"), distance, type });
      });

      if (!normalized.length) return 0;

      const created = [];
      for (const row of normalized) {
        const body = { id: uuidv4(), distance: row.distance, date: row.date, type: row.type };
        const item = await apiJson("POST", "/sessions", body, editToken);
        created.push(item);
      }
      if (created.length) setSessions((prev) => [...prev, ...created.map(normalizeSession)]);
      return created.length;
    });

    if (imported) {
      setShowEditModal(false);
      showToast("Import termine");
    }
  });

  const exportCSV = async () => {
    await withBusy(() => {
      downloadCSV("sessions.csv", sessions);
    });
    setShowEditModal(false);
    showToast("Export termine");
  };

  if (loadingPhase !== "done" || FORCE_LOADING) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50 dark:from-[#0b1020] dark:via-[#0a1028] dark:to-[#0b1228] flex items-center justify-center ${
          loadingPhase === "fading" && !FORCE_LOADING
            ? "animate-[fade-out_0.5s_ease-in-out_forwards]"
            : ""
        }`}
      >
        <style>{`
          @keyframes orbit-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fade-out {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes opacity-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.2; transform: scale(4); }
          }
        `}</style>
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-32 w-32">
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="/apple-touch-icon.png"
                alt="NaTrack"
                className={`w-24 h-24 transition-all duration-700 ease-in-out ${
                  loadingPhase === "fading" && !FORCE_LOADING ? "scale-[10] blur-sm opacity-0" : ""
                }`}
              />
            </div>
            <div
              className="absolute inset-0"
              style={{ transform: "scaleY(0.8) rotate(-75deg)", transformOrigin: "center" }}
            >
              <div
                className="absolute inset-0"
                style={{ animation: "orbit-spin 1.4s linear infinite reverse" }}
                aria-hidden="true"
              >
                <span
                  className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2 h-3 w-3 rounded-full blur-[4px] bg-gradient-to-r from-indigo-500 to-emerald-500 dark:from-indigo-300 dark:to-emerald-300"
                  style={{ animation: "opacity-pulse 1.4s ease-in-out infinite" }}
                />
              </div>
            </div>
          </div>
          <span className="sr-only">Chargement…</span>
        </div>
      </div>
    );
  }

  const showMonthCardsOnlyWhenAllRange = range === "all";
  const showMonthlyChart = range !== "month";
  const hasSessions = shownSessions.length > 0;

  return (
    <div
      className="
        min-h-screen
        relative
        bg-gradient-to-b
        from-slate-100 via-slate-50 to-slate-50
        dark:from-[#0b1020] dark:via-[#0a1028] dark:to-[#0b1228]
        text-[13.5px] sm:text-[14px]
      "
    >
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center">
        <img
          src="/apple-touch-icon.png"
          alt=""
          aria-hidden="true"
          className="w-[90vw] max-w-[1200px] opacity-[0.48] blur-2xl dark:opacity-[0.32]"
        />
      </div>

      <div className="relative z-10">
        {/* HEADER sticky */}
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
          {/* Ligne 1 : logo + toggle + éditeur */}
          <div className="flex items-center gap-2 w-full xl:w-auto">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-slate-900 dark:text-slate-100 flex items-center gap-2 whitespace-nowrap">
              <img src="/big-logo.png" alt="Logo" className="h-9" />
            </h1>

            <ThemeToggle />

            <button
              onClick={() => setShowEditModal(true)}
              className={`ml-auto xl:ml-2 rounded-xl px-3 py-2 text-sm transition ${
                isAuth ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-amber-500 text-white hover:bg-amber-400"
              }`}
              title={isAuth ? "Ouvrir l’éditeur" : "Déverrouiller l’édition"}
            >
              <span className="inline-flex items-center gap-1.5">
                {isAuth ? "✏️" : "🔓"}
                <span className="hidden sm:inline">{isAuth ? "Éditeur" : "Éditer"}</span>
              </span>
            </button>
          </div>

          {/* Ligne 2 (MOBILE) : dropdown à gauche + switch à droite */}
          <div className="flex items-center justify-between gap-3 xl:hidden">
            <RangeSelect value={range} onChange={setRange} />
            <TypeSwitch value={mode} onChange={setMode} />
          </div>

          {/* DESKTOP : dropdown à gauche du switch (dans le même bloc à droite) */}
          <div className="hidden xl:flex items-center justify-end gap-3">
            <RangeSelect value={range} onChange={setRange} />
            <TypeSwitch value={mode} onChange={setMode} />
          </div>
        </header>

        <main className="pb-6" style={{ paddingTop: "var(--main-top-padding)" }}>
        <div className="mx-auto max-w-[1550px]">
        {error && (
          <p className="mb-3 rounded-xl bg-rose-100 px-4 py-2 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
            {error}
          </p>
        )}

        {toast && (
          <>
            <style>{`
              @keyframes toast-slide {
                0% { opacity: 0; transform: translate(-50%, -16px); }
                12% { opacity: 1; transform: translate(-50%, 0); }
                85% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, -16px); }
              }
            `}</style>
            <div
              className="fixed left-1/2 top-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-lg"
              style={{ animation: "toast-slide 2.4s ease-in-out" }}
            >
              <CheckCircle2 size={16} />
              <span>{toast}</span>
            </div>
          </>
        )}

        {isBusy && (
          <div className="fixed inset-0 z-[60] bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-center">
            <style>{`
              @keyframes orbit-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes opacity-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
              }
            `}</style>
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-32 w-32">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src="/apple-touch-icon.png" alt="NaTrack" className="w-24 h-24" />
                </div>
                <div
                  className="absolute inset-0"
                  style={{ transform: "scaleY(0.7) rotate(-45deg)", transformOrigin: "center" }}
                >
                  <div
                    className="absolute inset-0"
                    style={{ animation: "orbit-spin 1.4s linear infinite reverse" }}
                    aria-hidden="true"
                  >
                    <span
                      className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2 h-3 w-3 rounded-full blur-[1px] bg-gradient-to-r from-indigo-500 to-emerald-500 dark:from-indigo-300 dark:to-emerald-300"
                      style={{ animation: "opacity-pulse 1.5s ease-in-out infinite" }}
                    />
                  </div>
                </div>
              </div>
              <span className="sr-only">Chargement…</span>
            </div>
          </div>
        )}

        {!hasSessions ? (
          <Reveal as="section" className="px-4 xl:px-8 pt-4 pb-8">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-8 text-center text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              <div className="text-lg font-semibold">Aucune seance</div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Aucune seance pour {mode === "all" ? "tous les sports" : modeLabel.toLowerCase()} sur {rangeLabel}.
              </p>
            </div>
          </Reveal>
        ) : (
        <>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_3fr] gap-4 items-start px-4 xl:px-8 pt-4 pb-4 xl:pt-3 xl:pb-4">
        {/* GAUCHE : KPI */}
        <Reveal as="aside" className="self-start">
          <div className="grid grid-cols-1 min-[800px]:grid-cols-2 xl:grid-cols-1 gap-4">
            {/* (AFFICHER UNIQUEMENT SI range === "all") : Dernière séance */}
            {showMonthCardsOnlyWhenAllRange && (
              <KpiChip
                title="Dernière séance"
                subtitle={mode === "all" ? lastLabel : `${modeLabel} · ${lastLabel}`}
                subtitleClassName="capitalize"
                value={
                  <div className="text-right">
                    {daysSinceLast !== null ? (
                      <div className="mt-1 flex justify-end gap-2 flex-wrap items-center">
                        <div className="font-bold leading-none flex items-baseline">
                          {nf.format(daysSinceLast)}
                          <span className="ml-1 text-xs opacity-70 leading-none">
                            jour{daysSinceLast > 1 ? "s" : ""}
                          </span>
                        </div>

                        {mode === "all" && lastType && (
                          <TypePill type={lastType}>
                            {lastType === "run" ? "Running" : "Natation"}
                          </TypePill>
                        )}
                      </div>
                    ) : (
                      <div className="font-bold">—</div>
                    )}
                  </div>
                }
                icon={<CalendarCheck />}
                tone={daysSinceLast > 4 ? "danger" : "default"}
              />
            )}

            {/* (AFFICHER UNIQUEMENT SI range === "all") : Total du mois */}
            {showMonthCardsOnlyWhenAllRange && (
              <KpiChip
                title="Total du mois"
                subtitle={mode === "all" ? monthLabel : modeLabel}
                subtitleClassName="capitalize"
                value={
                  <div className="text-right">
                    <div className="font-bold">
                      <AnimatedNumber value={monthTotals.all} format={(n) => nf.format(Math.round(n))} />{" "}
                      <span className="text-xs opacity-70">m</span>
                    </div>
                    {mode === "all" && (
                      <div className="mt-1 flex justify-end gap-2 flex-wrap">
                        <TypePill type="swim">{nf.format(monthTotals.swim)} m</TypePill>
                        <TypePill type="run">{nf.format(monthTotals.run)} m</TypePill>
                      </div>
                    )}
                  </div>
                }
                icon={<Calculator />}
              />
            )}

            {/* (AFFICHER UNIQUEMENT SI range === "all") : Séances ce mois-ci */}
            {showMonthCardsOnlyWhenAllRange && (
              <KpiChip
                title="Séances ce mois-ci"
                subtitle={mode === "all" ? monthLabel : modeLabel}
                subtitleClassName="capitalize"
                value={
                  <div className="text-right">
                    <div className="font-bold">
                      <AnimatedNumber value={monthCounts.totalN} format={(n) => nf.format(Math.round(n))} />{" "}
                      {monthCounts.totalN > 1 ? "Séances" : "Séance"}
                    </div>
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
            )}

             {/* ✅ Toujours affiché : Moyenne / séance */}
            <KpiChip
              title="Moyenne / séance"
              subtitle={mode === "all" ? "Par sport" : modeLabel}
              value={
                mode === "all" ? (
                  <div className="mt-1 flex justify-end gap-2 flex-wrap">
                    <TypePill type="swim">
                      {nf.format(stats.swimAvg)} <span className="opacity-80">m</span>
                    </TypePill>
                    <TypePill type="run">
                      {nf.format(stats.runAvg)} <span className="opacity-80">m</span>
                    </TypePill>
                  </div>
                ) : (
                  <div className="text-right font-bold">
                    <AnimatedNumber
                      value={mode === "swim" ? stats.swimAvg : stats.runAvg}
                      format={(n) => nf.format(Math.round(n))}
                    />{" "}
                    <span className="text-xs opacity-70">m</span>
                  </div>
                )
              }
              icon={<Gauge />}
            />

            {mode === "run" &&
              (range === "all" || range === "month" || range === "6m" || range === "3m" || range === "2026") && (
              <KpiChip
                title="Chaussures"
                subtitle={
                  <span className="block">
                    <span className="block">Pegasus</span>
                  </span>
                }
                subtitleClassName="whitespace-normal leading-tight"
                value={
                  <div className="text-right">
                    <div className="font-bold">
                      {nfDecimal.format(shoesLifeByRange.remaining / 1000)}{" "}
                      <span className="text-xs opacity-70">
                        km restants ({nfDecimal.format(shoesLifeByRange.used / 1000)} / 550)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-emerald-500"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${shoesLifeByRange.percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        viewport={{ once: true, amount: 0.4 }}
                      />
                    </div>
                  </div>
                }
                icon={<Footprints />}
              />
            )}

             {/* ✅ Toujours affiché : Total métrage */}
            <KpiChip
              title="Distance totale"
              subtitle={mode === "all" ? "Total" : modeLabel}
              value={
                <div className="text-right">
                  <div className="font-bold">
                    <AnimatedNumber value={stats.totalMeters} format={(n) => nf.format(Math.round(n))} />{" "}
                    <span className="text-xs opacity-70">m</span>
                  </div>
                  {mode === "all" && (
                    <div className="mt-1 flex justify-end gap-2 flex-wrap">
                      <TypePill type="swim">{nf.format(stats.swimSum)} m</TypePill>
                      <TypePill type="run">{nf.format(stats.runSum)} m</TypePill>
                    </div>
                  )}
                </div>
              }
              icon={<Calculator />}
            />

            {/* ✅ Toujours affiché : Séances (total) */}
            <KpiChip
              title="Séances totales"
              subtitle={mode === "all" ? "Total" : modeLabel}
              value={
                <div className="text-right">
                  <div className="font-bold">
                    <AnimatedNumber value={stats.totalN} format={(n) => nf.format(Math.round(n))} />{" "}
                    {stats.totalN > 1 ? "Séances" : "Séance"}
                  </div>
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

            {showCompareInline && (
              <>
                <KpiChip
                  title="Comparatif"
                  subtitle={`${mode === "all" ? "Mixte" : modeLabel}`}
                  value={
                    <div className="text-right">
                      <div className="font-bold">
                        <span className="text-base">
                          {nfDecimal.format(monthCompare.currentTotal / 1000)}
                          <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">km</span>
                        </span>{" "}
                        <span className="text-xs text-slate-500 dark:text-slate-400">vs</span>{" "}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatKmDecimal(monthCompare.lastTotal, nfDecimal)}
                        </span>
                      </div>
                      <div
                        className={`h-2 w-full rounded-full overflow-hidden ${
                          compareTotalWinner === "tie" && monthCompare.currentTotal === 0
                            ? "bg-slate-200 dark:bg-slate-700"
                            : "bg-indigo-500"
                        }`}
                      >
                        {monthCompare.currentTotal + monthCompare.lastTotal > 0 && (
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${(monthCompare.currentTotal / (monthCompare.currentTotal + monthCompare.lastTotal)) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {compareTotalWinner === "tie" ? (
                          "Egalite"
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                            <Trophy size={14} />
                            {(compareTotalWinner === "current"
                              ? monthCompare.currentLabel
                              : monthCompare.lastLabel
                            ).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  }
                  icon={<Trophy />}
                />
                <KpiChip
                  title={`Comparatif au ${monthCompare.currentDay}`}
                  subtitle={`${mode === "all" ? "Mixte" : modeLabel} à date`}
                  value={
                    <div className="text-right">
                      <div className="font-bold">
                        <span className="text-base">
                          {nfDecimal.format(monthCompare.currentToDay / 1000)}
                          <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">km</span>
                        </span>{" "}
                        <span className="text-xs text-slate-500 dark:text-slate-400">vs</span>{" "}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatKmDecimal(monthCompare.lastToDay, nfDecimal)}
                        </span>
                      </div>
                      <div
                        className={`h-2 w-full rounded-full overflow-hidden ${
                          compareToDayWinner === "tie" && monthCompare.currentToDay === 0
                            ? "bg-slate-200 dark:bg-slate-700"
                            : "bg-indigo-500"
                        }`}
                      >
                        {monthCompare.currentToDay + monthCompare.lastToDay > 0 && (
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${(monthCompare.currentToDay / (monthCompare.currentToDay + monthCompare.lastToDay)) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {compareToDayWinner === "tie" ? (
                          "Egalite"
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                            <Trophy size={14} />
                            {(compareToDayWinner === "current"
                              ? monthCompare.currentLabel
                              : monthCompare.lastLabel
                            ).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  }
                  icon={<CalendarDays />}
                />
              </>
            )}
          </div>
        </Reveal>

        {/* DROITE : graphes */}
        <Reveal as="section" className="flex flex-col gap-4 self-start">
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">📈 Séances</h2>
            </div>
            <div className="p-4">
              <SwimChart sessions={shownSessions} mode={mode} />
            </div>
          </div>

          {showMonthlyChart && (
            <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
              <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">📊 Cumulatif par mois</h2>
              </div>
              <div className="p-4">
                <MonthlyBarChart sessions={shownSessions} />
              </div>
            </div>
          )}
        </Reveal>
        </div>

        {showCompareAbove && (
          <Reveal as="section" className="px-4 xl:px-8 pb-4">
            {comparePanel}
          </Reveal>
        )}

        <Reveal as="section" className="px-4 xl:px-8 pb-4">
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex flex-col gap-1 border-b px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">🎯 Objectifs distance</h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                <span className="mr-2">Parcouru :</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  <AnimatedNumber value={stats.totalMeters / 1000} format={(n) => nfDecimal.format(n)} /> km
                </span>
              </div>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
              {progressGoals.map((goal) => {
                const percent = goal.targetMeters
                  ? (stats.totalMeters / goal.targetMeters) * 100
                  : 0;
                const barPercent = Math.min(percent, 100);
                const target = formatDistance(goal.targetMeters, nf);
                const completedTimes = goal.targetMeters
                  ? Math.floor(stats.totalMeters / goal.targetMeters)
                  : 0;
                const remainingMeters = goal.targetMeters
                  ? Math.max(goal.targetMeters - stats.totalMeters, 0)
                  : 0;
                const remainingKm = formatKmDecimal(remainingMeters, nfDecimal);

                return (
                  <div
                    key={goal.id}
                    className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <goal.Icon size={16} className="text-slate-700 dark:text-slate-200" />
                        {goal.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{target}</div>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-indigo-500"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${barPercent}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        viewport={{ once: true, amount: 0.4 }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span>
                        {completedTimes > 0
                          ? `${formatDistance(stats.totalMeters, nf)} · ${completedTimes}× atteint`
                          : `${remainingKm} restant`}
                      </span>
                      <span>{Math.round(percent)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal as="section" className="px-4 xl:px-8 pb-4">
          <div className={`grid gap-4 ${mode === "all" ? "md:grid-cols-2" : ""}`}>
            <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
              <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">🏅 Records</h2>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                {mode !== "run" && (
                  <div
                    className={`rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700 ${
                      mode === "swim" ? "sm:col-span-2" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <Waves size={14} />
                      <span>Natation</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {records.bestSwim
                        ? `${formatKmDecimal(records.bestSwim.distance, nfDecimal)} · ${capFirst(
                            dayjs(records.bestSwim.date).format("DD MMM YYYY")
                          )}`
                        : "—"}
                    </div>
                  </div>
                )}

                {mode !== "swim" && (
                  <div
                    className={`rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700 ${
                      mode === "run" ? "sm:col-span-2" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <PersonStanding size={14} />
                      <span>Running</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {records.bestRun
                        ? `${formatKmDecimal(records.bestRun.distance, nfDecimal)} · ${capFirst(
                            dayjs(records.bestRun.date).format("DD MMM YYYY")
                          )}`
                        : "—"}
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700 sm:col-span-2">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <CalendarDays size={14} />
                    <span>Meilleure semaine</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {records.bestWeek
                      ? `${formatKmDecimal(records.bestWeek.total, nfDecimal)} · ${weekOfMonthLabel(
                          records.bestWeek.weekStart
                        )}`
                      : "—"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {records.bestWeek
                      ? records.bestWeek.run === records.bestWeek.swim
                        ? "Mixte"
                        : records.bestWeek.run > records.bestWeek.swim
                          ? "Running"
                          : "Natation"
                      : "—"}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700 sm:col-span-2">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <Gauge size={14} />
                    <span>Série la plus longue</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {records.streakBest
                      ? `${records.streakBest.length} jour${records.streakBest.length > 1 ? "s" : ""} · du ${capFirst(
                          dayjs(records.streakBest.start).format("DD MMM YYYY")
                        )} au ${capFirst(dayjs(records.streakBest.end).format("DD MMM YYYY"))}`
                      : "—"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {records.streakBest
                      ? `${records.streakBest.swim} natation · ${records.streakBest.run} running`
                      : "—"}
                  </div>
                </div>
              </div>
            </div>

            {mode === "all" && (
              <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
                <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">⚖️ Répartition par sport</h2>
                </div>
                <div className="p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Par distance
                      </div>
                      <SportSharePie
                        swimValue={sportTotals.swimSum}
                        runValue={sportTotals.runSum}
                        unitLabel="km"
                        formatValue={(value) => nfDecimal.format(value / 1000)}
                        heightClass="h-60 sm:h-44"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Par séances
                      </div>
                      <SportSharePie
                        swimValue={stats.swimN}
                        runValue={stats.runN}
                        unitLabel="séance"
                        formatValue={(value) => nf.format(value)}
                        heightClass="h-60 sm:h-44"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal as="section" className="px-4 xl:px-8 pb-8">
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex flex-col gap-1 border-b px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">🗓️ Calendrier d'activité</h2>
              {firstSessionLabel && (
                <span className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                  1ere seance :{" "}
                  <span className="font-semibold tracking-wide text-slate-700 dark:text-slate-200">
                    {firstSessionLabel}
                  </span>
                </span>
              )}
            </div>
            <div className="p-4">
              <CalendarHeatmap sessions={shownSessions} range={range} />
            </div>
          </div>
        </Reveal>

        </>
        )}
        </div>
        </main>
      </div>

      <EditModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        isBusy={isBusy}
        isAuth={isAuth}
        verifyAndLogin={verifyAndLogin}
        logout={editLogout}
        sessions={sessions}
        onAdd={addSession}
        onEdit={editSession}
        onDelete={deleteSession}
        onExport={exportCSV}
        onImport={importCSV}
      />
    </div>
  );
}
