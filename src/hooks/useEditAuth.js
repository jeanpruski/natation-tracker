import { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

export function useEditAuth() {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem("auth_token") || ""; } catch { return ""; }
  });
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(false);
  const isAuth = !!token;

  const logout = () => {
    try { localStorage.removeItem("auth_token"); } catch {}
    setToken("");
    setUser(null);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) return;
      try {
        setChecking(true);
        const r = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "same-origin",
        });
        if (!alive) return;
        if (!r.ok) {
          logout();
          return;
        }
        const data = await r.json();
        if (alive) setUser(data.user || null);
      } catch {
        if (alive) logout();
      } finally {
        if (alive) setChecking(false);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  const login = async ({ email, password }) => {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "same-origin",
    });
    if (!r.ok) throw new Error("invalid");
    const data = await r.json();
    const nextToken = data?.token || "";
    if (!nextToken) throw new Error("invalid");
    try { localStorage.setItem("auth_token", nextToken); } catch {}
    setToken(nextToken);
    setUser(data?.user || null);
  };

  return { token, user, isAuth, checking, login, logout };
}
