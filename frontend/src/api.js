const API = "http://localhost:8080/api";

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401 && !path.startsWith("/auth")) {
    localStorage.removeItem("token");
    if (window.location.pathname !== "/login") window.location.href = "/login";
  }
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { msg = (await r.json()).error || msg; } catch { /* no body */ }
    throw new Error(msg);
  }
  return r.status === 204 ? null : r.json();
}