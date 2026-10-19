// =====================================================================
// lib/api.js
// The ONLY file pages use to talk to the backend. One exported async
// function per endpoint. This file is identical in mock mode and real
// mode - pages never change when a route is switched to real SQL.
//
// Every function:
//   1. fetch()es the endpoint (same-origin, so the session cookie goes along),
//   2. parses the JSON body,
//   3. throws Error(data.error) on a non-2xx response, so pages can show
//      the server's message in a toast.
// =====================================================================

async function request(path, options = {}) {
  const res = await fetch(path, { credentials: "same-origin", ...options });
  let data = {};
  try {
    data = await res.json();
  } catch {
    // Non-JSON body: fall through with an empty object.
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function post(path, body) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
}

// ---------- auth ----------
export function register(payload) {
  return post("/api/register", payload);
}
export function login(email, password) {
  return post("/api/login", { email, password });
}
export function logout() {
  return post("/api/logout");
}
export function getMe() {
  return request("/api/me");
}

// ---------- dropdown data ----------
export function getCategories() {
  return request("/api/categories");
}
export function getLocations() {
  return request("/api/locations");
}

// ---------- lost reports ----------
export function createLost(payload) {
  return post("/api/lost", payload);
}
export function getMyLost() {
  return request("/api/lost/mine");
}
export function closeLostReport(reportId) {
  return request(`/api/lost/${reportId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "closed" }),
  });
}
export function getMatches(reportId) {
  return request(`/api/lost/${reportId}/matches`);
}
export function rematchReport(reportId) {
  return post(`/api/lost/${reportId}/rematch`);
}

// ---------- found items ----------
export function createFound(payload) {
  return post("/api/found", payload);
}
export function getFound(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.location) params.set("location", filters.location);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const qs = params.toString();
  return request(`/api/found${qs ? `?${qs}` : ""}`);
}
export function getFoundItem(itemId) {
  return request(`/api/found/${itemId}`);
}

// ---------- claims ----------
export function submitClaim(payload) {
  return post("/api/claims", payload);
}
export function getMyClaims() {
  return request("/api/claims/mine");
}

// ---------- admin ----------
export function getAdminClaims(status = "pending") {
  return request(`/api/admin/claims?status=${encodeURIComponent(status)}`);
}
export function verifyClaim(claimId, adminNote) {
  return post(`/api/admin/claims/${claimId}/verify`, { admin_note: adminNote });
}
export function rejectClaim(claimId, adminNote) {
  return post(`/api/admin/claims/${claimId}/reject`, { admin_note: adminNote });
}
export function getAdminStats() {
  return request("/api/admin/stats");
}
export function getAdminAudit() {
  return request("/api/admin/audit");
}
