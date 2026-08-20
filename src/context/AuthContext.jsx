import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  getToken,
  clearToken,
  fetchDiscordUser,
  fetchDiscordGuilds,
  canManageGuild,
} from "../lib/auth";
import { getBotGuilds } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]); // manageable guilds the bot is also in
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [me, myGuilds, botGuilds] = await Promise.all([
        fetchDiscordUser(token),
        fetchDiscordGuilds(token),
        getBotGuilds().catch(() => ({ guilds: [] })),
      ]);
      setUser(me);

      const botGuildIds = new Set((botGuilds.guilds || []).map((g) => g.id));
      const manageable = myGuilds
        .filter(canManageGuild)
        .map((g) => ({
          id: g.id,
          name: g.name,
          icon: g.icon
            ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
            : null,
          botPresent: botGuildIds.has(g.id),
        }));
      setGuilds(manageable);
    } catch (e) {
      setError(e.message || "Failed to load your account");
      clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const logout = () => {
    clearToken();
    setUser(null);
    setGuilds([]);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, guilds, loading, error, reload: load, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
