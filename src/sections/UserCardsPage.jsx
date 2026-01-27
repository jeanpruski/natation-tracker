import React, { useMemo } from "react";
import { UserHoloCard } from "../components/UserHoloCard";

export function UserCardsPage({ users, nfDecimal, onSelectUser }) {
  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return aTime - bTime;
    });
  }, [users]);

  const { usersOnly, botsOnly } = useMemo(() => {
    const realUsers = [];
    const bots = [];
    sorted.forEach((u) => {
      if (u?.is_bot) bots.push(u);
      else realUsers.push(u);
    });
    return { usersOnly: realUsers, botsOnly: bots };
  }, [sorted]);

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
        {usersOnly.map((u, idx) => (
          <div key={u.id} className="flex w-[360px] flex-col items-center gap-2">
            <UserHoloCard
              user={u}
              nfDecimal={nfDecimal}
              userRankInfo={{ index: idx + 1, total: usersOnly.length }}
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
        {botsOnly.map((u, idx) => (
          <div key={u.id} className="flex w-[360px] flex-col items-center gap-2">
            <UserHoloCard
              user={u}
              nfDecimal={nfDecimal}
              userRankInfo={{ index: idx + 1, total: botsOnly.length }}
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
      <div className="fixed bottom-4 right-4 z-40 text-xs text-slate-500 dark:text-slate-400">
        <span className="rounded-full bg-slate-200 px-2 py-1 shadow-sm dark:bg-slate-800">
          Users {usersOnly.length}/{usersOnly.length} · Bots {botsOnly.length}
        </span>
      </div>
    </div>
  );
}
