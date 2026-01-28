// App.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/fr";
import { v4 as uuidv4 } from "uuid";
import { AppHeader } from "./sections/AppHeader";
import { EditModal } from "./sections/EditModal";
import { Dashboard } from "./sections/Dashboard";
import { GlobalDashboard } from "./sections/GlobalDashboard";
import { LoadingScreen } from "./sections/LoadingScreen";
import { BusyOverlay } from "./sections/BusyOverlay";
import { UserCardsPage } from "./sections/UserCardsPage";
import { Toast } from "./components/Toast";
import { useEditAuth } from "./hooks/useEditAuth";
import { apiGet, apiJson } from "./utils/api";
import { downloadCSV } from "./utils/downloadCSV";
import { parseCSV } from "./utils/parseCSV";
import { capFirst } from "./utils/strings";
import { getInitialRange, normType, normalizeSession, parseDateValue } from "./utils/appUtils";

dayjs.locale("fr");
dayjs.extend(customParseFormat);

const slugify = (value) => {
  const clean = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return clean || "";
};

const getUserSlug = (user) => slugify(user?.slug || user?.name || "");

const readRouteState = () => {
  if (typeof window === "undefined") return { type: "root", slug: null };
  const path = window.location.pathname || "/";
  const userMatch = path.match(/^\/user\/([^/]+)\/?$/);
  if (userMatch) return { type: "user", slug: decodeURIComponent(userMatch[1]) };
  if (path.match(/^\/cards\/?$/)) return { type: "cards", slug: null };
  return { type: "root", slug: null };
};

const readCardParam = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("card") === "open";
};

const buildUserPath = (slug, withCard = false) =>
  `/user/${encodeURIComponent(slug)}${withCard ? "?card=open" : ""}`;
const buildCardsPath = () => "/cards";

/* =========================
   App principale
   ========================= */
export default function App() {
  const FORCE_LOADING = false;
  const { token: authToken, user, isAuth, checking, login, logout: editLogout } = useEditAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCardsPage, setShowCardsPage] = useState(false);
  const [cardsFilter, setCardsFilter] = useState("mixte");
  const [toast, setToast] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const toastTimerRef = useRef(null);
  const didInitScrollRef = useRef(false);
  const prevAuthRef = useRef(isAuth);
  const prevUserIdRef = useRef(user?.id || null);
  const swipeRef = useRef({ x: 0, y: 0, t: 0, moved: false });
  const didInitHistoryRef = useRef(false);

  const [sessions, setSessions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState("run");   // all | swim | run
  const [range, setRange] = useState(getInitialRange); // all | month | 6m | 3m | 2026 | 2025
  const [routeState, setRouteState] = useState(readRouteState);
  const [userCardOpen, setUserCardOpen] = useState(readCardParam);

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
    let alive = true;
    (async () => {
      try {
        const data = await apiGet("/users/public");
        if (alive) setUsers(data || []);
      } catch {
        if (!alive) return;
        setUsers([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onPop = () => {
      const next = readRouteState();
      setRouteState(next);
      setUserCardOpen(readCardParam());
      if (next.type === "root") {
        setShowCardsPage(false);
        setSelectedUser(null);
      }
      if (next.type === "cards") {
        if (!isAuth) {
          setShowCardsPage(false);
          setSelectedUser(null);
        } else {
          setShowCardsPage(true);
          setSelectedUser(null);
        }
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isAuth]);

  useEffect(() => {
    if (didInitHistoryRef.current) return;
    didInitHistoryRef.current = true;
    const path = window.location.pathname || "/";
    const isUser = path.match(/^\/user\/([^/]+)\/?$/);
    const isCards = path.match(/^\/cards\/?$/);
    if (!isUser && !isCards) return;
    if (window.history.length > 1) return;
    window.history.replaceState({}, "", "/");
    window.history.pushState({}, "", path);
  }, []);

  useEffect(() => {
    if (!didInitScrollRef.current) {
      didInitScrollRef.current = true;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [range, mode]);

  useEffect(() => {
    if (!showCardsPage) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [showCardsPage, cardsFilter]);

  useEffect(() => {
    if (!selectedUser) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedUser]);

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
      ? "Tout l'historique"
      : range === "month"
        ? "Ce mois-ci"
        : range === "3m"
          ? "Les 3 derniers mois"
          : range === "6m"
            ? "Les 6 derniers mois"
            : /^\d{4}$/.test(range)
              ? `L'annee ${range}`
              : "Cette periode";
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  useEffect(() => {
    const wasAuth = prevAuthRef.current;
    const prevUserId = prevUserIdRef.current;
    if (!isAuth || isAdmin || !user) {
      prevAuthRef.current = isAuth;
      prevUserIdRef.current = user?.id || null;
      return;
    }
    const justLoggedIn = !wasAuth && isAuth;
    const userChanged = prevUserId && prevUserId !== user.id;
    if (justLoggedIn || userChanged) {
      setShowEditModal(false);
    }
    prevAuthRef.current = isAuth;
    prevUserIdRef.current = user.id;
  }, [isAuth, isAdmin, user, selectedUser]);

  useEffect(() => {
    if (showEditModal && isAuth && !selectedUser) {
      setShowEditModal(false);
    }
  }, [showEditModal, isAuth, selectedUser]);

  const getSessionsBasePath = () => {
    if (isAdmin && selectedUser && user?.id !== selectedUser.id) {
      return `/users/${selectedUser.id}/sessions`;
    }
    return "/me/sessions";
  };

  const userSessions = useMemo(() => {
    if (!selectedUser) return [];
    return sessions.filter((s) => s.user_id === selectedUser.id);
  }, [sessions, selectedUser]);

  const globalPeriodSessions = useMemo(() => {
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
  }, [sessions, range, monthKey]);

  const globalShownSessions = useMemo(() => {
    if (mode === "all") return globalPeriodSessions;
    return globalPeriodSessions.filter((s) => normType(s.type) === mode);
  }, [globalPeriodSessions, mode]);

  const monthTotalsByUser = useMemo(() => {
    const map = {};
    globalShownSessions.forEach((s) => {
      if (!s.user_id) return;
      map[s.user_id] = (map[s.user_id] || 0) + (Number(s.distance) || 0);
    });
    return map;
  }, [globalShownSessions]);

  const derivedUsers = useMemo(() => {
    if (users.length) return users;
    const map = new Map();
    sessions.forEach((s) => {
      if (!s.user_id) return;
      if (!map.has(s.user_id)) {
        map.set(s.user_id, { id: s.user_id, name: s.user_name || "Utilisateur" });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [users, sessions]);

  const usersForRouting = useMemo(() => (users.length ? users : derivedUsers), [users, derivedUsers]);

  const userBySlug = useMemo(() => {
    const map = new Map();
    usersForRouting.forEach((u) => {
      const slug = getUserSlug(u);
      if (slug && !map.has(slug)) map.set(slug, u);
    });
    return map;
  }, [usersForRouting]);

  const globalUsers = useMemo(() => {
    if (!derivedUsers.length) return derivedUsers;
    return derivedUsers.filter((u) => !u.is_bot || (monthTotalsByUser?.[u.id] || 0) > 0);
  }, [derivedUsers, monthTotalsByUser]);

  const userRunningAvgById = useMemo(() => {
    const cutoff = dayjs().subtract(3, "month").startOf("day").valueOf();
    const totals = new Map();
    const counts = new Map();
    sessions.forEach((s) => {
      if (!s?.user_id) return;
      if (String(s.type || "").toLowerCase() !== "run") return;
      if (dayjs(s.date).valueOf() < cutoff) return;
      const dist = Number(s.distance) || 0;
      totals.set(s.user_id, (totals.get(s.user_id) || 0) + dist);
      counts.set(s.user_id, (counts.get(s.user_id) || 0) + 1);
    });
    const avg = new Map();
    totals.forEach((totalDist, userId) => {
      const count = counts.get(userId) || 0;
      if (count > 0) avg.set(userId, totalDist / count / 1000);
    });
    return avg;
  }, [sessions]);

  const selectedUserInfo = useMemo(() => {
    if (!selectedUser) return null;
    return users.find((u) => u.id === selectedUser.id) || selectedUser;
  }, [selectedUser, users]);

  useEffect(() => {
    if (routeState.type === "root" && selectedUser) {
      const slug = getUserSlug(selectedUser);
      if (slug) {
        setRouteState({ type: "user", slug });
        return;
      }
    }
    if (routeState.type === "cards") {
      if (!isAuth) {
        setShowCardsPage(false);
        setSelectedUser(null);
        setUserCardOpen(false);
        if ((window.location.pathname || "/") !== "/") {
          window.history.replaceState({}, "", "/");
          setRouteState({ type: "root", slug: null });
        }
        return;
      }
      if (!showCardsPage) setShowCardsPage(true);
      if (selectedUser) setSelectedUser(null);
      if (userCardOpen) setUserCardOpen(false);
      return;
    }

    if (routeState.type === "user") {
      if (!usersForRouting.length) {
        if (!selectedUser) {
          setSelectedUser({ id: `slug:${routeState.slug}`, name: routeState.slug });
        }
        return;
      }
      const match = userBySlug.get(routeState.slug);
      if (match) {
        if (!selectedUser || selectedUser.id !== match.id) {
          setSelectedUser(match);
        }
        if (showCardsPage) setShowCardsPage(false);
        return;
      }
      setSelectedUser(null);
      if (userCardOpen) setUserCardOpen(false);
      if ((window.location.pathname || "/") !== "/") {
        window.history.replaceState({}, "", "/");
        setRouteState({ type: "root", slug: null });
      }
      return;
    }

    if (userCardOpen) setUserCardOpen(false);
  }, [routeState, userBySlug, usersForRouting.length, selectedUser, showCardsPage, isAuth, userCardOpen]);

  useEffect(() => {
    if (showCardsPage) {
      if (!isAuth) {
        setShowCardsPage(false);
        return;
      }
      const path = buildCardsPath();
      const current = `${window.location.pathname || "/"}${window.location.search || ""}`;
      if (current !== path) {
        window.history.pushState({}, "", path);
        setRouteState({ type: "cards", slug: null });
      }
      return;
    }
    if (selectedUser) {
      const slug = getUserSlug(selectedUser);
      if (slug) {
        const path = buildUserPath(slug, userCardOpen);
        const current = `${window.location.pathname || "/"}${window.location.search || ""}`;
        if (current !== path) {
          window.history.pushState({}, "", path);
          setRouteState({ type: "user", slug });
        }
        return;
      }
    }
    if (routeState.type === "user" && !selectedUser && !usersForRouting.length) {
      return;
    }
    if ((window.location.pathname || "/") !== "/") {
      window.history.pushState({}, "", "/");
      setRouteState({ type: "root", slug: null });
    }
  }, [showCardsPage, selectedUser, isAuth, userCardOpen, routeState.type, usersForRouting.length]);

  const userRankInfo = useMemo(() => {
    if (!selectedUserInfo || !users.length) return null;
    const isSelectedBot = Boolean(selectedUserInfo.is_bot);
    const baseUsers = users.filter((u) => Boolean(u.is_bot) === isSelectedBot);
    const sorted = [...baseUsers].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return aTime - bTime;
    });
    const idx = sorted.findIndex((u) => u.id === selectedUserInfo.id);
    if (idx === -1) return null;
    return { index: idx + 1, total: sorted.length };
  }, [selectedUserInfo, users]);

  /* ===== Filtre période ===== */
  const periodSessions = useMemo(() => {
    if (range === "all") return userSessions;

    const now = dayjs();
    if (range === "month") {
      return userSessions.filter((s) => dayjs(s.date).format("YYYY-MM") === monthKey);
    }
    if (range === "6m") {
      return userSessions.filter((s) => dayjs(s.date).isAfter(now.subtract(6, "month")));
    }
    if (range === "3m") {
      return userSessions.filter((s) => dayjs(s.date).isAfter(now.subtract(3, "month")));
    }

    return userSessions.filter((s) => dayjs(s.date).format("YYYY") === range);
  }, [userSessions, range]);

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

  /* ===== Chaussures running (Nike Pegasus Premium) ===== */
  const shoesConfig = useMemo(() => {
    const baseSource = selectedUser || user;
    if (!baseSource) return null;
    const enrichedSource =
      baseSource.shoe_name && baseSource.shoe_start_date && baseSource.shoe_target_km != null
        ? baseSource
        : users.find((u) => u.id === baseSource.id) || baseSource;
    const source = enrichedSource;
    if (!source) return null;
    const name = String(source.shoe_name || "").trim();
    const startRaw = source.shoe_start_date;
    const targetKm = Number(source.shoe_target_km);
    if (!name || !startRaw || !Number.isFinite(targetKm) || targetKm <= 0) return null;
    const startDate = dayjs(startRaw);
    if (!startDate.isValid()) return null;
    return { name, startDate, targetKm, targetMeters: targetKm * 1000 };
  }, [selectedUser, user]);

  const shoesLife = useMemo(() => {
    if (!shoesConfig) return null;
    let runMeters = 0;
    userSessions.forEach((s) => {
      if (normType(s.type) !== "run") return;
      if (dayjs(s.date).isBefore(shoesConfig.startDate, "day")) return;
      runMeters += Number(s.distance) || 0;
    });
    const used = Math.min(runMeters, shoesConfig.targetMeters);
    const remaining = Math.max(shoesConfig.targetMeters - runMeters, 0);
    const percent = shoesConfig.targetMeters
      ? Math.min((runMeters / shoesConfig.targetMeters) * 100, 100)
      : 0;
    return {
      used,
      remaining,
      percent,
      name: shoesConfig.name,
      targetKm: shoesConfig.targetKm,
      startDate: shoesConfig.startDate.format("YYYY-MM-DD"),
    };
  }, [userSessions, shoesConfig]);

  const shoesLifeByRange = useMemo(() => {
    return shoesLife;
  }, [shoesLife]);

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
    if (!selectedUser) return;
    if (!canEditSelected) { showToast("Edition reservee"); return; }
    return fn(...args);
  };

  const addSession = guard(async (payload) => {
    const basePath = getSessionsBasePath();
    await withBusy(async () => {
      const body = { id: payload.id, distance: payload.distance, date: payload.date, type: payload.type };
      const created = await apiJson("POST", basePath, body, authToken);
      const createdWithName = { ...created, user_name: selectedUser?.name };
      setSessions((prev) => [...prev, normalizeSession(createdWithName)]);
    });
    setShowEditModal(false);
    showToast("Seance ajoutée");
  });

  const deleteSession = guard(async (id) => {
    if (!window.confirm("Confirmer la suppression de cette seance ?")) return;
    const basePath = getSessionsBasePath();
    await withBusy(async () => {
      await apiJson("DELETE", `${basePath}/${id}`, undefined, authToken);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    });
    setShowEditModal(false);
    showToast("Seance supprimée");
  });

  const editSession = guard(async (id, updated) => {
    const basePath = getSessionsBasePath();
    await withBusy(async () => {
      await apiJson("PUT", `${basePath}/${id}`, updated, authToken);
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? normalizeSession({ ...s, ...updated }) : s))
      );
    });
    setShowEditModal(false);
    showToast("Seance modifiée");
  });

  const importCSV = guard(async (file) => {
    if (!file) return;
    if (!window.confirm("Confirmer l'import du fichier CSV ?")) return;
    const basePath = getSessionsBasePath();
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
        const item = await apiJson("POST", basePath, body, authToken);
        created.push({ ...item, user_name: selectedUser?.name });
      }
      if (created.length) setSessions((prev) => [...prev, ...created.map(normalizeSession)]);
      return created.length;
    });

    if (imported) {
      setShowEditModal(false);
      showToast("Import terminé");
    }
  });

  const exportCSV = async () => {
    const sanitizeFilenamePart = (value) => {
      const clean = String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return clean || "user";
    };
    const namePart = sanitizeFilenamePart(headerTitle || user?.name);
    const datePart = dayjs().format("YYYY-MM-DD");
    await withBusy(() => {
      downloadCSV(`sessions-${namePart}-${datePart}.csv`, userSessions);
    });
    setShowEditModal(false);
    showToast("Export terminé");
  };

  if (loadingPhase !== "done" || FORCE_LOADING) {
    return <LoadingScreen loadingPhase={loadingPhase} forceLoading={FORCE_LOADING} />;
  }

  const showMonthCardsOnlyWhenAllRange = range === "all";
  const showMonthlyChart = range !== "month";
  const hasSessions = shownSessions.length > 0;
  const isGlobalView = !selectedUser;
  const headerTitle = selectedUser ? selectedUser.name : null;
  const canEditSelected = !!selectedUser && (isAdmin || user?.id === selectedUser.id);
  const showEditorButton = isGlobalView || (!user || isAdmin || user?.id === selectedUser?.id);

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    const slug = getUserSlug(u);
    if (slug) setRouteState({ type: "user", slug });
  };

  const handleBack = () => {
    if (showCardsPage) {
      setShowCardsPage(false);
      setRouteState({ type: "root", slug: null });
      return;
    }
    if (selectedUser) {
      setRouteState({ type: "root", slug: null });
      setSelectedUser(null);
    }
  };

  const onSwipeStart = (e) => {
    if (!showCardsPage && !selectedUser) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    swipeRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      t: Date.now(),
      moved: false,
    };
  };

  const onSwipeMove = (e) => {
    if (!showCardsPage && !selectedUser) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    const dx = touch.clientX - swipeRef.current.x;
    const dy = touch.clientY - swipeRef.current.y;
    swipeRef.current.lastX = touch.clientX;
    swipeRef.current.lastY = touch.clientY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      swipeRef.current.moved = true;
    }
  };

  const onSwipeEnd = () => {
    if (!showCardsPage && !selectedUser) return;
    const { x, y, lastX, lastY, t, moved } = swipeRef.current || {};
    if (!moved) return;
    const dt = Date.now() - (t || 0);
    if (!dt || dt > 700) return;
    const dx = (lastX || 0) - (x || 0);
    const dy = (lastY || 0) - (y || 0);
    if (dx > 70 && Math.abs(dy) < 50) {
      handleBack();
    }
  };
  return (
    <div
      className="
        min-h-[100%]
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
        <AppHeader
          range={range}
          mode={mode}
          isAuth={isAuth}
          showEditor={!showCardsPage && showEditorButton}
          showFilters={!showCardsPage}
          cardsFilter={
            showCardsPage
              ? {
                  value: cardsFilter,
                  onChange: setCardsFilter,
                }
              : null
          }
          title={headerTitle}
          editorTargetName={headerTitle}
          loggedUserName={user?.name}
          onOpenEditor={() => {
            if (isGlobalView && isAuth && user) {
              setSelectedUser(user);
              return;
            }
            setShowEditModal(true);
          }}
          onModeChange={setMode}
          onRangeChange={setRange}
          onBack={showCardsPage || !isGlobalView ? handleBack : null}
        />

        <main
          className="pb-6"
          style={{ paddingTop: "var(--main-top-padding)" }}
          onTouchStart={onSwipeStart}
          onTouchMove={onSwipeMove}
          onTouchEnd={onSwipeEnd}
        >
          <div className={showCardsPage ? "mx-auto" : "mx-auto max-w-[1550px]"}>
            {error && (
              <p className="mb-3 rounded-xl bg-rose-100 px-4 py-2 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                {error}
              </p>
            )}

            <Toast message={toast} />
            <BusyOverlay open={isBusy} />

            {isGlobalView ? (
              showCardsPage ? (
                <UserCardsPage
                  users={users}
                  nfDecimal={nfDecimal}
                  userRunningAvgById={userRunningAvgById}
                  filter={cardsFilter}
                  isAdmin={isAdmin}
                  currentUserId={user?.id || null}
                  onSelectUser={(u) => {
                    setShowCardsPage(false);
                    setUserCardOpen(false);
                    const slug = getUserSlug(u);
                    if (slug) setRouteState({ type: "user", slug });
                    handleSelectUser(u);
                  }}
                />
              ) : (
              <GlobalDashboard
                rangeLabel={rangeLabel}
                modeLabel={modeLabel}
                mode={mode}
                users={globalUsers}
                totalsByUser={monthTotalsByUser}
                sessions={globalShownSessions}
                nfDecimal={nfDecimal}
                onSelectUser={handleSelectUser}
                onOpenCards={() => {
                  setShowCardsPage(true);
                  setRouteState({ type: "cards", slug: null });
                }}
                isAdmin={isAdmin}
                isAuth={isAuth}
              />
              )
            ) : (
                <Dashboard
                  hasSessions={hasSessions}
                  mode={mode}
                  range={range}
                  modeLabel={modeLabel}
                  rangeLabel={rangeLabel}
                  userName={headerTitle}
                  userInfo={selectedUserInfo}
                  userRankInfo={userRankInfo}
                  userRunningAvgById={userRunningAvgById}
                  userCardOpen={userCardOpen}
                  onUserCardOpenChange={setUserCardOpen}
                  shownSessions={shownSessions}
                  stats={stats}
                  monthTotals={monthTotals}
                monthCounts={monthCounts}
                monthLabel={monthLabel}
                lastLabel={lastLabel}
                lastType={lastType}
                daysSinceLast={daysSinceLast}
                showMonthCardsOnlyWhenAllRange={showMonthCardsOnlyWhenAllRange}
                showMonthlyChart={showMonthlyChart}
                showCompareInline={showCompareInline}
                showCompareAbove={showCompareAbove}
                monthCompare={monthCompare}
                compareTotalWinner={compareTotalWinner}
                compareToDayWinner={compareToDayWinner}
                records={records}
                sportTotals={sportTotals}
                shoesLifeByRange={shoesLifeByRange}
                firstSessionLabel={firstSessionLabel}
                nf={nf}
                nfDecimal={nfDecimal}
              />
            )}
          </div>
        </main>
      </div>

      <div
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 h-[6px] bg-gradient-to-r from-sky-400 via-lime-300 to-emerald-300"
        aria-hidden="true"
      />

      <EditModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        isBusy={isBusy}
        isAuth={isAuth}
        verifyAndLogin={login}
        logout={editLogout}
        sessions={canEditSelected ? userSessions : sessions.filter((s) => s.user_id === user?.id)}
        readOnly={!canEditSelected}
        targetName={headerTitle}
        loggedUserName={user?.name}
        isAdmin={isAdmin}
        onAdd={addSession}
        onEdit={editSession}
        onDelete={deleteSession}
        onExport={exportCSV}
        onImport={importCSV}
      />
    </div>
  );
}
