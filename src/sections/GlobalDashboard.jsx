import React, { useMemo } from "react";
import { User } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { useIsDark } from "../hooks/useTheme";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

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
}) {
  const isDark = useIsDark();
  const subtitle = mode === "all" ? rangeLabel : `${rangeLabel} · ${modeLabel || ""}`.trim();
  const totals = useMemo(() => {
    return users
      .map((u) => ({
        id: u.id,
        name: u.name,
        total: totalsByUser?.[u.id] || 0,
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

  const runByUser = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      if (!s.user_id) return;
      if (String(s.type || "").toLowerCase() !== "run") return;
      map.set(s.user_id, (map.get(s.user_id) || 0) + (Number(s.distance) || 0));
    });
    return users
      .map((u) => ({
        id: u.id,
        name: u.name,
        value: map.get(u.id) || 0,
      }))
      .filter((u) => u.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [sessions, users]);

  const pieColors = [
    "#10b981",
    "#38bdf8",
    "#f59e0b",
    "#f43f5e",
    "#a855f7",
    "#22c55e",
    "#14b8a6",
    "#3b82f6",
  ];

  const runColorByUserId = useMemo(() => {
    const map = new Map();
    runByUser.forEach((entry, idx) => {
      map.set(entry.id, pieColors[idx % pieColors.length]);
    });
    return map;
  }, [runByUser, pieColors]);
  return (
    <div className="grid gap-4 px-4 xl:px-8 pt-4 pb-8">
      <div className="grid gap-4 min-[1024px]:grid-cols-[1fr_4fr]">
        <Reveal as="section" className="hidden min-[1024px]:block order-2 min-[1024px]:order-none">
          {!runByUser.length ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {mode === "run" ? "Aucune donnée running." : "Camembert disponible en mode Running."}
            </p>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-slate-900 dark:text-slate-100">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={runByUser}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {runByUser.map((entry, idx) => (
                      <Cell key={entry.id} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Reveal>

        <Reveal as="section" className="order-1 min-[1024px]:order-none">
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                🌍 Global - {subtitle}
              </h2>
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
                                <User
                                  size={16}
                                  className="text-slate-500 dark:text-slate-400 min-[1024px]:hidden"
                                />
                                <User
                                  size={16}
                                  className="hidden min-[1024px]:block"
                                  style={{ color: runColorByUserId.get(u.id) || "#94a3b8" }}
                                />
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
