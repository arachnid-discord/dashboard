import { getToken, clearToken } from "./auth";

// Same base the old dashboard used (assets/js/dashboard.js): a Tailscale
// Funnel URL to the bot's local Quart server. Revisit for a stable public
// API domain later -- kept as-is for now per project decision.
export const API_BASE =
  import.meta.env.VITE_API_BASE || "https://desktop-mo3r1pj.tailb9e0a9.ts.net/api";

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
    window.location.href = "/dashboard/login";
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
export const getStats = () => api.get("/stats");
export const getBotGuilds = () => api.get("/bot/guild-ids");

// --- Guild ---
export const getGuildInfo = (guildId) => api.get(`/guild/${guildId}/info`);
export const getGuildAnalytics = (guildId) => api.get(`/analytics/${guildId}`);

// --- Settings (generic dispatcher; matches GUILD_SETTINGS_SECTIONS on the bot) ---
export const getSettings = (guildId, section) =>
  api.get(`/guild/${guildId}/settings/${section}`);
export const saveSettings = (guildId, section, payload) =>
  api.post(`/guild/${guildId}/settings/${section}`, payload);

// --- Moderation ---
export const getModStats = (guildId) => api.get(`/mod/stats/${guildId}`);
export const getModLogs = (guildId, params) => api.get(`/mod/logs/${guildId}`, params);
export const getModUser = (guildId, q) => api.get(`/mod/user/${guildId}`, { q });
export const modAction = (payload) => api.post("/mod/action", payload);
export const getBans = (guildId) => api.get(`/mod/bans/${guildId}`);
export const getMembers = (guildId, q) => api.get(`/mod/members/${guildId}`, { q });
export const getRoles = (guildId) => api.get(`/mod/roles/${guildId}`);

// --- Music ---
export const getMusicState = (guildId) => api.get(`/music/state/${guildId}`);
export const musicControl = (payload) => api.post("/music/control", payload);
export const getMusicHistory = (guildId) => api.get(`/music/history/${guildId}`);
export const getMusicTopSongs = (guildId) => api.get(`/music/topsongs/${guildId}`);
export const musicSearch = (params) => api.get("/music/search", params);
export const musicFix = (payload) => api.post("/music/fix", payload);
export const getUserVoice = (guildId, userId) => api.get(`/user/voice/${guildId}/${userId}`);

// --- Playlists ---
export const getPlaylists = (userId) => api.get(`/playlists/${userId}`);
export const createPlaylist = (userId, payload) => api.post(`/playlists/${userId}/create`, payload);
export const deletePlaylist = (userId, payload) => api.post(`/playlists/${userId}/delete`, payload);
export const renamePlaylist = (userId, payload) => api.post(`/playlists/${userId}/rename`, payload);
export const removePlaylistTrack = (userId, payload) =>
  api.post(`/playlists/${userId}/remove_track`, payload);
export const playPlaylist = (userId, payload) => api.post(`/playlists/${userId}/play`, payload);

// --- Prefs ---
export const getPrefs = (userId) => api.get(`/prefs/${userId}`);
export const savePrefs = (userId, payload) => api.post(`/prefs/${userId}`, payload);

// --- Last.fm ---
export const getLastfmProfile = (userId) => api.get(`/lastfm/profile/${userId}`);
export const getLastfmNowPlaying = (userId) => api.get(`/lastfm/nowplaying/${userId}`);
export const getLastfmTopArtists = (userId, params) => api.get(`/lastfm/topartists/${userId}`, params);
export const getLastfmTopTracks = (userId, params) => api.get(`/lastfm/toptracks/${userId}`, params);
export const getLastfmWeeklyArtists = (userId) => api.get(`/lastfm/weeklyartists/${userId}`);
export const getLastfmGenres = (userId) => api.get(`/lastfm/genres/${userId}`);
export const getLastfmHeatmap = (userId) => api.get(`/lastfm/heatmap/${userId}`);
export const getLastfmChart = (userId, params) => api.get(`/lastfm/chart/${userId}`, params);

// --- Stocks ---
export const getStocksMarket = () => api.get("/stocks/market");
export const getStocksPortfolio = (userId) => api.get(`/stocks/portfolio/${userId}`);
export const getStocksLeaderboard = () => api.get("/stocks/leaderboard");
export const stocksTrade = (payload) => api.post("/stocks/trade", payload);

// --- Voice Call (VC bridge) ---
export const getVcGuilds = () => api.get("/vc/guilds");
export const getVcStatus = (params) => api.get("/vc/status", params);
export const vcCall = (payload) => api.post("/vc/call", payload);
export const vcJoin = (payload) => api.post("/vc/join", payload);
export const vcHangup = (payload) => api.post("/vc/hangup", payload);

// --- Verification ---
export const getVerificationFlags = (guildId) => api.get(`/verification/flags/${guildId}`);
export const getVerificationFingerprints = (guildId) =>
  api.get(`/verification/fingerprints/${guildId}`);

export { ApiError };
