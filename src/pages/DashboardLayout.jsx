import React from "react";
import { NavLink, Outlet, useParams, Link } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { GuildProvider, useGuild } from "../context/GuildContext";
import { useAuth } from "../context/AuthContext";
import { NAV_GROUPS } from "../config/nav";
import { LoadingScreen, ErrorBanner } from "../components/ui";

function Sidebar() {
  const { guildId } = useParams();
  const { info } = useGuild();

  return (
    <aside className="w-60 flex-shrink-0 border-r border-white/[0.08] bg-[#0a0b0f] flex flex-col">
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/[0.08]">
        <Link to="/guilds" className="text-white/30 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        {info?.icon ? (
          <img src={info.icon} alt="" className="w-7 h-7 rounded-lg" />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-white/[0.06]" />
        )}
        <span className="text-[13px] font-medium text-white truncate">
          {info?.name || "Loading…"}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <div className="text-[10px] uppercase tracking-wide text-white/25 font-medium mb-1.5 px-2">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const to = `/g/${guildId}${item.to ? `/${item.to}` : ""}`;
                return (
                  <NavLink
                    key={item.to}
                    to={to}
                    end={item.to === ""}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                        isActive
                          ? "bg-[#00b8ff]/10 text-[#00b8ff] font-medium"
                          : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function Topbar() {
  const { user, logout } = useAuth();
  return (
    <header className="h-16 border-b border-white/[0.08] flex items-center justify-end gap-3 px-6">
      {user && (
        <div className="flex items-center gap-2">
          {user.avatar ? (
            <img
              src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
              alt=""
              className="w-7 h-7 rounded-full"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/[0.06]" />
          )}
          <span className="text-[13px] text-white/60">{user.username}</span>
        </div>
      )}
      <button
        onClick={logout}
        className="text-white/30 hover:text-red-400 transition-colors"
        aria-label="Log out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </header>
  );
}

function GuildShell() {
  const { info, loading, error } = useGuild();
  return (
    <div className="flex min-h-screen bg-[#08090c]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {loading && !info ? (
            <LoadingScreen />
          ) : error ? (
            <ErrorBanner message={error} />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <GuildProvider>
      <GuildShell />
    </GuildProvider>
  );
}
