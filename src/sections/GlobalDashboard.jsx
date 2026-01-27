import React, { useEffect, useMemo, useState } from "react";
import { Bot, User, Swords } from "lucide-react";
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
  isAuth,
}) {
  const [newsImageReady, setNewsImageReady] = useState(false);
  const [newsImageReady2, setNewsImageReady2] = useState(false);
  useEffect(() => {
    const img = new Image();
    const done = () => setNewsImageReady(true);
    img.onload = done;
    img.onerror = done;
    img.src = "/news/adidas10k-2026.jpg";
    if (img.complete) setNewsImageReady(true);
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  useEffect(() => {
    const img = new Image();
    const done = () => setNewsImageReady2(true);
    img.onload = done;
    img.onerror = done;
    img.src = "/news/mcdo5-10k-2026.jpg";
    if (img.complete) setNewsImageReady2(true);
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, []);
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
    <div className="grid gap-4 px-4 xl:px-8 pt-4 md:pt-4 xl:pt-0 pb-8">
      <div className="grid gap-4">
        {isAuth && onOpenCards && (
          <Reveal as="section">
            <button
              onClick={onOpenCards}
              className="relative w-full overflow-hidden rounded-2xl border border-emerald-300/70 bg-gradient-to-r from-emerald-500/35 to-transparent px-4 py-3 text-left text-slate-900 shadow-sm transition-colors duration-200 hover:border-emerald-500 hover:ring-1 hover:ring-emerald-400/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-emerald-400/30 dark:text-slate-100"
            >
              <span className="pointer-events-none absolute inset-0 z-0 bg-emerald-500/35 opacity-0 transition-opacity duration-300 hover:opacity-100" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <Swords size={20} className="text-slate-900 dark:text-slate-100" />
                </div>
                <img src="/nacards-logo.png" alt="NaCards" className="h-7 w-auto" />
              </div>
            </button>
          </Reveal>
        )}
        <Reveal as="section">
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                📰 Événements spéciaux
              </h2>
            </div>
            <div className="p-4">
              <div className="grid gap-3 md:grid-cols-2">
              <a
                href="https://www.adidas10kparis.fr/fr/participer/s-inscrire"
                target="_blank"
                rel="noreferrer"
                className="relative min-h-[180px] overflow-hidden rounded-2xl border border-slate-200 px-5 pt-5 pb-10 text-slate-900 shadow-sm transition hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-slate-700 dark:text-slate-100"
                style={{
                  backgroundImage: newsImageReady ? "url(/news/adidas10k-2026.jpg)" : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "50% 20%",
                }}
              >
                {!newsImageReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/60">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400/70 border-t-transparent" />
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-950/30" aria-hidden="true" />
                <div className="relative text-slate-100">
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-100/80">Adidas 10k Paris</div>
                  <div className="mt-1 text-xl font-semibold">
                    Dimanche 7 Juin 2026 <span className="italic font-normal">(Paris)</span>
                  </div>
                </div>
            </a>
              <a
                href="https://www.protiming.fr/runnings/detail/7930"
                target="_blank"
                rel="noreferrer"
                className="relative min-h-[180px] overflow-hidden rounded-2xl border border-slate-200 px-5 pt-5 pb-10 text-slate-900 shadow-sm transition hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-slate-700 dark:text-slate-100"
                style={{
                  backgroundImage: newsImageReady2 ? "url(/news/mcdo5-10k-2026.jpg)" : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "50% 20%",
                }}
              >
                {!newsImageReady2 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/60">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400/70 border-t-transparent" />
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-950/30" aria-hidden="true" />
                <div className="relative text-slate-100">
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-100/80">La Foulée des Sacres by Mc Donalds 5/10k</div>
                  <div className="mt-1 text-xl font-semibold">
                    Dimanche 14 Juin 2026 <span className="italic font-normal">(Reims)</span>
                  </div>
                </div>
              </a>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal as="section">
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
