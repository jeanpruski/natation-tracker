import React, { useMemo } from "react";
import { UserHoloCard } from "../components/UserHoloCard";

export function UserCardsPage({
  users,
  nfDecimal,
  onSelectUser,
  filter = "mixte",
  userRunningAvgById,
  isAdmin = false,
}) {
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

  const filteredUsers = useMemo(() => {
    if (filter === "users") return usersOnlyByDate;
    if (filter === "bots") return botsOnlyByAvg;
    return sorted;
  }, [filter, usersOnlyByDate, botsOnlyByAvg, sorted]);

  if (!users.length) {
    return (
      <div className="px-4 xl:px-8 pt-4 pb-8 text-sm text-slate-600 dark:text-slate-300">
        Aucune donnée disponible.
      </div>
    );
  }

  return (
    <div className="px-4 xl:px-8 pt-4 pb-8">
      <div className="mx-auto flex w-full max-w-[1900px] flex-wrap justify-center gap-4">
        {filteredUsers.map((u) => (
          <div key={u.id} className="flex w-[360px] flex-col items-center gap-2">
            <UserHoloCard
              user={u}
              nfDecimal={nfDecimal}
              showBotAverage
              minSpinnerMs={500}
              userRunningAvgKm={!u?.is_bot ? userRunningAvgById?.get(u.id) : null}
              showBackOnly={!isAdmin && u?.is_bot}
              userRankInfo={{
                index: u?.is_bot ? botRankById.get(u.id) : userRankById.get(u.id),
                total: u?.is_bot ? botsOnlyByDate.length : usersOnlyByDate.length,
              }}
            />
            <button
              type="button"
              onClick={() => onSelectUser?.(u)}
              className="rounded-full border border-emerald-300/70 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
            >
              Ouvrir le dashboard de {u.name}
            </button>
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
