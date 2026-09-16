import React, { useEffect, useState } from "react";
import { Card, CardHeader, EmptyState, LoadingScreen } from "../components/ui";
import {
  getLastfmProfile, getLastfmNowPlaying, getLastfmTopArtists,
  getLastfmTopTracks, getLastfmGenres,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function LastFm() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [now, setNow] = useState(null);
  const [artists, setArtists] = useState(null);
  const [tracks, setTracks] = useState(null);
  const [genres, setGenres] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    getLastfmProfile(user.id).then(setProfile).catch((e) => setError(e.message));
    getLastfmNowPlaying(user.id).then(setNow).catch(() => setNow(null));
    getLastfmTopArtists(user.id, { period: "1month" }).then((r) => setArtists(r.artists || r)).catch(() => setArtists([]));
    getLastfmTopTracks(user.id, { period: "1month" }).then((r) => setTracks(r.tracks || r)).catch(() => setTracks([]));
    getLastfmGenres(user.id).then((r) => setGenres(r.genres || r)).catch(() => setGenres([]));
  }, [user]);

  if (error) return <Card><EmptyState>{error} — link Last.fm with your account first.</EmptyState></Card>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Last.fm</h1>

      <Card>
        <CardHeader title="Now playing" />
        {!now ? <EmptyState>Nothing scrobbling right now.</EmptyState> : (
          <div className="flex items-center gap-4">
            {now.image && <img src={now.image} alt="" className="w-14 h-14 rounded-lg" />}
            <div>
              <div className="text-[14px] font-medium text-white">{now.track}</div>
              <div className="text-[13px] text-white/40">{now.artist}</div>
            </div>
          </div>
        )}
      </Card>

      {profile && (
        <Card>
          <CardHeader title={`Profile — ${profile.username || ""}`} />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><div className="text-[18px] font-semibold text-white">{profile.playcount ?? "—"}</div><div className="text-[11px] text-white/40">Scrobbles</div></div>
            <div><div className="text-[18px] font-semibold text-white">{profile.artist_count ?? "—"}</div><div className="text-[11px] text-white/40">Artists</div></div>
            <div><div className="text-[18px] font-semibold text-white">{profile.track_count ?? "—"}</div><div className="text-[11px] text-white/40">Tracks</div></div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Top artists (30d)" />
          {!artists ? <LoadingScreen /> : artists.length === 0 ? <EmptyState>No data.</EmptyState> : (
            <div className="divide-y divide-white/[0.05]">
              {artists.slice(0, 10).map((a, i) => (
                <div key={i} className="py-2 flex items-center gap-3 text-[13px]">
                  <span className="text-white/25 font-mono w-5">{i + 1}</span>
                  <span className="text-white/70 truncate flex-1">{a.name}</span>
                  <span className="text-white/30">{a.playcount}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Top tracks (30d)" />
          {!tracks ? <LoadingScreen /> : tracks.length === 0 ? <EmptyState>No data.</EmptyState> : (
            <div className="divide-y divide-white/[0.05]">
              {tracks.slice(0, 10).map((t, i) => (
                <div key={i} className="py-2 flex items-center gap-3 text-[13px]">
                  <span className="text-white/25 font-mono w-5">{i + 1}</span>
                  <span className="text-white/70 truncate flex-1">{t.name}</span>
                  <span className="text-white/30">{t.playcount}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {genres && genres.length > 0 && (
        <Card>
          <CardHeader title="Top genres" />
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 15).map((g, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full text-[12px] bg-white/[0.05] text-white/60 border border-white/[0.08]">
                {g.name || g}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
