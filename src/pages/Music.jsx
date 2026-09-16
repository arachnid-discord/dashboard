import React, { useEffect, useState } from "react";
import { Play, Pause, SkipForward, Square, Shuffle } from "lucide-react";
import { Card, CardHeader, Button, EmptyState, LoadingScreen } from "../components/ui";
import { getMusicState, musicControl, getMusicHistory, getPlaylists, playPlaylist } from "../lib/api";
import { useGuild } from "../context/GuildContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

function formatMs(ms) {
  const s = Math.floor((ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Music() {
  const { guildId } = useGuild();
  const { user } = useAuth();
  const { push } = useToast();
  const [state, setState] = useState(null);
  const [history, setHistory] = useState(null);
  const [playlists, setPlaylists] = useState(null);

  useEffect(() => {
    if (!user) return;
    getPlaylists(user.id).then((r) => setPlaylists(r.playlists || r)).catch(() => setPlaylists([]));
  }, [user]);

  const playMyPlaylist = async (playlistId) => {
    try {
      await playPlaylist(user.id, { guild_id: guildId, playlist_id: playlistId });
      push({ type: "success", message: "Playing playlist." });
      setTimeout(refresh, 500);
    } catch (e) {
      push({ type: "error", message: e.message });
    }
  };

  const refresh = () => {
    getMusicState(guildId).then(setState).catch(() => {});
  };

  useEffect(() => {
    refresh();
    getMusicHistory(guildId).then((r) => setHistory(r.history)).catch(() => setHistory([]));
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [guildId]);

  const control = async (action, value) => {
    try {
      await musicControl({ guild_id: guildId, action, value });
      setTimeout(refresh, 500);
    } catch (e) {
      push({ type: "error", message: e.message });
    }
  };

  if (!state) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Music</h1>

      <Card>
        {!state.current ? (
          <EmptyState>Nothing is currently playing.</EmptyState>
        ) : (
          <div className="flex items-center gap-4">
            {state.current.artwork && (
              <img src={state.current.artwork} alt="" className="w-16 h-16 rounded-lg" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium text-white truncate">{state.current.title}</div>
              <div className="text-[13px] text-white/40 truncate">{state.current.author}</div>
              <div className="text-[11px] text-white/25 font-mono mt-1">
                {formatMs(state.position * 1000)} / {formatMs(state.current.duration)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => control("toggle")}>
                {state.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              <Button variant="secondary" onClick={() => control("skip")}>
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button variant="secondary" onClick={() => control("shuffle")}>
                <Shuffle className="w-4 h-4" />
              </Button>
              <Button variant="danger" onClick={() => control("stop")}>
                <Square className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {state.queue?.length > 0 && (
        <Card>
          <CardHeader title={`Queue (${state.queue.length})`} />
          <div className="divide-y divide-white/[0.05]">
            {state.queue.map((t, i) => (
              <div key={i} className="py-2 flex items-center gap-3 text-[13px]">
                <span className="text-white/25 font-mono w-5">{i + 1}</span>
                <span className="text-white/70 truncate flex-1">{t.title}</span>
                <span className="text-white/30 truncate">{t.author}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {playlists && (
        <Card>
          <CardHeader title="Your playlists" />
          {playlists.length === 0 ? <EmptyState>No saved playlists yet.</EmptyState> : (
            <div className="divide-y divide-white/[0.05]">
              {playlists.map((p) => (
                <div key={p.id} className="py-2 flex items-center gap-3 text-[13px]">
                  <span className="text-white/70 truncate flex-1">{p.name}</span>
                  <span className="text-white/30">{p.track_count ?? p.tracks?.length ?? 0} tracks</span>
                  <Button variant="secondary" onClick={() => playMyPlaylist(p.id)}>
                    <Play className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card>
        <CardHeader title="Recently played" />
        {!history && <LoadingScreen />}
        {history && history.length === 0 && <EmptyState>No history yet.</EmptyState>}
        {history && history.length > 0 && (
          <div className="divide-y divide-white/[0.05]">
            {history.map((h, i) => (
              <div key={i} className="py-2 flex items-center gap-3 text-[13px]">
                <span className="text-white/70 truncate flex-1">{h.title}</span>
                <span className="text-white/30 truncate">{h.artist}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
