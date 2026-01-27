import React, { useMemo } from "react";
import { Bot, User } from "lucide-react";
import { Reveal } from "../components/Reveal";

function buildMonthKeys(sessions) {
  const set = new Set();
  sessions.forEach((s) => {
    const key = String(s.date || "").slice(0, 7);
    if (key) set.add(key);
  });
  return Array.from(set).sort();
}

function buildSparklinePoints(values, w, h) {
  if (!values.length) return `0,${h / 2} ${w},${h / 2}`;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  return values
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / max) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function GlobalDashboard({
  rangeLabel,
  modeLabel,
  mode,
  users,
  totalsByUser,
  sessions,
  nfDecimal,
  onSelectUser,
  onOpenCards,
  isAdmin,
}) {
  const subtitle = mode === "all" ? rangeLabel : `${rangeLabel} · ${modeLabel || ""}`.trim();
  const totals = useMemo(() => {
    return users
      .map((u) => ({
        id: u.id,
        name: u.name,
        total: totalsByUser?.[u.id] || 0,
        isBot: Boolean(u?.is_bot),
      }))
      .sort((a, b) => b.total - a.total);
  }, [users, totalsByUser]);

  const monthKeys = useMemo(() => buildMonthKeys(sessions), [sessions]);
  const sparklineMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(u.id, monthKeys.map(() => 0)));
    if (!monthKeys.length) return map;
    const keyIndex = new Map(monthKeys.map((k, i) => [k, i]));
    sessions.forEach((s) => {
      if (!s.user_id) return;
      const idx = keyIndex.get(String(s.date || "").slice(0, 7));
      if (idx === undefined) return;
      const arr = map.get(s.user_id);
      if (!arr) return;
      arr[idx] += Number(s.distance) || 0;
    });
    return map;
  }, [sessions, users, monthKeys]);

  return (
    <div className="grid gap-4 px-4 xl:px-8 pt-4 pb-8">
      <div className="grid gap-4">
        <Reveal as="section">
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                🌍 Global - {subtitle}
              </h2>
              {onOpenCards && isAdmin && (
                <button
                  onClick={onOpenCards}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Cartes
                </button>
              )}
            </div>
            <div className="p-4">
              {!users.length ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">Aucune donnee disponible.</p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {totals.map((u, index) => {
                      const sparkValues = sparklineMap.get(u.id) || [];
                      const points = buildSparklinePoints(sparkValues, 96, 40);
                      const isPodium = index < 3;
                      const podium = isPodium
                        ? [
                            { img: "/na-first.png", label: "1" },
                            { img: "/na-second.png", label: "2" },
                            { img: "/na-third.png", label: "3" },
                          ][index]
                        : { img: "/na-null.png", label: "" };
                      const podiumClass =
                        index === 0
                          ? "ring-amber-300/70 dark:ring-amber-300/40"
                          : index === 1
                            ? "ring-slate-400/70 dark:ring-slate-300/50"
                            : "ring-orange-300/70 dark:ring-orange-300/45";
                      return (
                        <button
                          key={u.id}
                          onClick={() => onSelectUser(u)}
                          className={`text-left rounded-xl p-3 ring-1 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                            isPodium
                              ? `${podiumClass} bg-slate-50/80 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100`
                              : "bg-slate-50/80 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`flex items-center rounded-lg ${isPodium ? podiumClass : ""}`}>
                                <img
                                  src={podium.img}
                                  alt={podium.label ? `Podium ${podium.label}` : ""}
                                  aria-hidden={!podium.label}
                                  className={`h-12 w-12 shrink-0 object-contain ${isPodium ? "" : "opacity-40 blur-[4px]"}`}
                                />
                              </div>
                              <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                {u.isBot ? (
                                  <Bot
                                    size={16}
                                    className="text-slate-500 dark:text-slate-400"
                                  />
                                ) : (
                                  <User
                                    size={16}
                                    className="text-slate-500 dark:text-slate-400"
                                  />
                                )}
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{u.name}</div>
                              </div>
                              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                {nfDecimal.format(u.total / 1000)} km
                              </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                            <svg width="96" height="40" viewBox="0 0 96 40" aria-hidden="true">
                                <polyline
                                  points={points}
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="text-emerald-500"
                                />
                              </svg>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
