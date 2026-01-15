import React, { useMemo } from "react";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useIsDark } from "../hooks/useTheme";

export function SwimChart({ sessions, mode = "all" }) {
  const isDark = useIsDark();

  const normType = (t) => ((t || "swim").toLowerCase() === "run" ? "run" : "swim");

  const { avgSwim, avgRun } = useMemo(() => {
    let swimSum = 0, swimN = 0, runSum = 0, runN = 0;
    sessions.forEach((s) => {
      const d = Number(s.distance) || 0;
      const t = normType(s.type);
      if (t === "run") { runSum += d; runN += 1; }
      else { swimSum += d; swimN += 1; }
    });
    return {
      avgSwim: swimN ? Math.round(swimSum / swimN) : 0,
      avgRun: runN ? Math.round(runSum / runN) : 0,
    };
  }, [sessions]);

  // Data : 2 séries dans le même tableau (une valeur par type, l'autre = null)
  const data = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((s) => {
        const t = normType(s.type);
        return {
          ...s,
          dateLabel: dayjs(s.date).format("DD/MM"),
          swimDistance: t === "swim" ? Number(s.distance) || 0 : null,
          runDistance: t === "run" ? Number(s.distance) || 0 : null,
        };
      });
  }, [sessions]);

  if (!data.length) {
    return <p className="text-sm text-slate-600 dark:text-slate-300">Aucune donnée encore.</p>;
  }

  return (
    <div className="h-60 w-full text-slate-900 dark:text-slate-100">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeOpacity={0.12} strokeDasharray="3 3" />

          <XAxis
            dataKey="dateLabel"
            interval={0}
            tickMargin={8}
            padding={{ right: 16 }}
            tick={{ fill: "currentColor" }}
            tickFormatter={(_v, i) => {
              const d = dayjs(data[i].date);
              if (i === 0) {
                const label = d.format("MMM");
                return label.charAt(0).toUpperCase() + label.slice(1);
              }
              const prev = dayjs(data[i - 1].date);
              if (d.isSame(prev, "month")) return "";
              const label = d.format("MMM");
              return label.charAt(0).toUpperCase() + label.slice(1);
            }}
          />

          <YAxis tick={{ fill: "currentColor" }} />

          {/* Moyennes (sans l'objectif) */}
          {(mode === "all" || mode === "swim") && avgSwim > 0 && (
            <ReferenceLine
              y={avgSwim}
              stroke="rgb(99 102 241)" // bleu
              strokeDasharray="4 4"
              label={{ value: `${avgSwim} m (moy. nat.)`, position: "right", fill: "currentColor", fontSize: 12 }}
            />
          )}

          {(mode === "all" || mode === "run") && avgRun > 0 && (
            <ReferenceLine
              y={avgRun}
              stroke="rgb(16 185 129)" // vert
              strokeDasharray="4 4"
              label={{ value: `${avgRun} m (moy. run)`, position: "right", fill: "currentColor", fontSize: 12 }}
            />
          )}

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
            formatter={(v, name, p) => {
              const type = (p?.payload?.type || "swim").toLowerCase() === "run" ? "Running" : "Piscine";
              const label = name === "runDistance" ? "Running" : "Piscine";
              return [`${v} m`, `${label} — ${dayjs(p.payload.date).format("DD/MM/YYYY")}`];
            }}
          />

          {/* Lignes selon mode */}
          {(mode === "all" || mode === "swim") && (
            <Line
              type="monotone"
              dataKey="swimDistance"
              stroke="rgb(99 102 241)"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          )}

          {(mode === "all" || mode === "run") && (
            <Line
              type="monotone"
              dataKey="runDistance"
              stroke="rgb(16 185 129)"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
