import { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

export function useEditAuth() {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem("edit_token") || ""; } catch { return ""; }
  });
  const [checking, setChecking] = useState(false);
  const isAuth = !!token;

  const logout = () => {
    try { localStorage.removeItem("edit_token"); } catch {}
    setToken("");
  };

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

