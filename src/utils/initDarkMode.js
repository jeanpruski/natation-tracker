// Initialize dark mode before React renders
try {
  const raw = localStorage.getItem("theme_dark");
  const prefDark = raw ? JSON.parse(raw) : false;
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", !!prefDark);
  }
} catch {}

