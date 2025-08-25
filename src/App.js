// App.js – Suivi Natation (React + Tailwind v3 + Recharts) + Edit Lock (lecture seule visuelle + disabled)
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { v4 as uuidv4 } from "uuid";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, ReferenceLine,
} from "recharts";
import { Download, Moon, Sun, Plus, CalendarDays, Calculator, Lock } from "lucide-react";

dayjs.locale("fr");

/* =========================
   API helpers
   ========================= */
const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  process.env.REACT_APP_API_BASE ||
  "/api";

async function parseJsonOrThrow(r) {
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await r.text();
    throw new Error(`Réponse non-JSON (status ${r.status}) — extrait: ${text.slice(0, 120)}...`);
  }
  return r.json();
}
async function apiGet(path) {
  const r = await fetch(`${API_BASE}${path}`, { credentials: "same-origin" });
  if (!r.ok) {
    const msg = await r.text().catch(() => r.statusText);
    throw new Error(`HTTP ${r.status} — ${msg?.slice?.(0, 120) || r.statusText}`);
  }
  return parseJsonOrThrow(r);
}
async function apiJson(method, path, body, editToken) {
  const headers = { "Content-Type": "application/json" };
  if (editToken) headers["Authorization"] = `Bearer ${editToken}`;
  const r = await fetch(`${API_BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });
  if (method === "DELETE") {
    if (!r.ok) {
      const msg = await r.text().catch(() => r.statusText);
      throw new Error(`HTTP ${r.status} — ${msg?.slice?.(0, 120) || r.statusText}`);
    }
    return true;
  }
  if (!r.ok) {
    const msg = await r.text().catch(() => r.statusText);
    throw new Error(`HTTP ${r.status} — ${msg?.slice?.(0, 120) || r.statusText}`);
  }
  return parseJsonOrThrow(r);
}

/* =========================
   Edit Auth (clé d’édition)
   ========================= */
function useEditAuth() {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem("edit_token") || ""; } catch { return ""; }
  });
  const [checking, setChecking] = useState(false);
  const isAuth = !!token;

  const logout = () => {
    try { localStorage.removeItem("edit_token"); } catch {}
    setToken("");
  };

  // Vérifie le token courant (au démarrage et si jamais il change)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) return;
      try {
        setChecking(true);
        const r = await fetch(`${API_BASE}/auth/check`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "same-origin",
        });
        if (!alive) return;
        if (!r.ok) logout();
      } catch {
        if (alive) logout();
      } finally {
        if (alive) setChecking(false);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  // ✅ nouvelle API pour se connecter : ne stocke le token QUE s’il est validé
  const verifyAndLogin = async (candidate) => {
    const r = await fetch(`${API_BASE}/auth/check`, {
      headers: { Authorization: `Bearer ${candidate}` },
      credentials: "same-origin",
    });
    if (!r.ok) throw new Error("invalid");
    try { localStorage.setItem("edit_token", candidate); } catch {}
    setToken(candidate);
  };

  return { token, isAuth, checking, verifyAndLogin, logout };
}

function EditAuthModal({ open, onClose, onValid }) {
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const tryUnlock = async () => {
    setErr("");
    if (!value) { setErr("Veuillez entrer une clé."); return; }
    setBusy(true);
    try {
      await onValid(value);   // appelle useEditAuth().verifyAndLogin
      onClose();              // fermer seulement si validée
    } catch {
      setErr("Clé invalide.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          🔒 Déverrouiller l’édition
        </h3>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          Entrez la clé d’édition pour activer l’ajout, la modification et la suppression.
        </p>

        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Clé d’édition"
          disabled={busy}
          className="mb-2 w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />

        {err && (
          <p className="mb-3 text-sm text-rose-600 dark:text-rose-400">
            {err}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl bg-slate-200 px-3 py-2 text-slate-800 hover:bg-slate-300 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={tryUnlock}
            disabled={busy}
            className="rounded-xl bg-indigo-600 px-3 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? "Vérification..." : "Déverrouiller"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Local Storage Hook (thème)
   ========================= */
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; }
    catch { return initialValue; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error("localStorage write error", e); }
  }, [key, value]);
  return [value, setValue];
}

/* =========================
   Export CSV
   ========================= */
function downloadCSV(filename, rows) {
  const headers = ["Date", "Métrage (m)"];
  const csv = [headers, ...rows.map((r) => [r.date, r.distance])]
    .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* =========================
   Dark mode
   ========================= */
function useTheme() {
  const [isDark, setIsDark] = useLocalStorage("theme_dark", false);
  useEffect(() => { document.documentElement.classList.toggle("dark", isDark); }, [isDark]);
  return { isDark, toggleTheme: () => setIsDark((v) => !v) };
}
function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Passer en clair" : "Passer en sombre"}
      className="inline-flex items-center justify-center rounded-xl bg-slate-200 p-2 text-slate-900 shadow hover:bg-slate-300 dark:bg-slate-700/70 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

/* =========================
   KPIs
   ========================= */
function KpiChip({ title, subtitle, icon, value }) {
  return (
    <div className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <div className="hidden sm:flex text-slate-900 dark:text-slate-100">
        {React.cloneElement(icon, { className: "w-5 h-5 text-current" })}
      </div>
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-wide text-slate-600 dark:text-slate-300">{title}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{subtitle}</p>
      </div>
      <div className="ml-2 text-lg font-bold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

/* =========================
   Hook dark mode state
   ========================= */
function useIsDark() {
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

/* =========================
   Formulaire ajout (readOnly support)
   ========================= */
function AddSessionForm({ onAdd, onExport, readOnly }) {
  const [distance, setDistance] = useState("");
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));

  const submit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!distance || isNaN(distance)) return;
    const finalDate = useCustomDate ? date : dayjs().format("YYYY-MM-DD");
    await onAdd({ id: uuidv4(), distance: Number(distance), date: finalDate });
    setDistance(""); setUseCustomDate(false);
  };

  const disabledCls = "opacity-60 cursor-not-allowed";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <label className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-inner dark:border-slate-700 dark:bg-slate-800/80">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-600 group-hover:text-slate-800 dark:text-slate-300 dark:group-hover:text-slate-100">
            Métrage (m)
          </span>
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="ex: 1000"
            disabled={readOnly}
            className={`mt-1 w-full rounded-xl bg-transparent p-2 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 dark:placeholder:text-slate-400 ${readOnly ? disabledCls : ""}`}
          />
        </label>
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-inner dark:border-slate-700 dark:bg-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Date personnalisée
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">Utilise aujourd’hui si désactivé</span>
            </div>
            <button
              type="button"
              onClick={() => !readOnly && setUseCustomDate((v) => !v)}
              disabled={readOnly}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${useCustomDate ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"} ${readOnly ? disabledCls : ""}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${useCustomDate ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          {useCustomDate && (
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={readOnly}
                className={`mt-1 w-full rounded-xl bg-transparent p-2 pr-10 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 ${readOnly ? disabledCls : ""}`}
              />
              <CalendarDays size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300 pointer-events-none" />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={readOnly}
          className={`inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500 ${readOnly ? disabledCls : ""}`}
        >
          <Plus size={16} /> Ajouter la séance
        </button>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-500"
        >
          <Download size={16} /> Exporter en CSV
        </button>
      </div>
    </form>
  );
}

/* =========================
   Graphiques
   ========================= */
function SwimChart({ sessions }) {
  const isDark = useIsDark();
  const avgAll = useMemo(() => sessions.length ? Math.round(sessions.reduce((a, s) => a + (Number(s.distance) || 0), 0) / sessions.length) : 0, [sessions]);
  const data = useMemo(() => [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date)).map((s) => ({ ...s, dateLabel: dayjs(s.date).format("DD/MM") })), [sessions]);

  if (!data.length) return <p className="text-sm text-slate-600 dark:text-slate-300">Aucune donnée encore.</p>;

  return (
    <div className="h-72 w-full text-slate-900 dark:text-slate-100">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeOpacity={0.12} strokeDasharray="3 3" />
          <XAxis
            dataKey="dateLabel" interval={0} tickMargin={10} padding={{ right: 20 }} tick={{ fill: "currentColor" }}
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
function MonthlyBarChart({ sessions }) {
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
    <div className="h-72 w-full text-slate-900 dark:text-slate-100">
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

/* =========================
   Historique (readOnly support)
   ========================= */
function History({ sessions, onDelete, onEdit, readOnly }) {
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editDistance, setEditDistance] = useState("");
  const perPage = 5;

  if (!sessions.length) return <p className="text-sm text-slate-600 dark:text-slate-300">Aucune séance enregistrée.</p>;

  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalPages = Math.ceil(sorted.length / perPage);
  const currentData = sorted.slice((page - 1) * perPage, page * perPage);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const startEdit = (s) => {
    if (readOnly) return;
    setEditId(s.id); setEditDate(s.date); setEditDistance(s.distance);
  };
  const saveEdit = () => {
    if (readOnly) return;
    onEdit(editId, { date: editDate, distance: Number(editDistance) });
    setEditId(null);
  };

  const disabledCls = "opacity-60 cursor-not-allowed";

  return (
    <div className="overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-white/80 backdrop-blur dark:ring-slate-700 dark:bg-slate-900/60">
      <div className="p-5">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Métrage (m)</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {currentData.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                  {editId === s.id ? (
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      disabled={readOnly}
                      className={`rounded-lg border border-slate-300 bg-white p-1 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 ${readOnly ? disabledCls : ""}`}
                    />
                  ) : (
                    dayjs(s.date).format("DD-MM-YYYY")
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                  {editId === s.id ? (
                    <input
                      type="number"
                      value={editDistance}
                      onChange={(e) => setEditDistance(e.target.value)}
                      disabled={readOnly}
                      className={`w-24 rounded-lg border border-slate-300 bg-white p-1 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 ${readOnly ? disabledCls : ""}`}
                    />
                  ) : (
                    s.distance
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editId === s.id ? (
                    <div className="inline-flex gap-2">
                      <button
                        className={`rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white ${readOnly ? disabledCls : ""}`}
                        onClick={saveEdit}
                        disabled={readOnly}
                      >
                        Sauver
                      </button>
                      <button
                        className={`rounded-lg bg-slate-500 px-3 py-1.5 text-sm font-medium text-white ${readOnly ? disabledCls : ""}`}
                        onClick={() => setEditId(null)}
                        disabled={readOnly}
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex gap-2">
                      <button
                        className={`rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white ${readOnly ? disabledCls : ""}`}
                        onClick={() => startEdit(s)}
                        disabled={readOnly}
                      >
                        Modifier
                      </button>
                      <button
                        className={`rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white ${readOnly ? disabledCls : ""}`}
                        onClick={() => onDelete(s.id)}
                        disabled={readOnly}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
          <button
            onClick={goPrev}
            disabled={page === 1}
            className="rounded-lg px-3 py-1 font-medium hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-slate-700/60"
          >
            ◀ Précédent
          </button>
          <span className="text-sm">
            Page <span className="font-semibold">{page}</span> sur <span className="font-semibold">{totalPages}</span>
          </span>
          <button
            onClick={goNext}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1 font-medium hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-slate-700/60"
          >
            Suivant ▶
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   App principale
   ========================= */
export default function App() {
  const { token: editToken, isAuth, checking, verifyAndLogin, logout: editLogout } = useEditAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiGet("/sessions");
        if (alive) setSessions(data);
      } catch (e) {
        if (alive) setError("Chargement impossible : " + (e?.message || "erreur inconnue"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const nf = useMemo(() => new Intl.NumberFormat("fr-FR"), []);
  const monthKey = dayjs().format("YYYY-MM");
  const monthLabel = dayjs().format("MMMM YYYY");

  const totalMonth = useMemo(
    () => sessions.reduce((sum, s) => (dayjs(s.date).format("YYYY-MM") === monthKey ? sum + (Number(s.distance) || 0) : sum), 0),
    [sessions, monthKey]
  );
  const totalAll = useMemo(() => sessions.reduce((sum, s) => sum + (Number(s.distance) || 0), 0), [sessions]);
  const avgPerSession = useMemo(() => (sessions.length ? Math.round(totalAll / sessions.length) : 0), [sessions.length, totalAll]);
  const totalSessions = sessions.length;

  // Guard réseau : même si l’UI est disabled, on sécurise.
  const guard = (fn) => (...args) => {
    if (checking) return;       // attend la vérification initiale
    if (!isAuth) { setShowEditModal(true); return; }
    return fn(...args);
  };

  const addSession = guard(async (payload) => {
    const body = { id: payload.id, distance: payload.distance, date: payload.date };
    const created = await apiJson("POST", "/sessions", body, editToken);
    setSessions((prev) => [...prev, created]);
  });
  const deleteSession = guard(async (id) => {
    await apiJson("DELETE", `/sessions/${id}`, undefined, editToken);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  });
  const editSession = guard(async (id, updated) => {
    await apiJson("PUT", `/sessions/${id}`, updated, editToken);
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  });
  const exportCSV = () => downloadCSV("natation_sessions.csv", sessions);

  // classes de flou/lock visuel quand lecture seule
  const lockedMask =
    !isAuth
      ? "pointer-events-none select-none blur-[1.5px] grayscale-[.3] opacity-75"
      : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-white px-4 xl:px-12 py-8 dark:from-[#0b1020] dark:via-[#0a1028] dark:to-[#0b1228]">
      <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 dark:text-slate-100">🏊‍♂️ Suivi Natation</h1>
          <ThemeToggle />
          <button
            onClick={() => (isAuth ? editLogout() : setShowEditModal(true))}
            className={`ml-2 rounded-xl px-3 py-2 text-sm ${isAuth ? "bg-rose-600 text-white hover:bg-rose-500" : "bg-amber-500 text-white hover:bg-amber-400"}`}
            title={isAuth ? "Repasser en lecture seule" : "Déverrouiller l’édition"}
          >
            {isAuth ? "🔒 Verrouiller" : "🔓 Éditer"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
          <KpiChip
            title="Total du mois"
            subtitle={monthLabel}
            value={<>{nf.format(totalMonth)} <span className="text-xs opacity-70">m</span></>}
            icon={<CalendarDays size={18} />}
          />
          <KpiChip
            title="Moyenne / séance"
            subtitle="Toutes séances"
            value={<>{nf.format(avgPerSession)} <span className="text-xs opacity-70">m</span></>}
            icon={<Calculator size={18} />}
          />
        </div>
      </header>

      {/* Messages de statut */}
      {loading && <p className="mb-4 rounded-xl bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">⏳ Chargement des données…</p>}
      {error && <p className="mb-4 rounded-xl bg-rose-100 px-3 py-2 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">{error}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_3fr] gap-x-6 gap-y-2 items-start">
        {/* Bloc gauche Options + Historique */}
        <section className="relative self-start order-1 overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-white/80 backdrop-blur dark:ring-slate-700 dark:bg-slate-900/60">
          {/* bandeau lock si lecture seule */}
          {!isAuth && (
            <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
              <Lock size={14} /> Mode lecture seule — cliquez “Éditer” pour déverrouiller
            </div>
          )}

          {/* contenu flouté/désactivé si non-auth */}
          <div className={`${lockedMask}`}>
            <div className="flex items-center justify-between border-b px-5 py-4 dark:border-slate-700 dark:bg-slate-800/70">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">📘 Options</h2>
            </div>
            <div className="p-5">
              <AddSessionForm onAdd={addSession} onExport={exportCSV} readOnly={!isAuth} />
            </div>
            <div className="hidden xl:block border-t dark:border-slate-700" />
            <div className="hidden xl:block px-5 pt-5 pb-5">
              <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">📋 Historique</h3>
              <History sessions={sessions} onDelete={deleteSession} onEdit={editSession} readOnly={!isAuth} />
            </div>
          </div>
        </section>

        {/* Colonne droite (graphiques) */}
        <section className="flex flex-col gap-6 self-start order-2">
          <div className="overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-white/80 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-5 py-4 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                📈 Séances <span className="ml-2 text-sm font-normal text-slate-600 dark:text-slate-300">({totalSessions})</span>
              </h2>
            </div>
            <div className="p-5">
              <SwimChart sessions={sessions} />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-white/80 dark:ring-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b px-5 py-4 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">📊 Cumulatif par mois</h2>
            </div>
            <div className="p-5">
              <MonthlyBarChart sessions={sessions} />
            </div>
          </div>
        </section>
      </div>

      {/* Modal clé d'édition */}
      <EditAuthModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onValid={verifyAndLogin}   // ✅ passe la bonne fonction ici
      />
    </div>
  );
}
