import { getToken, clearToken } from "./auth";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:25739";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, params } = {}) {
  const token = getToken();
  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new ApiError("Unauthorized", 401);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }

  return data;
}

export const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body) => request(path, { method: "POST", body }),
};

// --- Bot-wide ---
export const getStats = () => api.get("/api/stats");
export const getBotGuilds = () => api.get("/api/vc/guilds");

// --- Guild ---
export const getGuildInfo = (guildId) => api.get(`/api/guild/${guildId}/info`);
export const getGuildAnalytics = (guildId) => api.get(`/api/analytics/${guildId}`);

// --- Settings (generic dispatcher) ---
export const getSettings = (guildId, section) =>
  api.get(`/api/guild/${guildId}/settings/${section}`);
export const saveSettings = (guildId, section, payload) =>
  api.post(`/api/guild/${guildId}/settings/${section}`, payload);

// --- Moderation ---
export const getModStats = (guildId) => api.get(`/api/mod/stats/${guildId}`);
export const getModLogs = (guildId, params) => api.get(`/api/mod/logs/${guildId}`, params);
export const getModUser = (guildId, q) => api.get(`/api/mod/user/${guildId}`, { q });
export const modAction = (payload) => api.post("/api/mod/action", payload);
export const getBans = (guildId) => api.get(`/api/mod/bans/${guildId}`);
export const getMembers = (guildId, q) => api.get(`/api/mod/members/${guildId}`, { q });
export const getRoles = (guildId) => api.get(`/api/mod/roles/${guildId}`);

// --- Music ---
export const getMusicState = (guildId) => api.get(`/api/music/state/${guildId}`);
export const musicControl = (payload) => api.post("/api/music/control", payload);
export const getMusicHistory = (guildId) => api.get(`/api/music/history/${guildId}`);
export const getMusicTopSongs = (guildId) => api.get(`/api/music/topsongs/${guildId}`);

export { ApiError };
