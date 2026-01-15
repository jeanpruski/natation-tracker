import React, { useMemo } from "react";
import dayjs from "dayjs";
import { capFirst } from "../utils/strings";

const LEVEL_CLASSES = [
  "bg-slate-200/60 dark:bg-slate-800/60",
  "bg-emerald-200 dark:bg-emerald-900/50",
  "bg-emerald-300 dark:bg-emerald-800/60",
  "bg-emerald-400 dark:bg-emerald-700/70",
  "bg-emerald-500 dark:bg-emerald-500",
];
const OUTSIDE_RANGE_CLASS = "bg-transparent border border-slate-200/60 dark:border-slate-700/60";
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
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    let maxCount = 0;
    counts.forEach((value) => {
      if (value > maxCount) maxCount = value;
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
      const count = counts.get(key) || 0;
      if (inRange && count > 0) {
        maxCount = Math.max(maxCount, count);
      }
      days.push({ date: d, key, inRange, count });
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Jours actifs : {activeDays} / {totalDays}</span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: "rgb(16 185 129)" }}
              aria-hidden="true"
            />
            Actif
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm bg-slate-200/60 dark:bg-slate-800/60" aria-hidden="true" />
            Inactif
          </span>
        </div>
      </div>
      <div className="w-full h-32 sm:h-36">
        <div className="flex h-full" style={{ gap: "0.2rem" }}>
          <div className="grid grid-rows-7 h-full text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
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
                const baseClass = day.inRange ? LEVEL_CLASSES[day.level] : OUTSIDE_RANGE_CLASS;
                return (
                  <span
                    key={day.key}
                    title={title}
                    className={`w-full h-full rounded-sm ${baseClass}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
