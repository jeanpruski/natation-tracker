import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Passer en clair" : "Passer en sombre"}
      className="inline-flex items-center justify-center rounded-xl bg-slate-200 p-2 text-slate-900 shadow hover:bg-slate-300 dark:bg-slate-700/70 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

