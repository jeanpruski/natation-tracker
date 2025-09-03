import React, { useMemo } from "react";
import dayjs from "dayjs";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { useIsDark } from "../hooks/useTheme";

export function MonthlyBarChart({ sessions }) {
  const isDark = useIsDark();
  const monthly = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      const key = dayjs(s.date).format("YYYY-MM");
      const rawLabel = dayjs(s.date).format("MMMM YYYY");
      const prettyLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
      const prev = map.get(key) || { key, label: prettyLabel, total: 0, count: 0 };
      prev.total += Number(s.distance) || 0; prev.count += 1; map.set(key, prev);
    });
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [sessions]);

  if (!monthly.length) return <p className="text-sm text-slate-600 dark:text-slate-300">Aucune donnée mensuelle encore.</p>;

  return (
    <div className="h-60 w-full text-slate-900 dark:text-slate-100">
      <ResponsiveContainer>
        <BarChart data={monthly}>
          <CartesianGrid strokeOpacity={0.12} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "currentColor" }} />
          <YAxis tick={{ fill: "currentColor" }} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.1)",
              background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
              color: isDark ? "#e5e7eb" : "#0f172a",
            }}
            itemStyle={{ color: isDark ? "#e5e7eb" : "#0f172a" }}
            labelFormatter={() => ""}
            formatter={(v, _name, props) => {
              const count = props.payload.count;
              return [`${v} m (${count} séance${count > 1 ? "s" : ""})`, "Total du mois"];
            }}
          />
          <Bar dataKey="total" fill="rgb(99 102 241)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

