import React, { useMemo } from "react";
import dayjs from "dayjs";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from "recharts";
import { useIsDark } from "../hooks/useTheme";

export function SwimChart({ sessions }) {
  const isDark = useIsDark();
  const avgAll = useMemo(
    () => (sessions.length ? Math.round(sessions.reduce((a, s) => a + (Number(s.distance) || 0), 0) / sessions.length) : 0),
    [sessions]
  );
  const data = useMemo(
    () => [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date)).map((s) => ({ ...s, dateLabel: dayjs(s.date).format("DD/MM") })),
    [sessions]
  );

  if (!data.length) return <p className="text-sm text-slate-600 dark:text-slate-300">Aucune donnée encore.</p>;

  return (
    <div className="h-60 w-full text-slate-900 dark:text-slate-100">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeOpacity={0.12} strokeDasharray="3 3" />
          <XAxis
            dataKey="dateLabel" interval={0} tickMargin={8} padding={{ right: 16 }} tick={{ fill: "currentColor" }}
            tickFormatter={(_v, i) => {
              const d = dayjs(data[i].date);
              if (i === 0) { const label = d.format("MMM YY"); return label.charAt(0).toUpperCase() + label.slice(1); }
              const prev = dayjs(data[i - 1].date);
              if (d.isSame(prev, "month")) return "";
              const label = d.format("MMM YY"); return label.charAt(0).toUpperCase() + label.slice(1);
            }}
          />
          <YAxis tick={{ fill: "currentColor" }} />
          <ReferenceLine y={1000} stroke="rgb(16 185 129)" strokeDasharray="10000000" label={{ value: "1000 m", position: "right", fill: "currentColor", fontSize: 12 }} />
          <ReferenceLine y={avgAll} stroke="rgb(59 130 246)" strokeDasharray="4 4" label={{ value: `${avgAll} m (moy.)`, position: "right", fill: "currentColor", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.1)",
              background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
              color: isDark ? "#e5e7eb" : "#0f172a",
            }}
            labelClassName="text-xs"
            itemStyle={{ color: isDark ? "#e5e7eb" : "#0f172a" }}
            labelFormatter={() => ""}
            formatter={(v, _n, p) => [v + " m", dayjs(p.payload.date).format("DD/MM/YYYY")]}
          />
          <Line type="monotone" dataKey="distance" stroke="rgb(99 102 241)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

