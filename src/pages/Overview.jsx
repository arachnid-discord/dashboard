import React, { useEffect, useState } from "react";
import { Users, Activity, Gauge, Server } from "lucide-react";
import { Card } from "../components/ui";
import { getStats, getGuildAnalytics } from "../lib/api";
import { useGuild } from "../context/GuildContext";

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#00b8ff]/10 border border-[#00b8ff]/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#00b8ff]" />
        </div>
        <div>
          <div className="text-[20px] font-semibold text-white leading-none">{value}</div>
          <div className="text-[12px] text-white/40 mt-1">{label}</div>
        </div>
      </div>
    </Card>
  );
}

function MiniBarChart({ label, dates, values, color = "#00b8ff" }) {
  const max = Math.max(1, ...values);
  return (
    <div>
      <div className="text-[12px] text-white/40 mb-2">{label}</div>
      <div className="flex items-end gap-1 h-20">
        {values.map((v, i) => (
          <div
            key={i}
            title={`${dates[i]}: ${v}`}
            className="flex-1 rounded-t"
            style={{
              height: `${Math.max(4, (v / max) * 100)}%`,
              background: color,
              opacity: 0.35 + (v / max) * 0.65,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Overview() {
  const { guildId, info } = useGuild();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
    getGuildAnalytics(guildId).then(setAnalytics).catch(() => {});
  }, [guildId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Overview</h1>
        <p className="text-white/40 text-[13px] mt-1">
          {info?.member_count?.toLocaleString()} members · prefix{" "}
          <code className="text-white/60">{info?.prefix}</code>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Members" value={info?.member_count?.toLocaleString() ?? "—"} />
        <StatCard icon={Server} label="Servers (bot-wide)" value={stats?.servers ?? "—"} />
        <StatCard icon={Gauge} label="Latency" value={stats ? `${stats.latency}ms` : "—"} />
        <StatCard icon={Activity} label="Uptime" value={stats ? formatUptime(stats.uptime) : "—"} />
      </div>

      {analytics && (
        <Card>
          <div className="text-[15px] font-semibold text-white mb-4">
            Last 14 days — {analytics.guild_name}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MiniBarChart label="Joins" dates={analytics.dates} values={analytics.joins} color="#22c55e" />
            <MiniBarChart label="Leaves" dates={analytics.dates} values={analytics.leaves} color="#ef4444" />
            <MiniBarChart label="Messages" dates={analytics.dates} values={analytics.messages} />
            <MiniBarChart label="Voice minutes" dates={analytics.dates} values={analytics.voice} color="#a855f7" />
          </div>
        </Card>
      )}
    </div>
  );
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
