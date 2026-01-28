import React, { useMemo, useCallback, useState, useEffect } from "react";
import { UserHoloCard } from "../components/UserHoloCard";
import { InfoPopover } from "../components/InfoPopover";
import { apiGet } from "../utils/api";

export function UserCardsPage({
  users,
  nfDecimal,
  onSelectUser,
  onOpenResults,
  filter = "mixte",
  userRunningAvgById,
  isAdmin = false,
  currentUserId = null,
  showAllCardsFront = false,
  isAuth = false,
  authToken = null,
  cardResults = [],
}) {
  const [showResultsInfo, setShowResultsInfo] = useState(false);
  const [resultsUser, setResultsUser] = useState(null);
  const [resultsItems, setResultsItems] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState("");
  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return aTime - bTime;
    });
  }, [users]);

  const { usersOnlyByDate, botsOnlyByDate, botsOnlyByAvg } = useMemo(() => {
    const realUsers = [];
    const bots = [];
    sorted.forEach((u) => {
      if (u?.is_bot) bots.push(u);
      else realUsers.push(u);
    });
    const botsByAvg = [...bots].sort((a, b) => {
      const aVal = Number.isFinite(Number(a?.avg_distance_m)) ? Number(a.avg_distance_m) : null;
      const bVal = Number.isFinite(Number(b?.avg_distance_m)) ? Number(b.avg_distance_m) : null;
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return aVal - bVal;
    });
    return { usersOnlyByDate: realUsers, botsOnlyByDate: bots, botsOnlyByAvg: botsByAvg };
  }, [sorted]);

  const { userRankById, botRankById } = useMemo(() => {
    const userRanks = new Map();
    const botRanks = new Map();
    usersOnlyByDate.forEach((u, idx) => userRanks.set(u.id, idx + 1));
    botsOnlyByDate.forEach((u, idx) => botRanks.set(u.id, idx + 1));
    return { userRankById: userRanks, botRankById: botRanks };
  }, [usersOnlyByDate, botsOnlyByDate]);

  const getUserAvg = useCallback((u) => {
    const byMap = userRunningAvgById?.get?.(u.id);
    if (Number.isFinite(byMap)) return byMap;
    const fallback = Number(u?.avg_distance_m);
    return Number.isFinite(fallback) ? fallback / 1000 : null;
  }, [userRunningAvgById]);

  const usersSortedByAvg = useMemo(() => {
    const list = [...usersOnlyByDate];
    const withAvg = [];
    const withoutAvg = [];
    list.forEach((u) => {
      const avg = getUserAvg(u);
      if (avg === null) withoutAvg.push(u);
      else withAvg.push({ u, avg });
    });
    withAvg.sort((a, b) => b.avg - a.avg);
    return [...withAvg.map((x) => x.u), ...withoutAvg];
  }, [usersOnlyByDate, getUserAvg]);

  const unlockedBotIds = useMemo(() => {
    const set = new Set();
    (cardResults || []).forEach((r) => {
      if (r?.bot_id !== undefined && r?.bot_id !== null) set.add(String(r.bot_id));
      if (r?.bot_name) set.add(`name:${String(r.bot_name).toLowerCase()}`);
    });
    return set;
  }, [cardResults]);

  const filteredUsers = useMemo(() => {
    if (filter === "users") {
      if (!currentUserId) return usersSortedByAvg;
      const me = usersSortedByAvg.find((u) => u.id === currentUserId);
      if (!me) return usersSortedByAvg;
      return [me, ...usersSortedByAvg.filter((u) => u.id !== currentUserId)];
    }
    if (filter === "bots") {
      const unlocked = botsOnlyByAvg.filter(
        (u) =>
          unlockedBotIds.has(String(u.id)) ||
          unlockedBotIds.has(`name:${String(u.name || "").toLowerCase()}`)
      );
      const locked = botsOnlyByAvg.filter(
        (u) =>
          !unlockedBotIds.has(String(u.id)) &&
          !unlockedBotIds.has(`name:${String(u.name || "").toLowerCase()}`)
      );
      return [...unlocked, ...locked];
    }
    return sorted;
  }, [filter, usersSortedByAvg, botsOnlyByAvg, sorted, currentUserId, unlockedBotIds]);

  useEffect(() => {
    if (!showResultsInfo || !resultsUser?.id) return;
    if (!isAuth || !authToken) {
      setResultsItems([<span key="auth">Connecte-toi pour voir les résultats.</span>]);
      return;
    }
    let alive = true;
    setResultsLoading(true);
    setResultsError("");
    (async () => {
      try {
        const data = await apiGet(`/me/card-results?bot_id=${encodeURIComponent(resultsUser.id)}`, authToken);
        if (!alive) return;
        const items = (Array.isArray(data) ? data : []).map((row, idx) => {
          const km = Number(row.distance_m) / 1000;
          const kmLabel = Number.isFinite(km) ? `${km.toFixed(3)} km` : "—";
          const targetKm = Number(row.target_distance_m) / 1000;
          const targetLabel = Number.isFinite(targetKm) ? `${targetKm.toFixed(3)} km` : null;
          return (
            <div key={row.id || idx} className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-700 dark:text-slate-200">{row.achieved_at}</span>
              <span className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                {kmLabel}
                {targetLabel ? (
                  <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                    / {targetLabel}
                  </span>
                ) : null}
              </span>
            </div>
          );
        });
        setResultsItems(items.length ? items : [<span key="empty">Aucun résultat pour le moment.</span>]);
      } catch (e) {
        if (!alive) return;
        setResultsError(e?.message || "Erreur résultats");
        setResultsItems([]);
      } finally {
        if (alive) setResultsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [showResultsInfo, resultsUser, isAuth, authToken]);

  if (!users.length) {
    return (
      <div className="px-4 xl:px-8 pt-4 pb-8 text-sm text-slate-600 dark:text-slate-300">
        Aucune donnée disponible.
      </div>
    );
  }

  return (
    <div className="px-4 xl:px-8 pt-4 pb-8">
      <InfoPopover
        open={showResultsInfo}
        onClose={() => setShowResultsInfo(false)}
        title={
          <span className="text-[26px] leading-tight">
            Résultat contre {resultsUser?.name || ""}
          </span>
        }
        actionLabel={null}
        headerImage="/big-logo.png"
        items={
          resultsLoading
            ? [<span key="loading">Chargement...</span>]
            : resultsError
              ? [<span key="error">Erreur résultats</span>]
              : resultsItems
        }
        fullWidth
        maxWidth={1024}
        anchorRect={null}
        offsetY={-15}
        offsetYMobile={0}
      />
      <div className="mx-auto flex w-full max-w-[1900px] flex-wrap justify-center gap-4">
        {filteredUsers.map((u) => (
          <div key={u.id} className="flex w-[360px] min-w-[342px] flex-col items-center gap-2">
            <UserHoloCard
              user={u}
              nfDecimal={nfDecimal}
              showBotAverage
              minSpinnerMs={500}
              userRunningAvgKm={!u?.is_bot ? userRunningAvgById?.get(u.id) : null}
              showBackOnly={
                !showAllCardsFront &&
                u?.is_bot &&
                !unlockedBotIds.has(String(u.id)) &&
                !unlockedBotIds.has(`name:${String(u.name || "").toLowerCase()}`)
              }
              autoTiltVariant="soft"
              userRankInfo={{
                index: u?.is_bot ? botRankById.get(u.id) : userRankById.get(u.id),
                total: u?.is_bot ? botsOnlyByDate.length : usersOnlyByDate.length,
              }}
            />
            {!(u?.is_bot && !showAllCardsFront && !unlockedBotIds.has(String(u.id))) ? (
              <div className="flex items-center gap-2">
                {!!u?.is_bot && (
                  <button
                    type="button"
                    onClick={() => {
                      setResultsUser(u);
                      setShowResultsInfo(true);
                      onOpenResults?.(u);
                    }}
                    className="rounded-full border border-emerald-300/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
                  >
                    Résultats
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectUser?.(u)}
                  className="rounded-full border border-emerald-300/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
                >
                  Ouvrir le dashboard de {u.name}
                </button>
              </div>
            ) : (
              <div className="h-[24px]" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
      <div className="fixed bottom-8 right-8 z-40 text-xs text-slate-500 dark:text-slate-400">
        <span className="rounded-full bg-slate-200 px-2 py-1 shadow-sm dark:bg-slate-800">
          Users {usersOnlyByDate.length} · Bots {botsOnlyByDate.length}
        </span>
      </div>
    </div>
  );
}
