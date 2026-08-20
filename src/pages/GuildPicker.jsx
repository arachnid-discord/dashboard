import React from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { buildInviteUrl, CLIENT_ID } from "../lib/auth";
import { LoadingScreen, ErrorBanner, EmptyState, Badge } from "../components/ui";
import Navbar from "../components/Navbar";

export default function GuildPicker() {
  const { guilds, loading, error } = useAuth();
  const navigate = useNavigate();

  if (loading)
    return (
      <>
        <Navbar />
        <LoadingScreen label="Loading your servers…" />
      </>
    );

  const handleSelect = (g) => {
    if (g.botPresent) {
      navigate(`/g/${g.id}`);
    } else {
      // Send them to Discord's bot-invite flow, pre-selected to this
      // server, instead of into a dashboard that has nothing to manage yet.
      window.open(buildInviteUrl(g.id), "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen px-4 pt-32 pb-16">
      <Navbar />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-1">Select a server</h1>
        <p className="text-white/40 text-[14px] mb-8">
          Servers where you have Manage Server permissions.
        </p>

        <ErrorBanner message={error} />
        {!error && !CLIENT_ID && (
          <ErrorBanner message="VITE_DISCORD_CLIENT_ID is not set — adding the bot to a new server won't work until it is." />
        )}

        {!error && guilds.length === 0 && (
          <EmptyState>You don't manage any servers with this Discord account.</EmptyState>
        )}

        <div className="space-y-2">
          {guilds.map((g) => (
            <button
              key={g.id}
              onClick={() => handleSelect(g)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
            >
              {g.icon ? (
                <img src={g.icon} alt="" className="w-10 h-10 rounded-xl" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/40 text-sm font-medium">
                  {g.name.slice(0, 1)}
                </div>
              )}
              <span className="flex-1 text-[14px] text-white font-medium">{g.name}</span>
              {g.botPresent ? (
                <Badge tone="accent">Manage</Badge>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border text-white/50 border-white/15 bg-white/[0.04]">
                  <UserPlus className="w-3 h-3" />
                  Add bot
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
