import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Bot, Swords, Trophy, User } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { InfoPopover } from "../components/InfoPopover";
import { UserHoloCard } from "../components/UserHoloCard";

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
  allUsers,
  totalsByUser,
  sessions,
  nfDecimal,
  onSelectUser,
  onOpenCards,
  isAdmin,
  isAuth,
  notifications = [],
  notificationsLoading = false,
  notificationsError = "",
  onRefreshNotifications,
  activeChallenge,
}) {
  const [newsImageReady, setNewsImageReady] = useState(false);
  const [newsImageReady2, setNewsImageReady2] = useState(false);
  const [showNotifInfo, setShowNotifInfo] = useState(false);
  const [notifAnchorRect] = useState(null);
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

  const unreadNotifications = (notifications || []).filter(
    (n) => !n.read_at && (n.type === "challenge_start" || n.type === "event_start")
  );
  const hasUnreadNotif = unreadNotifications.length > 0;

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

  const getRemainingDays = (dueDate) => {
    if (!dueDate) return null;
    const end = new Date(`${dueDate}T23:59:59`);
    const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const cardNotification = unreadNotifications.find(
    (n) => n.type === "event_start" || n.type === "challenge_start"
  );
  const fullUsers = allUsers && allUsers.length ? allUsers : users;
  const cardBot =
    cardNotification?.meta?.bot_id
      ? fullUsers.find((u) => String(u.id) === String(cardNotification.meta.bot_id))
      : null;
  const showCardNotif = !!cardNotification && unreadNotifications.length === 1 && cardBot;
  const botRankInfo = useMemo(() => {
    if (!cardBot) return null;
    const bots = fullUsers
      .filter((u) => Boolean(u?.is_bot))
      .slice()
      .sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        if (aTime !== bTime) return aTime - bTime;
        return String(a.name || a.id || "").localeCompare(String(b.name || b.id || ""));
      });
    const index = bots.findIndex((u) => String(u.id) === String(cardBot.id));
    if (index < 0) return null;
    return { index: index + 1, total: bots.length };
  }, [users, cardBot]);

  return (
    <div className="grid gap-4 px-4 xl:px-8 pt-4 md:pt-4 xl:pt-0 pb-8">
      <div className="grid gap-4">
        {isAuth && onOpenCards && (
          <Reveal as="section">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => {
                    if (!unreadNotifications.length) return;
                    setShowNotifInfo((v) => !v);
                  }}
                  className={`relative w-full overflow-hidden rounded-2xl border-0 px-4 py-3 text-left text-slate-900 shadow-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 dark:text-slate-100 ${
                    hasUnreadNotif
                      ? "bg-gradient-to-l from-rose-400/60 to-transparent hover:ring-1 hover:ring-rose-300/70 focus-visible:ring-rose-300"
                      : "bg-gradient-to-l from-sky-400/60 to-transparent focus-visible:ring-sky-300 cursor-default"
                  }`}
                >
                  <span
                    className={`pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 ${
                      hasUnreadNotif ? "hover:opacity-100 bg-rose-400/45" : "bg-sky-400/45"
                    }`}
                  />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {hasUnreadNotif ? "Notification" : "Pas de notification"}
                    </div>
                    <Swords size={20} className="text-slate-900 dark:text-white" />
                  </div>
                </button>
                <InfoPopover
                  open={showNotifInfo}
                  onClose={() => setShowNotifInfo(false)}
                  title={
                    showCardNotif
                      ? ""
                      : unreadNotifications.length
                        ? "Notifications"
                        : <span className="text-[26px] leading-tight">Pas de notification</span>
                  }
                  actionLabel={null}
                  headerImage={showCardNotif ? null : "/big-logo.png"}
                  items={
                    showCardNotif
                        ? [
                          <div key="card" className="grid gap-5">
                            <div className="flex flex-col items-start gap-3">
                              <div className="w-full text-left text-2xl leading-snug text-slate-900 dark:text-slate-100">
                                {(() => {
                                  const body = cardNotification?.body;
                                  if (!body) return `${cardBot?.name || "Un bot"} te défie à la course !`;
                                  const match = body.match(
                                    /^\[([^\]]+)\] te défie à la course, cours ([0-9.,\s]+km) avant le (.+) pour gagner sa carte !$/i
                                  );
                                  if (!match) return body;
                                  const botName = match[1];
                                  const distance = match[2];
                                  const dateLabel = match[3];
                                  return (
                                    <div>
                                      <div className="flex items-center gap-2 text-[26px]">
                                        <Swords size={22} className="text-slate-900 dark:text-slate-100" />
                                        <span><span className="font-bold">{botName}</span> te défie à la course sur <span className="font-bold underline">{distance}</span> !</span>
                                      </div>
                                      <div className="text-[18px]">
                                         Cours cette distance avant le{" "}
                                        <span className="font-bold underline">{dateLabel}</span> pour gagner sa carte !
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="grid gap-4">
                              <div className="flex justify-center">
                                <div className="w-full max-w-[360px]">
                              <UserHoloCard
                                user={cardBot}
                                nfDecimal={nfDecimal}
                                showBotAverage
                                minSpinnerMs={500}
                                userRankInfo={botRankInfo}
                              />
                                </div>
                              </div>
                              {cardNotification?.created_at && (
                                <div className="text-right text-xs italic text-slate-400">
                                  {(() => {
                                    const formatted = dayjs(cardNotification.created_at)
                                      .locale("fr")
                                      .format("dddd D MMMM YYYY à HH:mm");
                                    const parts = formatted.split(" ");
                                    if (parts.length < 5) return formatted;
                                    const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
                                    const day = cap(parts[0]);
                                    const month = cap(parts[2]);
                                    return `${day} ${parts[1]} ${month} ${parts.slice(3).join(" ")}`;
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>,
                        ]
                      : unreadNotifications.length
                        ? unreadNotifications.map((n) => (
                          <div key={n.id} className="flex flex-col gap-1">
                            <div className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">
                              {n.title || "Notification"}
                            </div>
                            {n.body && <div className="text-sm text-slate-700 dark:text-slate-200">{n.body}</div>}
                            {activeChallenge?.id &&
                              n?.meta?.challenge_id === activeChallenge.id &&
                              activeChallenge?.due_date && (
                                <div className="text-xs text-slate-500">
                                  Il te reste {getRemainingDays(activeChallenge.due_date)} jour
                                  {getRemainingDays(activeChallenge.due_date) > 1 ? "s" : ""}
                                </div>
                              )}
                            <div className="text-xs text-slate-400">{n.created_at}</div>
                          </div>
                        ))
                        : notificationsLoading
                          ? [<span key="loading">Chargement...</span>]
                          : notificationsError
                            ? [<span key="error">Erreur notifications</span>]
                            : []
                  }
                  fullWidth
                  maxWidth={1024}
                  anchorRect={null}
                  offsetY={-15}
                  offsetYMobile={0}
                />
              </div>

              <button
                onClick={onOpenCards}
                className="relative w-full overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-emerald-300/60 to-transparent px-4 py-3 text-left text-slate-900 shadow-sm transition-colors duration-200 hover:ring-1 hover:ring-emerald-300/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 dark:text-slate-100"
              >
                <span className="pointer-events-none absolute inset-0 z-0 bg-emerald-300/45 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <Trophy size={20} className="text-slate-900 dark:text-white" />
                  </div>
                  <img src="/nacards-logo.png" alt="NaCards" className="h-7 w-auto" />
                </div>
              </button>
            </div>
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
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-100/80">10k Paris Adidas</div>
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
                🏆 Podium - {subtitle}
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
