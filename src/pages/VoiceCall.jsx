import React, { useEffect, useRef, useState } from "react";
import { PhoneCall, PhoneOff } from "lucide-react";
import { Card, CardHeader, Field, TextInput, Button, EmptyState } from "../components/ui";
import { vcCall, vcJoin, vcHangup, getVcStatus } from "../lib/api";
import { API_BASE } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useGuild } from "../context/GuildContext";
import { useToast } from "../context/ToastContext";

// Real-time state over WebSocket (call_state/call_started/call_ended/speaking/
// error), with the REST /vc/status poll as a fallback when the socket drops --
// matches the old vanilla-JS dashboard's vccall.js behaviour.
export default function VoiceCall() {
  const { user } = useAuth();
  const { guildId } = useGuild();
  const { push } = useToast();
  const [call, setCall] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const wsRef = useRef(null);

  const poll = () => {
    if (!user) return;
    getVcStatus({ user_id: user.id }).then(setCall).catch(() => {});
  };

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 10000);

    try {
      const wsUrl = API_BASE.replace(/^http/, "ws").replace(/\/api$/, "") + "/ws/vc";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (["call_state", "call_started", "call_ended"].includes(msg.type)) {
            setCall(msg.data ?? null);
          }
        } catch {
          // ignore malformed frames
        }
      };
    } catch {
      // WebSocket unavailable -- REST poll above still covers it
    }

    return () => {
      clearInterval(interval);
      wsRef.current?.close();
    };
  }, [user]);

  const startCall = async () => {
    setBusy(true);
    try {
      const res = await vcCall({ user_id: user.id, guild_id: guildId });
      push({ type: "success", message: `Call code: ${res.code}` });
      poll();
    } catch (e) {
      push({ type: "error", message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const joinCall = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await vcJoin({ user_id: user.id, guild_id: guildId, code: joinCode });
      setJoinCode("");
      poll();
    } catch (e) {
      push({ type: "error", message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const hangup = async () => {
    setBusy(true);
    try {
      await vcHangup({ user_id: user.id, guild_id: guildId });
      poll();
    } catch (e) {
      push({ type: "error", message: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Voice Call</h1>

      <Card>
        <CardHeader title="Cross-server voice bridge" description="Start a call to get a code, or join with one." />
        {call?.active ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] text-white">Call active {call.code ? `— code ${call.code}` : ""}</div>
              <div className="text-[12px] text-white/40 mt-1">{call.speaking ? "Someone is speaking…" : "Connected"}</div>
            </div>
            <Button variant="danger" onClick={hangup} disabled={busy}>
              <PhoneOff className="w-4 h-4" /> Hang up
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <EmptyState>No active call.</EmptyState>
            <div className="flex flex-col md:flex-row gap-3">
              <Button onClick={startCall} disabled={busy}>
                <PhoneCall className="w-4 h-4" /> Start a call
              </Button>
              <form onSubmit={joinCall} className="flex gap-2 flex-1">
                <Field label="" className="flex-1">
                  <TextInput
                    placeholder="6-character code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </Field>
                <Button type="submit" variant="secondary" disabled={busy || !joinCode}>
                  Join
                </Button>
              </form>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
