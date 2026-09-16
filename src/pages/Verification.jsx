import React, { useEffect, useState } from "react";
import { Card, CardHeader, EmptyState, LoadingScreen, Badge } from "../components/ui";
import { getVerificationFlags, getVerificationFingerprints } from "../lib/api";
import { useGuild } from "../context/GuildContext";

export default function Verification() {
  const { guildId } = useGuild();
  const [flags, setFlags] = useState(null);
  const [fingerprints, setFingerprints] = useState(null);

  useEffect(() => {
    getVerificationFlags(guildId).then(setFlags).catch(() => setFlags([]));
    getVerificationFingerprints(guildId).then(setFingerprints).catch(() => setFingerprints([]));
  }, [guildId]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">Verification</h1>
      <p className="text-white/40 text-[13px]">
        Configure the verification role, channel, and type via <code className="text-white/60">/setup_verification</code> in
        Discord. This page shows flagged attempts and duplicate-account fingerprints.
      </p>

      <Card>
        <CardHeader title="Flagged verifications" />
        {!flags ? <LoadingScreen /> : flags.length === 0 ? <EmptyState>No flags.</EmptyState> : (
          <div className="divide-y divide-white/[0.05]">
            {flags.map((f, i) => (
              <div key={i} className="py-2.5 flex items-center gap-3 text-[13px]">
                <Badge tone="danger">{f.reason || "flagged"}</Badge>
                <span className="text-white/70 flex-1 truncate">{f.username || f.user_id}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Duplicate fingerprints" />
        {!fingerprints ? <LoadingScreen /> : fingerprints.length === 0 ? <EmptyState>No duplicates found.</EmptyState> : (
          <div className="divide-y divide-white/[0.05]">
            {fingerprints.map((f, i) => (
              <div key={i} className="py-2.5 flex items-center gap-3 text-[13px]">
                <span className="text-white/40 font-mono">{f.fingerprint?.slice(0, 12) ?? "—"}</span>
                <span className="text-white/70 flex-1 truncate">{(f.user_ids || []).join(", ")}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
