export const API_BASE =
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

export async function apiGet(path) {
  const r = await fetch(`${API_BASE}${path}`, { credentials: "same-origin" });
  if (!r.ok) {
    const msg = await r.text().catch(() => r.statusText);
    throw new Error(`HTTP ${r.status} — ${msg?.slice?.(0, 120) || r.statusText}`);
  }
  return parseJsonOrThrow(r);
}

export async function apiJson(method, path, body, editToken) {
  const headers = { "Content-Type": "application/json" };
  if (editToken) headers["Authorization"] = `Bearer ${editToken}`;
  const r = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
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

