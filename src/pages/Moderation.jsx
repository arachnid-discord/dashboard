import React, { useEffect, useState } from "react";
import { Card, CardHeader, Field, TextInput, Select, Button, Badge, EmptyState, LoadingScreen } from "../components/ui";
import { getModLogs, modAction, getBans } from "../lib/api";
import { useGuild } from "../context/GuildContext";
import { useToast } from "../context/ToastContext";

const ACTIONS = [
  "ban", "unban", "kick", "warn", "timeout", "untimeout",
  "clearwarns", "nick", "forcenick", "forcenick_reset",
];

function ActionForm() {
  const { guildId } = useGuild();
  const { push } = useToast();
  const [form, setForm] = useState({ action: "warn", target: "", reason: "", duration: "1h" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.target) return;
    setBusy(true);
    try {
      const res = await modAction({ ...form, guild_id: guildId });
      push({ type: "success", message: res.status || "Action applied." });
      setForm((f) => ({ ...f, target: "", reason: "" }));
    } catch (err) {
      push({ type: "error", message: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Quick action" description="Runs the same logic as the equivalent slash command." />
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Action">
          <Select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Target (user ID, @mention, or name)">
          <TextInput
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
            placeholder="123456789012345678"
            required
          />
        </Field>
        {form.action === "timeout" && (
          <Field label="Duration" help="e.g. 10m, 1h, 1d">
            <TextInput value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </Field>
        )}
        {(form.action === "nick" || form.action === "forcenick") && (
          <Field label="New nickname">
            <TextInput
              value={form.extraNick || ""}
              onChange={(e) => setForm({ ...form, extraNick: e.target.value, extra: { nick: e.target.value } })}
            />
          </Field>
        )}
        <Field label="Reason" className="md:col-span-2">
          <TextInput value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </Field>
        <div className="md:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Applying…" : "Apply"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function LogsList() {
  const { guildId } = useGuild();
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getModLogs(guildId, { limit: 30 })
      .then((r) => setLogs(r.logs))
      .catch((e) => setError(e.message));
  }, [guildId]);

  return (
    <Card>
      <CardHeader title="Recent mod log" />
      {error && <p className="text-red-400 text-[13px]">{error}</p>}
      {!logs && !error && <LoadingScreen />}
      {logs && logs.length === 0 && <EmptyState>No actions logged yet.</EmptyState>}
      {logs && logs.length > 0 && (
        <div className="divide-y divide-white/[0.05]">
          {logs.map((l, i) => (
            <div key={i} className="py-2.5 flex items-center gap-3">
              <Badge tone="accent">{l.action}</Badge>
              <span className="text-[13px] text-white/70 flex-1 truncate">
                {l.target?.name} <span className="text-white/30">by</span> {l.moderator?.name}
              </span>
              {l.reason && <span className="text-[12px] text-white/30 truncate max-w-[200px]">{l.reason}</span>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function BansList() {
  const { guildId } = useGuild();
  const [bans, setBans] = useState(null);

  useEffect(() => {
    getBans(guildId).then((r) => setBans(r.bans)).catch(() => setBans([]));
  }, [guildId]);

  return (
    <Card>
      <CardHeader title="Banned users" />
      {!bans && <LoadingScreen />}
      {bans && bans.length === 0 && <EmptyState>No bans.</EmptyState>}
      {bans && bans.length > 0 && (
        <div className="divide-y divide-white/[0.05]">
          {bans.map((b) => (
            <div key={b.id} className="py-2.5 flex items-center gap-3">
              <img src={b.avatar} alt="" className="w-6 h-6 rounded-full" />
              <span className="text-[13px] text-white/70 flex-1 truncate">{b.name}</span>
              <span className="text-[12px] text-white/30 truncate max-w-[220px]">{b.reason}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function Moderation() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Moderation</h1>
      <ActionForm />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LogsList />
        <BansList />
      </div>
    </div>
  );
}
