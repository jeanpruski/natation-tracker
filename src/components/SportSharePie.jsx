import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useIsDark } from "../hooks/useTheme";

export function SportSharePie({
  swimValue,
  runValue,
  unitLabel = "",
  formatValue = (value) => value,
  heightClass = "h-60",
  innerRadius = "45%",
  outerRadius = "70%",
}) {
  const isDark = useIsDark();
  const total = (swimValue || 0) + (runValue || 0);

  if (!total) {
    return <p className="text-sm text-slate-600 dark:text-slate-300">Aucune donnée encore.</p>;
  }

  const data = [
    { name: "Piscine", value: swimValue || 0 },
    { name: "Running", value: runValue || 0 },
  ].filter((d) => d.value > 0);
  const percent = (value) => Math.round((value / total) * 100);

  return (
    <div className="w-full">
      <div className={heightClass}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              cx="50%"
              cy="50%"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.name === "Piscine" ? "rgb(99 102 241)" : "rgb(16 185 129)"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.1)",
                background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
                color: isDark ? "#e5e7eb" : "#0f172a",
              }}
              itemStyle={{ color: isDark ? "#e5e7eb" : "#0f172a" }}
              formatter={(value, name) => [`${formatValue(value)} ${unitLabel}`.trim(), name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid gap-2 text-xs text-slate-600 dark:text-slate-300">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    entry.name === "Piscine" ? "rgb(99 102 241)" : "rgb(16 185 129)",
                }}
              />
              <span>{entry.name}</span>
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {percent(entry.value)}% · {formatValue(entry.value)}{" "}
              {unitLabel === "séance" && entry.value > 1 ? "séances" : unitLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
