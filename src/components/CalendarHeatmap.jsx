import React, { useMemo } from "react";
import dayjs from "dayjs";
import { capFirst } from "../utils/strings";

const SWIM_COLORS = [
  "#e0f2fe",
  "#bae6fd",
  "#7dd3fc",
  "#38bdf8",
  "#0ea5e9",
];
const RUN_COLORS = [
  "#d1fae5",
  "#a7f3d0",
  "#6ee7b7",
  "#34d399",
  "#10b981",
];
const OUTSIDE_RANGE_CLASS = "bg-transparent";
const INACTIVE_CLASS = "bg-slate-200/60 dark:bg-slate-800/60";
const WEEKDAY_LABELS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const toKey = (d) => dayjs(d).format("YYYY-MM-DD");

const getRangeBounds = (range, sessions) => {
  const now = dayjs();

  if (range === "month") {
    return { start: now.startOf("month"), end: now.endOf("day") };
  }
  if (range === "3m") {
    return { start: now.subtract(3, "month").startOf("day"), end: now.endOf("day") };
  }
  if (range === "6m") {
    return { start: now.subtract(6, "month").startOf("day"), end: now.endOf("day") };
  }
  if (/^\d{4}$/.test(range)) {
    const year = Number(range);
    return { start: dayjs(`${year}-01-01`), end: dayjs(`${year}-12-31`) };
  }
  if (range === "all") {
    if (!sessions.length) {
      return { start: now.startOf("month"), end: now.endOf("day") };
    }
    const sorted = sessions
      .map((s) => dayjs(s.date))
      .filter((d) => d.isValid())
      .sort((a, b) => a.valueOf() - b.valueOf());
    const start = sorted[0] || now.startOf("month");
    const end = sorted[sorted.length - 1] || now.endOf("day");
    return { start: start.startOf("day"), end: end.endOf("day") };
  }

  return { start: now.startOf("month"), end: now.endOf("day") };
};

export function CalendarHeatmap({ sessions, range }) {
  const { weeks, activeDays, totalDays } = useMemo(() => {
    const { start, end } = getRangeBounds(range, sessions);
    const counts = new Map();

    sessions.forEach((s) => {
      const key = toKey(s.date);
      const type = (s.type || "swim").toLowerCase() === "run" ? "run" : "swim";
      const prev = counts.get(key) || { swim: 0, run: 0 };
      if (type === "run") prev.run += 1;
      else prev.swim += 1;
      counts.set(key, prev);
    });

    let maxCount = 0;
    counts.forEach((value) => {
      const total = value.swim + value.run;
      if (total > maxCount) maxCount = total;
    });

    const weekStart = start.startOf("week");
    const weekEnd = end.endOf("week");
    const days = [];

    for (
      let d = weekStart;
      d.isBefore(weekEnd, "day") || d.isSame(weekEnd, "day");
      d = d.add(1, "day")
    ) {
      const key = d.format("YYYY-MM-DD");
      const inRange = (d.isSame(start, "day") || d.isAfter(start, "day"))
        && (d.isSame(end, "day") || d.isBefore(end, "day"));
      const dayCounts = counts.get(key) || { swim: 0, run: 0 };
      const count = dayCounts.swim + dayCounts.run;
      if (inRange && count > 0) {
        maxCount = Math.max(maxCount, count);
      }
      days.push({ date: d, key, inRange, count, swim: dayCounts.swim, run: dayCounts.run });
    }

    const weeksList = [];
    for (let i = 0; i < days.length; i += 7) {
      weeksList.push(days.slice(i, i + 7));
    }

    let active = 0;
    let total = 0;
    days.forEach((d) => {
      if (!d.inRange) return;
      total += 1;
      if (d.count > 0) active += 1;
    });

    const getLevel = (count) => {
      if (count <= 0) return 0;
      if (maxCount <= 1) return 4;
      return Math.min(4, Math.ceil((count / maxCount) * 4));
    };

    const weeksWithLevels = weeksList.map((week) =>
      week.map((day) => ({
        ...day,
        level: getLevel(day.count),
      }))
    );

    return { weeks: weeksWithLevels, activeDays: active, totalDays: total };
  }, [sessions, range]);

  if (!weeks.length) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Aucune donnee de calendrier.
      </p>
    );
  }

  const monthLabels = [];
  let monthIndex = 0;
  let lastMonthKey = null;
  weeks.forEach((week) => {
    const firstInRange = week.find((day) => day.inRange) || week[0];
    const monthKey = firstInRange ? firstInRange.date.format("YYYY-MM") : "";
    const label = monthKey && monthKey !== lastMonthKey
      ? capFirst(firstInRange.date.format("MMM"))
      : "";
    if (label) {
      monthIndex += 1;
      monthLabels.push({ label, showOnMobile: monthIndex % 2 === 1 });
      lastMonthKey = monthKey;
    } else {
      monthLabels.push({ label: "", showOnMobile: true });
    }
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Jours actifs : {activeDays} / {totalDays}</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: SWIM_COLORS[4] }}
              aria-hidden="true"
            />
            Natation
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: RUN_COLORS[4] }}
              aria-hidden="true"
            />
            Running
          </span>
        </div>
      </div>
      <div className="w-full h-32 sm:h-36">
        <div className="flex h-full flex-col" style={{ gap: "0.2rem" }}>
          <div className="flex items-end text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            <div className="w-16 shrink-0" />
            {monthLabels.map((entry, idx) => {
              const hideOnMobile = !entry.showOnMobile;
              return (
                <div
                  key={`${entry.label}-${idx}`}
                  className={`flex-1 ${hideOnMobile ? "hidden md:block" : ""}`}
                >
                  {entry.label}
                </div>
              );
            })}
          </div>
          <div className="flex h-full" style={{ gap: "0.2rem" }}>
            <div className="grid grid-rows-7 h-full w-16 shrink-0 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="flex items-center">
                {label}
              </span>
            ))}
          </div>
          {weeks.map((week, wIdx) => (
            <div
              key={`${wIdx}-week`}
              className="grid grid-rows-7 h-full flex-1"
              style={{ gap: "0.2rem" }}
            >
              {week.map((day) => {
                const label = capFirst(day.date.format("dddd DD MMM YYYY"));
                const title = `${label} • ${day.count} seance${day.count > 1 ? "s" : ""}`;
                const isMix = day.swim > 0 && day.run > 0;
                const isSwimOnly = day.swim > 0 && day.run === 0;
                const isRunOnly = day.run > 0 && day.swim === 0;
                let style = {};
                if (!day.inRange) {
                  style = {};
                } else if (isMix) {
                  style = {
                    background: `linear-gradient(135deg, ${SWIM_COLORS[day.level]} 0%, ${RUN_COLORS[day.level]} 100%)`,
                  };
                } else if (isSwimOnly) {
                  style = { backgroundColor: SWIM_COLORS[day.level] };
                } else if (isRunOnly) {
                  style = { backgroundColor: RUN_COLORS[day.level] };
                }
                const baseClass = day.inRange
                  ? day.count === 0
                    ? INACTIVE_CLASS
                    : ""
                  : OUTSIDE_RANGE_CLASS;
                return (
                  <span
                    key={day.key}
                    title={title}
                    className={`w-full h-full rounded-sm ${baseClass}`}
                    style={style}
                  />
                );
              })}
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
