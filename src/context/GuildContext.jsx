import React, { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getGuildInfo } from "../lib/api";

const GuildContext = createContext(null);

export function GuildProvider({ children }) {
  const { guildId } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getGuildInfo(guildId);
        if (!cancelled) setInfo(res);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  return (
    <GuildContext.Provider value={{ guildId, info, loading, error }}>
      {children}
    </GuildContext.Provider>
  );
}

export function useGuild() {
  const ctx = useContext(GuildContext);
  if (!ctx) throw new Error("useGuild must be used within GuildProvider");
  return ctx;
}
